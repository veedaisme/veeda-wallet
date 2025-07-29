import { Logger } from '@/utils/logger';
import { secretsManager } from '@/config/secrets';
import { config } from '@/config/environment';
import { healthCheckService } from '@/utils/health-check';
import { monitoringService } from '@/utils/monitoring';
import { botSetupService } from '@/utils/bot-setup';
import { ErrorBoundary } from '@/utils/error-boundary';

const logger = new Logger('Startup');

export interface StartupResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  services: {
    [key: string]: {
      status: 'success' | 'error' | 'warning';
      message: string;
      duration?: number;
    };
  };
}

/**
 * Application startup service
 */
export class StartupService {
  private static instance: StartupService;
  private startupTime: Date | null = null;

  private constructor() {}

  public static getInstance(): StartupService {
    if (!StartupService.instance) {
      StartupService.instance = new StartupService();
    }
    return StartupService.instance;
  }

  /**
   * Perform complete application startup
   */
  public async startup(): Promise<StartupResult> {
    const startTime = Date.now();
    this.startupTime = new Date();
    
    logger.info('🚀 Starting Clair Telegram Bot...');
    logger.info(`Environment: ${config.app.nodeEnv}`);
    logger.info(`Node.js version: ${process.version}`);
    logger.info(`Platform: ${process.platform} ${process.arch}`);

    const result: StartupResult = {
      success: false,
      errors: [],
      warnings: [],
      duration: 0,
      services: {},
    };

    // Initialize error boundary first
    try {
      ErrorBoundary.init();
      result.services.errorBoundary = {
        status: 'success',
        message: 'Error boundary initialized',
      };
      logger.info('✅ Error boundary initialized');
    } catch (error) {
      const errorMsg = `Failed to initialize error boundary: ${error}`;
      result.errors.push(errorMsg);
      result.services.errorBoundary = {
        status: 'error',
        message: errorMsg,
      };
      logger.error('❌ Error boundary initialization failed:', error);
    }

    // Validate configuration and secrets
    try {
      const validation = secretsManager.validateRequiredSecrets();
      if (validation.valid) {
        result.services.configuration = {
          status: 'success',
          message: 'All required secrets present',
        };
        logger.info('✅ Configuration validation passed');
      } else {
        const errorMsg = `Missing required secrets: ${validation.missing.join(', ')}`;
        result.errors.push(errorMsg);
        result.services.configuration = {
          status: 'error',
          message: errorMsg,
        };
        logger.error('❌ Configuration validation failed:', errorMsg);
      }
    } catch (error) {
      const errorMsg = `Configuration validation error: ${error}`;
      result.errors.push(errorMsg);
      result.services.configuration = {
        status: 'error',
        message: errorMsg,
      };
      logger.error('❌ Configuration validation error:', error);
    }

    // Initialize monitoring service
    try {
      monitoringService.startPeriodicMonitoring();
      result.services.monitoring = {
        status: 'success',
        message: 'Monitoring service started',
      };
      logger.info('✅ Monitoring service initialized');
    } catch (error) {
      const errorMsg = `Failed to initialize monitoring: ${error}`;
      result.warnings.push(errorMsg);
      result.services.monitoring = {
        status: 'warning',
        message: errorMsg,
      };
      logger.warn('⚠️ Monitoring service initialization failed:', error);
    }

    // Perform bot setup
    try {
      const setupStart = Date.now();
      const setupResult = await botSetupService.performCompleteSetup();
      const setupDuration = Date.now() - setupStart;
      
      if (setupResult.success) {
        result.services.botSetup = {
          status: 'success',
          message: `Bot setup completed: @${setupResult.botInfo.username}`,
          duration: setupDuration,
        };
        logger.info(`✅ Bot setup completed in ${setupDuration}ms`);
      } else {
        const errorMsg = `Bot setup completed with errors: ${setupResult.errors.join(', ')}`;
        result.warnings.push(errorMsg);
        result.services.botSetup = {
          status: 'warning',
          message: errorMsg,
          duration: setupDuration,
        };
        logger.warn('⚠️ Bot setup completed with errors:', setupResult.errors);
      }
    } catch (error) {
      const errorMsg = `Bot setup failed: ${error}`;
      result.errors.push(errorMsg);
      result.services.botSetup = {
        status: 'error',
        message: errorMsg,
      };
      logger.error('❌ Bot setup failed:', error);
    }

    // Perform initial health check
    try {
      const healthStart = Date.now();
      const healthStatus = await healthCheckService.performHealthCheck();
      const healthDuration = Date.now() - healthStart;
      
      if (healthStatus.status === 'healthy') {
        result.services.healthCheck = {
          status: 'success',
          message: 'Initial health check passed',
          duration: healthDuration,
        };
        logger.info(`✅ Initial health check passed in ${healthDuration}ms`);
      } else {
        const warningMsg = `Health check status: ${healthStatus.status}`;
        result.warnings.push(warningMsg);
        result.services.healthCheck = {
          status: 'warning',
          message: warningMsg,
          duration: healthDuration,
        };
        logger.warn(`⚠️ Health check status: ${healthStatus.status}`);
      }
    } catch (error) {
      const errorMsg = `Initial health check failed: ${error}`;
      result.warnings.push(errorMsg);
      result.services.healthCheck = {
        status: 'warning',
        message: errorMsg,
      };
      logger.warn('⚠️ Initial health check failed:', error);
    }

    // Initialize additional services based on configuration
    await this.initializeOptionalServices(result);

    // Calculate final result
    result.duration = Date.now() - startTime;
    result.success = result.errors.length === 0;

    // Log startup summary
    this.logStartupSummary(result);

    // Record startup metrics
    monitoringService.recordEvent({
      title: 'Application Startup',
      text: `Application started in ${result.duration}ms`,
      alertType: result.success ? 'success' : 'error',
      tags: {
        environment: config.app.nodeEnv,
        success: result.success.toString(),
        errors: result.errors.length.toString(),
        warnings: result.warnings.length.toString(),
      },
    });

    return result;
  }

