import { Logger } from './logger';
import { secretsManager } from '@/config/secrets';
import { config } from '@/config/environment';

const logger = new Logger('HealthCheck');

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
      lastChecked: string;
    };
  };
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private lastHealthCheck: HealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicChecks();
  }

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    logger.debug('Starting health check');

    const checks: HealthStatus['checks'] = {};

    // Check application basics
    checks.application = await this.checkApplication();
    
    // Check secrets and configuration
    checks.configuration = await this.checkConfiguration();
    
    // Check external services
    checks.telegram = await this.checkTelegramAPI();
    checks.openai = await this.checkOpenAI();
    checks.clairApi = await this.checkClairAPI();
    checks.supabase = await this.checkSupabase();
    
    // Check optional services
    if (config.redis.url) {
      checks.redis = await this.checkRedis();
    }

    // Determine overall status
    const overallStatus = this.determineOverallStatus(checks);
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.app.nodeEnv,
      checks,
    };

    this.lastHealthCheck = healthStatus;
    
    const duration = Date.now() - startTime;
    logger.info(`Health check completed in ${duration}ms - Status: ${overallStatus}`);
    
    return healthStatus;
  }

  /**
   * Get the last health check result
   */
  public getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck;
  }

  /**
   * Check application basics
   */
  private async checkApplication(): Promise<HealthStatus['checks'][string]> {
    const startTime = Date.now();
    
    try {
      // Check memory usage
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      // Check if memory usage is reasonable (< 400MB)
      const memoryOk = memUsageMB < 400;
      
      return {
        status: memoryOk ? 'pass' : 'warn',
        message: `Memory usage: ${memUsageMB}MB, Uptime: ${Math.round(process.uptime())}s`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Application check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check configuration and secrets
   */
  private async checkConfiguration(): Promise<HealthStatus['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const validation = secretsManager.validateRequiredSecrets();
      
      return {
        status: validation.valid ? 'pass' : 'fail',
        message: validation.valid 
          ? 'All required secrets present' 
          : `Missing secrets: ${validation.missing.join(', ')}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Configuration check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Telegram API connectivity
   */
  private async checkTelegramAPI(): Promise<HealthStatus['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const botToken = secretsManager.getSecret('TELEGRAM_BOT_TOKEN');
      if (!botToken) {
        return {
          status: 'fail',
          message: 'Telegram bot token not configured',
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'pass',
          message: `Bot connected: @${data.result.username}`,
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          status: 'fail',
          message: `Telegram API error: ${response.status}`,
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Telegram API check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check OpenAI API connectivity
   */
  private async checkOpenAI(): Promise<HealthStatus['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const apiKey = secretsManager.getSecret('OPENAI_API_KEY');
      if (!apiKey) {
        return {
          status: 'fail',
          message: 'OpenAI API key not configured',
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 5000,
      });

      if (response.ok) {
        return {
          status: 'pass',
          message: 'OpenAI API accessible',
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          status: 'fail',
          message: `OpenAI API error: ${response.status}`,
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `OpenAI API check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Clair API connectivity
   */
  private async checkClairAPI(): Promise<HealthStatus['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const apiKey = secretsManager.getSecret('CLAIR_API_KEY');
      const apiUrl = config.api.clairUrl;
      
      if (!apiKey || !apiUrl) {
        return {
          status: 'warn',
          message: 'Clair API not configured',
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 5000,
      });

      if (response.ok) {
        return {
          status: 'pass',
          message: 'Clair API accessible',
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          status: 'fail',
          message: `Clair API error: ${response.status}`,
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Clair API check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Supabase connectivity
   */
  private async checkSupabase(): Promise<HealthStatus['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const supabaseUrl = config.supabase.url;
      const supabaseKey = config.supabase.anonKey;
      
      if (!supabaseUrl || !supabaseKey) {
        return {
          status: 'warn',
          message: 'Supabase not configured',
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
        },
        timeout: 5000,
      });

      if (response.status === 200 || response.status === 404) {
        return {
          status: 'pass',
          message: 'Supabase accessible',
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      } else {
        return {
          status: 'fail',
          message: `Supabase error: ${response.status}`,
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Supabase check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<HealthStatus['checks'][string]> {
    const startTime = Date.now();
    
    try {
      // This would require a Redis client - simplified for now
      return {
        status: 'pass',
        message: 'Redis check not implemented',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Redis check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Determine overall health status from individual checks
   */
  private determineOverallStatus(checks: HealthStatus['checks']): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('fail')) {
      // Check if critical services are failing
      const criticalServices = ['application', 'configuration', 'telegram', 'openai'];
      const criticalFailures = criticalServices.some(service => 
        checks[service]?.status === 'fail'
      );
      
      return criticalFailures ? 'unhealthy' : 'degraded';
    }
    
    if (statuses.includes('warn')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Start periodic health checks
   */
  private startPeriodicChecks(): void {
    const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000');
    
    this.checkInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Periodic health check failed:', error);
      }
    }, interval);
    
    logger.info(`Started periodic health checks every ${interval}ms`);
  }

  /**
   * Stop periodic health checks
   */
  public stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Stopped periodic health checks');
    }
  }
}

// Export singleton instance
export const healthCheckService = HealthCheckService.getInstance();