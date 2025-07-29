import TelegramBot from 'node-telegram-bot-api';
import { 
  TelegramPollingHandler, 
  TelegramUpdate, 
  SendMessageOptions,
  TelegramMessage 
} from '@/types/telegram';
import { config } from '@/config/environment';
import { Logger } from '@/utils/logger';

export class TelegramPollingService implements TelegramPollingHandler {
  private bot: TelegramBot;
  private isPollingActive = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastUpdateId = 0;
  private logger = new Logger('TelegramPolling');
  private messageHandlers: Array<(update: TelegramUpdate) => Promise<void>> = [];

  constructor() {
    this.bot = new TelegramBot(config.telegram.botToken, { polling: false });
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.bot.on('error', (error) => {
      this.logger.error('Telegram Bot API error:', error);
    });

    this.bot.on('polling_error', (error) => {
      this.logger.error('Telegram polling error:', error);
    });
  }

  public addMessageHandler(handler: (update: TelegramUpdate) => Promise<void>): void {
    this.messageHandlers.push(handler);
  }

  public async startPolling(): Promise<void> {
    if (this.isPollingActive) {
      this.logger.warn('Polling is already active');
      return;
    }

    this.logger.info('Starting Telegram bot polling...');
    this.isPollingActive = true;

    // Start the polling loop
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollForUpdates();
      } catch (error) {
        this.logger.error('Error in polling loop:', error);
        // Continue polling even if there's an error
      }
    }, config.telegram.pollingInterval);

    this.logger.info('Telegram bot polling started successfully');
  }

  public async stopPolling(): Promise<void> {
    if (!this.isPollingActive) {
      this.logger.warn('Polling is not active');
      return;
    }

    this.logger.info('Stopping Telegram bot polling...');
    this.isPollingActive = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.logger.info('Telegram bot polling stopped');
  }

  public isPolling(): boolean {
    return this.isPollingActive;
  }

  public async getUpdates(offset?: number): Promise<TelegramUpdate[]> {
    try {
      const updates = await this.bot.getUpdates({
        offset: offset || this.lastUpdateId + 1,
        limit: 100,
        timeout: 0, // Short polling for better control
      });

      return updates.map(update => ({
        update_id: update.update_id,
        message: update.message ? this.mapMessage(update.message) : undefined,
        callback_query: update.callback_query ? {
          id: update.callback_query.id,
          from: {
            id: update.callback_query.from.id,
            is_bot: update.callback_query.from.is_bot,
            first_name: update.callback_query.from.first_name,
            last_name: update.callback_query.from.last_name,
            username: update.callback_query.from.username,
            language_code: update.callback_query.from.language_code,
          },
          message: update.callback_query.message ? this.mapMessage(update.callback_query.message) : undefined,
          data: update.callback_query.data,
        } : undefined,
      }));
    } catch (error) {
      this.logger.error('Failed to get updates:', error);
      throw error;
    }
  }

  public async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      this.logger.debug('Processing update:', update.update_id);

      // Update the last processed update ID
      if (update.update_id > this.lastUpdateId) {
        this.lastUpdateId = update.update_id;
      }

      // Call all registered message handlers
      for (const handler of this.messageHandlers) {
        try {
          await handler(update);
        } catch (error) {
          this.logger.error('Error in message handler:', error);
          // Continue with other handlers even if one fails
        }
      }
    } catch (error) {
      this.logger.error('Error handling update:', error);
    }
  }

  public async sendMessage(options: SendMessageOptions): Promise<void> {
    try {
      await this.bot.sendMessage(options.chat_id, options.text, {
        parse_mode: options.parse_mode,
        reply_markup: options.reply_markup,
        disable_web_page_preview: options.disable_web_page_preview,
      });
      
      this.logger.debug(`Message sent to chat ${options.chat_id}`);
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      throw error;
    }
  }

  public async sendTypingAction(chatId: number): Promise<void> {
    try {
      await this.bot.sendChatAction(chatId, 'typing');
    } catch (error) {
      this.logger.error('Failed to send typing action:', error);
    }
  }

  private async pollForUpdates(): Promise<void> {
    if (!this.isPollingActive) {
      return;
    }

    try {
      const updates = await this.getUpdates();
      
      if (updates.length > 0) {
        this.logger.debug(`Received ${updates.length} updates`);
        
        // Process updates sequentially to maintain order
        for (const update of updates) {
          await this.handleUpdate(update);
        }
      }
    } catch (error) {
      this.logger.error('Error polling for updates:', error);
      
      // Implement exponential backoff on errors
      await this.sleep(Math.min(config.telegram.pollingInterval * 2, 10000));
    }
  }

  private mapMessage(botMessage: any): TelegramMessage {
    return {
      message_id: botMessage.message_id,
      from: botMessage.from ? {
        id: botMessage.from.id,
        is_bot: botMessage.from.is_bot,
        first_name: botMessage.from.first_name,
        last_name: botMessage.from.last_name,
        username: botMessage.from.username,
        language_code: botMessage.from.language_code,
      } : undefined,
      chat: {
        id: botMessage.chat.id,
        type: botMessage.chat.type,
        title: botMessage.chat.title,
        username: botMessage.chat.username,
        first_name: botMessage.chat.first_name,
        last_name: botMessage.chat.last_name,
      },
      date: botMessage.date,
      text: botMessage.text,
      reply_to_message: botMessage.reply_to_message ? this.mapMessage(botMessage.reply_to_message) : undefined,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Graceful shutdown
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down Telegram polling service...');
    await this.stopPolling();
    this.logger.info('Telegram polling service shut down complete');
  }
}