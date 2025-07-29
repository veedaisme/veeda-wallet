import { Logger } from './logger';
import { RetryUtils, CircuitBreaker, FallbackUtils, RetryOptions, CircuitBreakerOptions } from './retry-utils';
import { ErrorHandler, ErrorCategory, AppError } from './error-handler';

/**
 * Service configuration for resilience patterns
 */
export interface ServiceConfig {
  name: string;
  retryOptions?: RetryOptions;
  circuitBreakerOptions?: CircuitBreakerOptions;
  enableCircuitBreaker?: boolean;
  enableRetry?: boolean;
  fallbackEnabled?: boolean;
}

/**
 * Service resilience manager that coordinates error handling, retries, and circuit breakers
 */
export class ServiceResilienceManager {
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private serviceConfigs: Map<string, ServiceConfig> = new Map();

  constructor() {
    this.logger = new Logger('ServiceResilience');
    this.errorHandler = new ErrorHandler();
    this.setupDefaultConfigs();
    this.logger.info('Service Resilience Manager initialized');
  }

  /**
   * Set up default configurations for common services
   */
  private setupDefaultConfigs(): void {
    // Telegram API service
    this.registerService('telegram-api', {
      name: 'telegram-api',
      enableRetry: true,
      enableCircuitBreaker: true,
      retryOptions: {
        maxAttempts: 3,
        initialDelay: 500,
        maxDelay: 5000,
        backoffFactor: 2,
        timeout: 10000,
      },
      circuitBreakerOptions: {
        failureThreshold: 5,
        resetTimeout: 30000,
      },
      fallbackEnabled: true,
    });

    // AI service
    this.registerService('ai-service', {
      name: 'ai-service',
      enableRetry: true,
      enableCircuitBreaker: true,
      retryOptions: {
        maxAttempts: 2,
        initialDelay: 1000,
        maxDelay: 8000,
        backoffFactor: 2,
        timeout: 30000,
      },
      circuitBreakerOptions: {
        failureThreshold: 3,
        resetTimeout: 60000,
      },
      fallbackEnabled: true,
    });

    // Database service
    this.registerService('database', {
      name: 'database',
      enableRetry: true,
      enableCircuitBreaker: true,
      retryOptions: {
        maxAttempts: 3,
        initialDelay: 200,
        maxDelay: 2000,
        backoffFactor: 1.5,
        timeout: 5000,
      },
      circuitBreakerOptions: {
        failureThreshold: 5,
        resetTimeout: 20000,
      },
      fallbackEnabled: false, // Database operations usually shouldn't have fallbacks
    });

    // API client service
    this.registerService('api-client', {
      name: 'api-client',
      enableRetry: true,
      enableCircuitBreaker: true,
      retryOptions: {
        maxAttempts: 3,
        initialDelay: 300,
        maxDelay: 3000,
        backoffFactor: 2,
        timeout: 15000,
      },
      circuitBreakerOptions: {
        failureThreshold: 4,
        resetTimeout: 45000,
      },
      fallbackEnabled: true,
    });

    // MCP service
    this.registerService('mcp-service', {
      name: 'mcp-service',
      enableRetry: true,
      enableCircuitBreaker: true,
      retryOptions: {
        maxAttempts: 2,
        initialDelay: 500,
        maxDelay: 4000,
        backoffFactor: 2,
        timeout: 20000,
      },
      circuitBreakerOptions: {
        failureThreshold: 3,
        resetTimeout: 60000,
      },
      fallbackEnabled: true,
    });
  }

  /**
   * Register a service with its resilience configuration
   */
  public registerService(serviceName: string, config: ServiceConfig): void {
    this.serviceConfigs.set(serviceName, config);
    
    if (config.enableCircuitBreaker) {
      const circuitBreaker = new CircuitBreaker(serviceName, config.circuitBreakerOptions);
      this.circuitBreakers.set(serviceName, circuitBreaker);
    }
    
    this.logger.info(`Registered service: ${serviceName}`);
  }

