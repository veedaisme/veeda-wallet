import { Logger } from './logger';
import { ErrorHandler, ErrorCategory, AppError } from './error-handler';

/**
 * Options for retry operations
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  timeout?: number;
  retryableErrors?: ErrorCategory[];
  nonRetryableErrors?: ErrorCategory[];
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED, // Normal operation, requests pass through
  OPEN,   // Failing, requests are blocked
  HALF_OPEN // Testing if service is back
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitorInterval?: number;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

/**
 * Retry utility with exponential backoff
 */
export class RetryUtils {
  private static logger = new Logger('RetryUtils');
  private static errorHandler = new ErrorHandler();

  /**
   * Execute a function with retry logic
   */
  public static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 300,
      maxDelay = 10000,
      backoffFactor = 2,
      timeout,
      retryableErrors = [
        ErrorCategory.NETWORK,
        ErrorCategory.API,
        ErrorCategory.TELEGRAM,
        ErrorCategory.TIMEOUT,
      ],
      nonRetryableErrors = [
        ErrorCategory.VALIDATION,
        ErrorCategory.AUTHORIZATION,
      ],
      onRetry,
      shouldRetry,
    } = options;

    let attempt = 1;
    let lastError: Error | null = null;

    while (attempt <= maxAttempts) {
      try {
        // Execute with timeout if specified
        if (timeout) {
          return await this.withTimeout(fn, timeout);
        } else {
          return await fn();
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        const shouldRetryError = shouldRetry 
          ? shouldRetry(lastError)
          : this.shouldRetryError(lastError, retryableErrors, nonRetryableErrors);
        
        if (!shouldRetryError || attempt >= maxAttempts) {
          break;
        }

        // Calculate backoff delay with jitter
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt - 1) * (0.8 + Math.random() * 0.4),
          maxDelay
        );

        this.logger.debug(
          `Retry attempt ${attempt}/${maxAttempts} after ${Math.round(delay)}ms for error: ${lastError.message}`
        );

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(lastError, attempt);
        }

        // Wait before retrying
        await this.sleep(delay);
        attempt++;
      }
    }

    // All retries exhausted, throw the last error
    if (lastError) {
      throw lastError;
    }

    // This should never happen, but just in case
    throw new Error('Retry failed without error');
  }

  /**
   * Execute function with timeout
   */
  private static async withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  /**
   * Determine if an error should be retried
   */
  private static shouldRetryError(
    error: Error,
    retryableErrors: ErrorCategory[],
    nonRetryableErrors: ErrorCategory[]
  ): boolean {
    const appError = this.errorHandler.normalizeError(error);
    
    // Never retry non-retryable errors
    if (nonRetryableErrors.includes(appError.category)) {
      return false;
    }
    
    // Retry if it's in the retryable list or if it's marked as retryable
    return retryableErrors.includes(appError.category) || appError.isRetryable;
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private logger: Logger;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {}
  ) {
    this.logger = new Logger(`CircuitBreaker:${name}`);
    
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      monitorInterval = 10000,
    } = options;

    // Start monitoring
    setInterval(() => this.monitor(), monitorInterval);
    
    this.logger.info(`Circuit breaker initialized for ${name}`);
  }

  /**
   * Execute function through circuit breaker
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      throw new Error(`Circuit breaker is OPEN for ${this.name}`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.CLOSED);
      this.logger.info(`Circuit breaker ${this.name} closed after successful test`);
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.OPEN);
      this.logger.warn(`Circuit breaker ${this.name} opened after failed test`);
    } else if (this.failureCount >= (this.options.failureThreshold || 5)) {
      this.setState(CircuitState.OPEN);
      this.logger.warn(`Circuit breaker ${this.name} opened after ${this.failureCount} failures`);
    }
  }

  /**
   * Monitor circuit breaker state
   */
  private monitor(): void {
    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      const resetTimeout = this.options.resetTimeout || 60000;
      
      if (timeSinceLastFailure >= resetTimeout) {
        this.setState(CircuitState.HALF_OPEN);
        this.logger.info(`Circuit breaker ${this.name} moved to HALF_OPEN for testing`);
      }
    }
  }

  /**
   * Set circuit breaker state
   */
  private setState(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }
  }

  /**
   * Get current state
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  public getStats(): {
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: CircuitState[this.state],
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.logger.info(`Circuit breaker ${this.name} reset`);
  }
}

/**
 * Fallback utility for providing alternative responses
 */
export class FallbackUtils {
  private static logger = new Logger('FallbackUtils');

  /**
   * Execute with fallback options
   */
  public static async withFallback<T>(
    primary: () => Promise<T>,
    fallbacks: Array<() => Promise<T>>,
    options: {
      retryPrimary?: boolean;
      retryOptions?: RetryOptions;
    } = {}
  ): Promise<T> {
    const { retryPrimary = true, retryOptions } = options;

    // Try primary function with optional retry
    try {
      if (retryPrimary && retryOptions) {
        return await RetryUtils.withRetry(primary, retryOptions);
      } else {
        return await primary();
      }
    } catch (primaryError) {
      this.logger.warn('Primary function failed, trying fallbacks:', primaryError);

      // Try each fallback in order
      for (let i = 0; i < fallbacks.length; i++) {
        try {
          this.logger.debug(`Trying fallback ${i + 1}/${fallbacks.length}`);
          return await fallbacks[i]();
        } catch (fallbackError) {
          this.logger.warn(`Fallback ${i + 1} failed:`, fallbackError);
          
          // If this is the last fallback, throw the original error
          if (i === fallbacks.length - 1) {
            throw primaryError;
          }
        }
      }
    }

    // This should never be reached
    throw new Error('All fallback options exhausted');
  }

  /**
   * Create a simple fallback response
   */
  public static createSimpleFallback<T>(fallbackValue: T): () => Promise<T> {
    return async () => fallbackValue;
  }

  /**
   * Create a fallback that returns a default error message
   */
  public static createErrorFallback(message: string): () => Promise<string> {
    return async () => {
      this.logger.info(`Using error fallback: ${message}`);
      return message;
    };
  }
}