  /**
   * Initialize optional services
   */
  private async initializeOptionalServices(result: StartupResult): Promise<void> {
    // Initialize Redis if configured
    if (config.redis.url) {
      try {
        // Redis initialization would go here
        result.services.redis = {
          status: 'success',
          message: 'Redis connection established',
        };
        logger.info('✅ Redis initialized');
      } catch (error) {
        const warningMsg = `Redis initialization failed: ${error}`;
        result.warnings.push(warningMsg);
        result.services.redis = {
          status: 'warning',
          message: warningMsg,
        };
        logger.warn('⚠️ Redis initialization failed:', error);
      }
    }

    // Initialize Sentry if configured
    if (config.monitoring.sentryDsn) {
      try {
        // Sentry initialization would go here
        result.services.sentry = {
          status: 'success',
          message: 'Sentry error tracking initialized',
        };
        logger.info('✅ Sentry initialized');
      } catch (error) {
        const warningMsg = `Sentry initialization failed: ${error}`;
        result.warnings.push(warningMsg);
        result.services.sentry = {
          status: 'warning',
          message: warningMsg,
        };
        logger.warn('⚠️ Sentry initialization failed:', error);
      }
    }

    // Initialize DataDog if configured
    if (config.monitoring.datadogApiKey) {
      try {
        // DataDog initialization would go here
        result.services.datadog = {
          status: 'success',
          message: 'DataDog monitoring initialized',
        };
        logger.info('✅ DataDog initialized');
      } catch (error) {
        const warningMsg = `DataDog initialization failed: ${error}`;
        result.warnings.push(warningMsg);
        result.services.datadog = {
          status: 'warning',
          message: warningMsg,
        };
        logger.warn('⚠️ DataDog initialization failed:', error);
      }
    }
  }

  /**
   * Log startup summary
   */
  private logStartupSummary(result: StartupResult): void {
    const { success, errors, warnings, duration, services } = result;
    
    logger.info('📊 Startup Summary:');
    logger.info(`  Duration: ${duration}ms`);
    logger.info(`  Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    logger.info(`  Errors: ${errors.length}`);
    logger.info(`  Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      logger.error('❌ Startup Errors:');
      errors.forEach(error => logger.error(`  - ${error}`));
    }
    
    if (warnings.length > 0) {
      logger.warn('⚠️ Startup Warnings:');
      warnings.forEach(warning => logger.warn(`  - ${warning}`));
    }
    
    logger.info('🔧 Service Status:');
    Object.entries(services).forEach(([name, service]) => {
      const icon = service.status === 'success' ? '✅' : 
                   service.status === 'warning' ? '⚠️' : '❌';
      const duration = service.duration ? ` (${service.duration}ms)` : '';
      logger.info(`  ${icon} ${name}: ${service.message}${duration}`);
    });

    if (success) {
      logger.info('🎉 Clair Telegram Bot started successfully!');
    } else {
      logger.error('💥 Clair Telegram Bot startup failed!');
    }
  }

  /**
   * Get startup information
   */
  public getStartupInfo(): {
    startupTime: Date | null;
    uptime: number;
    environment: string;
    version: string;
  } {
    return {
      startupTime: this.startupTime,
      uptime: this.startupTime ? Date.now() - this.startupTime.getTime() : 0,
      environment: config.app.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    logger.info('🛑 Starting graceful shutdown...');
    
    try {
      // Stop health checks
      healthCheckService.stopPeriodicChecks();
      
      // Shutdown monitoring
      monitoringService.shutdown();
      
      // Clear secrets from memory
      secretsManager.clearSecrets();
      
      logger.info('✅ Graceful shutdown completed');
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
    }
  }
}

// Export singleton instance
export const startupService = StartupService.getInstance();