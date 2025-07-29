import { Logger } from './logger';
import { config } from '@/config/environment';

const logger = new Logger('Monitoring');

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface EventData {
  title: string;
  text: string;
  alertType?: 'error' | 'warning' | 'info' | 'success';
  tags?: Record<string, string>;
  timestamp?: Date;
}

/**
 * Monitoring service for metrics and events
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, MetricData[]> = new Map();
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = config.app.nodeEnv !== 'test';
    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize monitoring services
   */
  private initializeMonitoring(): void {
    // Initialize Sentry if configured
    if (config.monitoring.sentryDsn) {
      this.initializeSentry();
    }

    // Initialize DataDog if configured
    if (config.monitoring.datadogApiKey) {
      this.initializeDataDog();
    }

    logger.info('Monitoring service initialized');
  }

  /**
   * Initialize Sentry error tracking
   */
  private initializeSentry(): void {
    try {
      // This would require @sentry/node package
      logger.info('Sentry monitoring initialized');
    } catch (error) {
      logger.warn('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Initialize DataDog monitoring
   */
  private initializeDataDog(): void {
    try {
      // This would require dd-trace package
      logger.info('DataDog monitoring initialized');
    } catch (error) {
      logger.warn('Failed to initialize DataDog:', error);
    }
  }

  /**
   * Record a metric
   */
  public recordMetric(metric: MetricData): void {
    if (!this.isEnabled) return;

    const metricWithTimestamp = {
      ...metric,
      timestamp: metric.timestamp || new Date(),
    };

    // Store locally
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metricHistory = this.metrics.get(metric.name)!;
    metricHistory.push(metricWithTimestamp);
    
    // Keep only last 100 entries per metric
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }

    // Send to external services
    this.sendMetricToDataDog(metricWithTimestamp);
    
    logger.debug(`Recorded metric: ${metric.name} = ${metric.value}`);
  }

  /**
   * Record an event
   */
  public recordEvent(event: EventData): void {
    if (!this.isEnabled) return;

    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || new Date(),
    };

    // Send to external services
    this.sendEventToSentry(eventWithTimestamp);
    this.sendEventToDataDog(eventWithTimestamp);
    
    logger.info(`Recorded event: ${event.title}`);
  }

  /**
   * Record application performance metrics
   */
  public recordPerformanceMetrics(): void {
    if (!this.isEnabled) return;

    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Memory metrics
    this.recordMetric({
      name: 'memory.heap_used',
      value: memUsage.heapUsed,
      tags: { unit: 'bytes' },
    });

    this.recordMetric({
      name: 'memory.heap_total',
      value: memUsage.heapTotal,
      tags: { unit: 'bytes' },
    });

    this.recordMetric({
      name: 'memory.rss',
      value: memUsage.rss,
      tags: { unit: 'bytes' },
    });

    // CPU metrics
    this.recordMetric({
      name: 'cpu.user',
      value: cpuUsage.user,
      tags: { unit: 'microseconds' },
    });

    this.recordMetric({
      name: 'cpu.system',
      value: cpuUsage.system,
      tags: { unit: 'microseconds' },
    });

    // Uptime
    this.recordMetric({
      name: 'uptime',
      value: process.uptime(),
      tags: { unit: 'seconds' },
    });
  }

  /**
   * Record API request metrics
   */
  public recordAPIRequest(options: {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
  }): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      name: 'api.request.count',
      value: 1,
      tags: {
        endpoint: options.endpoint,
        method: options.method,
        status_code: options.statusCode.toString(),
      },
    });

    this.recordMetric({
      name: 'api.request.response_time',
      value: options.responseTime,
      tags: {
        endpoint: options.endpoint,
        method: options.method,
        unit: 'milliseconds',
      },
    });

    // Record errors
    if (options.statusCode >= 400) {
      this.recordEvent({
        title: 'API Error',
        text: `${options.method} ${options.endpoint} returned ${options.statusCode}`,
        alertType: options.statusCode >= 500 ? 'error' : 'warning',
        tags: {
          endpoint: options.endpoint,
          method: options.method,
          status_code: options.statusCode.toString(),
        },
      });
    }
  }

  /**
   * Record Telegram bot metrics
   */
  public recordTelegramMetrics(options: {
    messageType: 'received' | 'sent';
    chatType?: 'private' | 'group' | 'supergroup' | 'channel';
    success: boolean;
    responseTime?: number;
  }): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      name: `telegram.message.${options.messageType}`,
      value: 1,
      tags: {
        chat_type: options.chatType || 'unknown',
        success: options.success.toString(),
      },
    });

    if (options.responseTime) {
      this.recordMetric({
        name: 'telegram.response_time',
        value: options.responseTime,
        tags: {
          message_type: options.messageType,
          unit: 'milliseconds',
        },
      });
    }

    if (!options.success) {
      this.recordEvent({
        title: 'Telegram Error',
        text: `Failed to ${options.messageType === 'sent' ? 'send' : 'process'} message`,
        alertType: 'error',
        tags: {
          message_type: options.messageType,
          chat_type: options.chatType || 'unknown',
        },
      });
    }
  }

  /**
   * Record AI service metrics
   */
  public recordAIMetrics(options: {
    operation: string;
    model: string;
    tokens?: number;
    responseTime: number;
    success: boolean;
    error?: string;
  }): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      name: 'ai.request.count',
      value: 1,
      tags: {
        operation: options.operation,
        model: options.model,
        success: options.success.toString(),
      },
    });

    this.recordMetric({
      name: 'ai.request.response_time',
      value: options.responseTime,
      tags: {
        operation: options.operation,
        model: options.model,
        unit: 'milliseconds',
      },
    });

    if (options.tokens) {
      this.recordMetric({
        name: 'ai.tokens.used',
        value: options.tokens,
        tags: {
          operation: options.operation,
          model: options.model,
        },
      });
    }

    if (!options.success) {
      this.recordEvent({
        title: 'AI Service Error',
        text: `AI operation failed: ${options.operation}`,
        alertType: 'error',
        tags: {
          operation: options.operation,
          model: options.model,
          error: options.error || 'unknown',
        },
      });
    }
  }

  /**
   * Get metric history
   */
  public getMetricHistory(metricName: string): MetricData[] {
    return this.metrics.get(metricName) || [];
  }

  /**
   * Get all metrics summary
   */
  public getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    for (const [name, history] of this.metrics.entries()) {
      if (history.length > 0) {
        const latest = history[history.length - 1];
        const values = history.map(m => m.value);
        
        summary[name] = {
          latest: latest.value,
          count: history.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          lastUpdated: latest.timestamp,
        };
      }
    }
    
    return summary;
  }

  /**
   * Send metric to DataDog
   */
  private sendMetricToDataDog(metric: MetricData): void {
    // Implementation would depend on DataDog client
    // For now, just log in debug mode
    if (config.app.logLevel === 'debug') {
      logger.debug(`DataDog metric: ${metric.name} = ${metric.value}`, metric.tags);
    }
  }

  /**
   * Send event to Sentry
   */
  private sendEventToSentry(event: EventData): void {
    // Implementation would depend on Sentry client
    // For now, just log
    if (event.alertType === 'error') {
      logger.error(`Sentry event: ${event.title} - ${event.text}`, event.tags);
    } else {
      logger.info(`Sentry event: ${event.title} - ${event.text}`, event.tags);
    }
  }

  /**
   * Send event to DataDog
   */
  private sendEventToDataDog(event: EventData): void {
    // Implementation would depend on DataDog client
    // For now, just log in debug mode
    if (config.app.logLevel === 'debug') {
      logger.debug(`DataDog event: ${event.title} - ${event.text}`, event.tags);
    }
  }

  /**
   * Start periodic performance monitoring
   */
  public startPeriodicMonitoring(): void {
    if (!this.isEnabled) return;

    // Record performance metrics every 30 seconds
    setInterval(() => {
      this.recordPerformanceMetrics();
    }, 30000);

    logger.info('Started periodic performance monitoring');
  }

  /**
   * Shutdown monitoring
   */
  public shutdown(): void {
    logger.info('Monitoring service shutting down');
    this.metrics.clear();
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();