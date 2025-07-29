import { Logger } from './logger';
import { secretsManager } from '@/config/secrets';
import { config } from '@/config/environment';

const logger = new Logger('BotSetup');

export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export interface BotCommand {
  command: string;
  description: string;
}

export interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

/**
 * Bot setup and configuration service
 */
export class BotSetupService {
  private static instance: BotSetupService;
  private botToken: string;
  private apiBaseUrl: string;

  private constructor() {
    const token = secretsManager.getSecret('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required for bot setup');
    }
    
    this.botToken = token;
    this.apiBaseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    logger.info('Bot setup service initialized');
  }

  public static getInstance(): BotSetupService {
    if (!BotSetupService.instance) {
      BotSetupService.instance = new BotSetupService();
    }
    return BotSetupService.instance;
  }

  /**
   * Get bot information
   */
  public async getBotInfo(): Promise<BotInfo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/getMe`);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }
      
      logger.info(`Bot info retrieved: @${data.result.username}`);
      return data.result;
    } catch (error) {
      logger.error('Failed to get bot info:', error);
      throw error;
    }
  }

  /**
   * Set up bot commands
   */
  public async setupBotCommands(): Promise<void> {
    const commands: BotCommand[] = [
      {
        command: 'start',
        description: 'Start using Clair AI Assistant',
      },
      {
        command: 'help',
        description: 'Show help and available commands',
      },
      {
        command: 'link',
        description: 'Link your Clair account',
      },
      {
        command: 'unlink',
        description: 'Unlink your Clair account',
      },
      {
        command: 'status',
        description: 'Check your account status',
      },
      {
        command: 'dashboard',
        description: 'View your spending dashboard',
      },
      {
        command: 'transactions',
        description: 'View recent transactions',
      },
      {
        command: 'subscriptions',
        description: 'Manage your subscriptions',
      },
      {
        command: 'insights',
        description: 'Get spending insights and recommendations',
      },
      {
        command: 'settings',
        description: 'Manage your preferences',
      },
    ];

    try {
      const response = await fetch(`${this.apiBaseUrl}/setMyCommands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commands }),
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Failed to set commands: ${data.description}`);
      }
      
      logger.info(`Successfully set ${commands.length} bot commands`);
    } catch (error) {
      logger.error('Failed to set bot commands:', error);
      throw error;
    }
  }

  /**
   * Set up bot description
   */
  public async setupBotDescription(): Promise<void> {
    const description = 'Clair AI Assistant helps you manage your finances through natural conversation. ' +
                       'Track expenses, view insights, manage subscriptions, and get personalized financial advice.';

    const shortDescription = 'AI-powered financial assistant for expense tracking and insights';

    try {
      // Set full description
      await fetch(`${this.apiBaseUrl}/setMyDescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      // Set short description
      await fetch(`${this.apiBaseUrl}/setMyShortDescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ short_description: shortDescription }),
      });

      logger.info('Bot description set successfully');
    } catch (error) {
      logger.error('Failed to set bot description:', error);
      throw error;
    }
  }

  /**
   * Configure webhook (if webhook URL is provided)
   */
  public async setupWebhook(): Promise<void> {
    const webhookUrl = config.telegram.webhookUrl;
    const webhookSecret = secretsManager.getSecret('TELEGRAM_WEBHOOK_SECRET');

    if (!webhookUrl) {
      logger.info('No webhook URL configured, skipping webhook setup');
      return;
    }

    try {
      const webhookConfig: any = {
        url: webhookUrl,
        max_connections: 40,
        allowed_updates: [
          'message',
          'callback_query',
          'inline_query',
        ],
      };

      if (webhookSecret) {
        webhookConfig.secret_token = webhookSecret;
      }

      const response = await fetch(`${this.apiBaseUrl}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookConfig),
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Failed to set webhook: ${data.description}`);
      }
      
      logger.info(`Webhook configured successfully: ${webhookUrl}`);
    } catch (error) {
      logger.error('Failed to set webhook:', error);
      throw error;
    }
  }

  /**
   * Remove webhook (for polling mode)
   */
  public async removeWebhook(): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/deleteWebhook`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Failed to remove webhook: ${data.description}`);
      }
      
      logger.info('Webhook removed successfully');
    } catch (error) {
      logger.error('Failed to remove webhook:', error);
      throw error;
    }
  }

  /**
   * Get webhook information
   */
  public async getWebhookInfo(): Promise<WebhookInfo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/getWebhookInfo`);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Failed to get webhook info: ${data.description}`);
      }
      
      return data.result;
    } catch (error) {
      logger.error('Failed to get webhook info:', error);
      throw error;
    }
  }

  /**
   * Perform complete bot setup
   */
  public async performCompleteSetup(): Promise<{
    botInfo: BotInfo;
    webhookInfo?: WebhookInfo;
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let botInfo: BotInfo | null = null;
    let webhookInfo: WebhookInfo | undefined;

    logger.info('Starting complete bot setup...');

    try {
      // Get bot information
      botInfo = await this.getBotInfo();
      logger.info(`Setting up bot: @${botInfo.username} (${botInfo.first_name})`);
    } catch (error) {
      errors.push(`Failed to get bot info: ${error}`);
    }

    try {
      // Set up bot commands
      await this.setupBotCommands();
    } catch (error) {
      errors.push(`Failed to set up commands: ${error}`);
    }

    try {
      // Set up bot description
      await this.setupBotDescription();
    } catch (error) {
      errors.push(`Failed to set up description: ${error}`);
    }

    // Configure webhook or polling
    if (config.telegram.webhookUrl) {
      try {
        await this.setupWebhook();
        webhookInfo = await this.getWebhookInfo();
      } catch (error) {
        errors.push(`Failed to set up webhook: ${error}`);
      }
    } else {
      try {
        await this.removeWebhook();
        logger.info('Bot configured for polling mode');
      } catch (error) {
        errors.push(`Failed to remove webhook: ${error}`);
      }
    }

    const success = errors.length === 0;
    
    if (success) {
      logger.info('✅ Complete bot setup finished successfully');
    } else {
      logger.warn(`⚠️ Bot setup completed with ${errors.length} errors:`, errors);
    }

    return {
      botInfo: botInfo!,
      webhookInfo,
      success,
      errors,
    };
  }

  /**
   * Validate bot configuration
   */
  public async validateBotConfiguration(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check bot info
      const botInfo = await this.getBotInfo();
      
      if (!botInfo.username) {
        issues.push('Bot does not have a username');
      }
      
      if (!botInfo.can_join_groups && config.features.groupSupport) {
        recommendations.push('Enable group support for the bot via @BotFather');
      }
      
      if (!botInfo.supports_inline_queries && config.features.inlineQueries) {
        recommendations.push('Enable inline queries for the bot via @BotFather');
      }

      // Check webhook configuration
      if (config.telegram.webhookUrl) {
        const webhookInfo = await this.getWebhookInfo();
        
        if (!webhookInfo.url) {
          issues.push('Webhook URL is not set');
        } else if (webhookInfo.url !== config.telegram.webhookUrl) {
          issues.push('Webhook URL mismatch');
        }
        
        if (webhookInfo.pending_update_count > 100) {
          issues.push(`High number of pending updates: ${webhookInfo.pending_update_count}`);
        }
        
        if (webhookInfo.last_error_message) {
          issues.push(`Webhook error: ${webhookInfo.last_error_message}`);
        }
      }

      // Check required secrets
      const requiredSecrets = ['TELEGRAM_BOT_TOKEN', 'OPENAI_API_KEY'];
      for (const secret of requiredSecrets) {
        if (!secretsManager.hasSecret(secret)) {
          issues.push(`Missing required secret: ${secret}`);
        }
      }

      // Check optional but recommended secrets
      const recommendedSecrets = ['CLAIR_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
      for (const secret of recommendedSecrets) {
        if (!secretsManager.hasSecret(secret)) {
          recommendations.push(`Consider setting ${secret} for full functionality`);
        }
      }

    } catch (error) {
      issues.push(`Configuration validation failed: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Get bot setup status
   */
  public async getBotSetupStatus(): Promise<{
    configured: boolean;
    botInfo?: BotInfo;
    webhookInfo?: WebhookInfo;
    lastSetup?: Date;
    issues: string[];
  }> {
    try {
      const botInfo = await this.getBotInfo();
      let webhookInfo: WebhookInfo | undefined;
      
      if (config.telegram.webhookUrl) {
        webhookInfo = await this.getWebhookInfo();
      }
      
      const validation = await this.validateBotConfiguration();
      
      return {
        configured: validation.valid,
        botInfo,
        webhookInfo,
        lastSetup: new Date(), // This could be stored in a database
        issues: validation.issues,
      };
    } catch (error) {
      return {
        configured: false,
        issues: [`Failed to get bot status: ${error}`],
      };
    }
  }
}

// Export singleton instance
export const botSetupService = BotSetupService.getInstance();