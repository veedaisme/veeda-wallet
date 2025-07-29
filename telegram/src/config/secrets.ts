import { config } from './environment';
import { Logger } from '@/utils/logger';

const logger = new Logger('SecretsManager');

/**
 * Secrets management utility for handling sensitive configuration
 */
export class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Map<string, string> = new Map();

  private constructor() {
    this.loadSecrets();
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Load secrets from environment variables
   */
  private loadSecrets(): void {
    const secretKeys = [
      'TELEGRAM_BOT_TOKEN',
      'OPENAI_API_KEY',
      'CLAIR_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'WEBHOOK_SECRET',
      'REDIS_PASSWORD',
      'SENTRY_DSN',
      'DATADOG_API_KEY',
    ];

    secretKeys.forEach(key => {
      const value = process.env[key];
      if (value) {
        this.secrets.set(key, value);
      }
    });

    logger.info(`Loaded ${this.secrets.size} secrets from environment`);
  }

  /**
   * Get a secret value
   */
  public getSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  /**
   * Check if a secret exists
   */
  public hasSecret(key: string): boolean {
    return this.secrets.has(key);
  }

  /**
   * Validate that all required secrets are present
   */
  public validateRequiredSecrets(): { valid: boolean; missing: string[] } {
    const requiredSecrets = ['TELEGRAM_BOT_TOKEN', 'OPENAI_API_KEY'];
    const missing: string[] = [];

    requiredSecrets.forEach(key => {
      if (!this.hasSecret(key)) {
        missing.push(key);
      }
    });

    const valid = missing.length === 0;
    
    if (!valid) {
      logger.error(`Missing required secrets: ${missing.join(', ')}`);
    } else {
      logger.info('All required secrets are present');
    }

    return { valid, missing };
  }

  /**
   * Mask sensitive values for logging
   */
  public maskSecret(value: string): string {
    if (!value || value.length < 8) {
      return '***';
    }
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }

  /**
   * Get configuration summary for logging (with masked secrets)
   */
  public getConfigSummary(): Record<string, any> {
    return {
      telegram: {
        botToken: this.maskSecret(config.telegram.botToken),
        pollingInterval: config.telegram.pollingInterval,
        rateLimitPerUser: config.telegram.rateLimitPerUser,
        webhookConfigured: !!config.telegram.webhookUrl,
      },
      ai: {
        apiKey: this.maskSecret(config.ai.apiKey),
        model: config.ai.model,
      },
      api: {
        clairUrl: config.api.clairUrl,
        clairApiKey: config.api.clairApiKey ? this.maskSecret(config.api.clairApiKey) : 'not set',
      },
      supabase: {
        configured: !!config.supabase.url,
        url: config.supabase.url,
      },
      redis: {
        configured: !!config.redis.url,
        url: config.redis.url,
      },
      monitoring: {
        sentry: !!config.monitoring.sentryDsn,
        datadog: !!config.monitoring.datadogApiKey,
      },
      features: config.features,
      app: {
        nodeEnv: config.app.nodeEnv,
        port: config.app.port,
        logLevel: config.app.logLevel,
      },
    };
  }

  /**
   * Rotate a secret (for future use with secret rotation systems)
   */
  public rotateSecret(key: string, newValue: string): void {
    this.secrets.set(key, newValue);
    logger.info(`Secret ${key} rotated`);
  }

  /**
   * Clear all secrets from memory (for shutdown)
   */
  public clearSecrets(): void {
    this.secrets.clear();
    logger.info('All secrets cleared from memory');
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();