  /**
   * Execute a service call with full resilience patterns
   */
  public async executeWithResilience<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallbacks?: Array<() => Promise<T>>,
    context?: string
  ): Promise<T> {
    const config = this.serviceConfigs.get(serviceName);
    if (!config) {
      this.logger.warn(`No configuration found for service: ${serviceName}, using defaults`);
      return await operation();
    }

    const operationContext = context || `${serviceName} operation`;

    try {
      // Wrap operation with circuit breaker if enabled
      let wrappedOperation = operation;
      if (config.enableCircuitBreaker) {
        const circuitBreaker = this.circuitBreakers.get(serviceName);
        if (circuitBreaker) {
          wrappedOperation = () => circuitBreaker.execute(operation);
        }
      }

      // Wrap with retry if enabled
      if (config.enableRetry) {
        wrappedOperation = () => RetryUtils.withRetry(wrappedOperation, {
          ...config.retryOptions,
          onRetry: (error, attempt) => {
            this.logger.debug(`${serviceName} retry attempt ${attempt}: ${error.message}`);
          },
        });
      }

      // Execute with fallbacks if enabled
      if (config.fallbackEnabled && fallbacks && fallbacks.length > 0) {
        return await FallbackUtils.withFallback(
          wrappedOperation,
          fallbacks,
          {
            retryPrimary: false, // Already handled above
          }
        );
      } else {
        return await wrappedOperation();
      }

    } catch (error) {
      // Handle the error through our error handler
      await this.errorHandler.handleError(error, undefined, undefined, operationContext);
      throw error;
    }
  }

  /**
   * Execute with automatic fallback message generation
   */
  public async executeWithAutoFallback<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallbackValue: T,
    context?: string
  ): Promise<T> {
    const fallback = FallbackUtils.createSimpleFallback(fallbackValue);
    return await this.executeWithResilience(serviceName, operation, [fallback], context);
  }

  /**
   * Execute with error message fallback for string operations
   */
  public async executeWithErrorFallback(
    serviceName: string,
    operation: () => Promise<string>,
    errorMessage: string,
    context?: string
  ): Promise<string> {
    const fallback = FallbackUtils.createErrorFallback(errorMessage);
    return await this.executeWithResilience(serviceName, operation, [fallback], context);
  }

  /**
   * Get service health status
   */
  public getServiceHealth(serviceName: string): {
    serviceName: string;
    circuitBreakerStatus?: any;
    isHealthy: boolean;
  } {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    const isHealthy = !circuitBreaker || circuitBreaker.getState() !== 2; // Not OPEN
    
    return {
      serviceName,
      circuitBreakerStatus: circuitBreaker?.getStats(),
      isHealthy,
    };
  }

  /**
   * Get health status for all services
   */
  public getAllServiceHealth(): Array<{
    serviceName: string;
    circuitBreakerStatus?: any;
    isHealthy: boolean;
  }> {
    return Array.from(this.serviceConfigs.keys()).map(serviceName => 
      this.getServiceHealth(serviceName)
    );
  }

  /**
   * Reset circuit breaker for a service
   */
  public resetCircuitBreaker(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
      this.logger.info(`Reset circuit breaker for ${serviceName}`);
    }
  }

  /**
   * Reset all circuit breakers
   */
  public resetAllCircuitBreakers(): void {
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      circuitBreaker.reset();
    }
    this.logger.info('Reset all circuit breakers');
  }

  /**
   * Create a resilient wrapper for a service class
   */
  public createResilientWrapper<T extends object>(
    serviceName: string,
    serviceInstance: T,
    methodsToWrap: string[] = []
  ): T {
    const config = this.serviceConfigs.get(serviceName);
    if (!config) {
      this.logger.warn(`No configuration for ${serviceName}, returning unwrapped service`);
      return serviceInstance;
    }

    // Create a proxy that wraps specified methods
    return new Proxy(serviceInstance, {
      get: (target, prop) => {
        const originalMethod = target[prop as keyof T];
        
        if (
          typeof originalMethod === 'function' &&
          (methodsToWrap.length === 0 || methodsToWrap.includes(prop as string))
        ) {
          return async (...args: any[]) => {
            return await this.executeWithResilience(
              serviceName,
              () => originalMethod.apply(target, args),
              undefined,
              `${serviceName}.${prop as string}`
            );
          };
        }
        
        return originalMethod;
      },
    });
  }
}

// Export singleton instance
export const serviceResilience = new ServiceResilienceManager();