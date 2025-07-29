import { TelegramPollingService } from './telegram-polling';
import { MessageFormatter, MessageFormatterOptions } from '@/utils/message-formatter';
import { SendMessageOptions, InlineKeyboardMarkup } from '@/types/telegram';
import { UserContext } from '@/types/auth';
import { Logger } from '@/utils/logger';
import { serviceResilience } from '@/utils/service-resilience';
import { TelegramError, NetworkError, RateLimitError } from '@/utils/custom-errors';

export interface DeliveryOptions {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
  replyMarkup?: InlineKeyboardMarkup;
  retryAttempts?: number;
  retryDelay?: number;
  priority?: 'high' | 'normal' | 'low';
  splitLongMessages?: boolean;
  showTyping?: boolean;
}

export interface QueuedMessage {
  chatId: number;
  message: string;
  options: DeliveryOptions;
  timestamp: number;
  attempts: number;
  priority: number;
}

export class ResponseDeliveryService {
  private telegramService: TelegramPollingService;
  private messageFormatter: MessageFormatter;
  private messageQueue: QueuedMessage[] = [];
  private isProcessingQueue = false;
  private rateLimitDelay = 1000; // 1 second between messages
  private lastMessageTime = 0;
  private logger = new Logger('ResponseDelivery');

  constructor(telegramService: TelegramPollingService) {
    this.telegramService = telegramService;
    this.messageFormatter = new MessageFormatter();
    this.startQueueProcessor();
    this.logger.info('Response Delivery Service initialized');
  }

  /**
   * Send a formatted response with retry logic and queue management
   */
  public async sendResponse(
    chatId: number,
    message: string,
    userContext?: UserContext,
    options: DeliveryOptions = {}
  ): Promise<boolean> {
    try {
      const {
        parseMode = 'HTML',
        retryAttempts = 3,
        priority = 'normal',
        splitLongMessages = true,
        showTyping = true,
      } = options;

      // Show typing indicator if requested
      if (showTyping) {
        await this.showTypingIndicator(chatId);
      }

      // Format message with user preferences
      const formatterOptions: MessageFormatterOptions = {
        currency: userContext?.preferences.currency || 'IDR',
        language: userContext?.preferences.language || 'en',
        includeEmojis: true,
      };

      let formattedMessage = message;

      // Split long messages if needed
      const messageParts = splitLongMessages 
        ? this.messageFormatter.splitLongMessage(formattedMessage)
        : [formattedMessage];

      // Queue all message parts
      for (let i = 0; i < messageParts.length; i++) {
        const part = messageParts[i];
        const isLastPart = i === messageParts.length - 1;
        
        const queuedMessage: QueuedMessage = {
          chatId,
          message: part,
          options: {
            ...options,
            parseMode,
            retryAttempts,
            // Only add reply markup to the last part
            replyMarkup: isLastPart ? options.replyMarkup : undefined,
          },
          timestamp: Date.now(),
          attempts: 0,
          priority: this.getPriorityValue(priority),
        };

        this.addToQueue(queuedMessage);
      }

      return true;

    } catch (error) {
      this.logger.error('Error in sendResponse:', error);
      return false;
    }
  }

  /**
   * Send a formatted error message
   */
  public async sendError(
    chatId: number,
    error: Error | string,
    context?: string,
    userContext?: UserContext
  ): Promise<boolean> {
    const formattedError = this.messageFormatter.formatError(error, context, {
      currency: userContext?.preferences.currency,
      language: userContext?.preferences.language,
    });

    return this.sendResponse(chatId, formattedError, userContext, {
      priority: 'high',
      showTyping: false,
    });
  }

  /**
   * Send a message with interactive buttons
   */
  public async sendInteractiveMessage(
    chatId: number,
    message: string,
    buttons: Array<Array<{ text: string; callbackData: string }>>,
    userContext?: UserContext
  ): Promise<boolean> {
    const inlineKeyboard: InlineKeyboardMarkup = {
      inline_keyboard: buttons.map(row => 
        row.map(button => ({
          text: button.text,
          callback_data: button.callbackData,
        }))
      ),
    };

    return this.sendResponse(chatId, message, userContext, {
      replyMarkup: inlineKeyboard,
      priority: 'high',
    });
  }

  /**
   * Send a confirmation message with Yes/No buttons
   */
  public async sendConfirmation(
    chatId: number,
    message: string,
    confirmData: string,
    cancelData: string,
    userContext?: UserContext
  ): Promise<boolean> {
    const buttons = [[
      { text: '✅ Yes', callbackData: confirmData },
      { text: '❌ No', callbackData: cancelData },
    ]];

    return this.sendInteractiveMessage(chatId, message, buttons, userContext);
  }

  /**
   * Send a help message with proper formatting
   */
  public async sendHelp(
    chatId: number,
    isAuthenticated: boolean,
    userContext?: UserContext
  ): Promise<boolean> {
    const helpMessage = this.messageFormatter.formatHelpMessage(
      isAuthenticated,
      userContext,
      {
        currency: userContext?.preferences.currency,
        language: userContext?.preferences.language,
      }
    );

    return this.sendResponse(chatId, helpMessage, userContext, {
      priority: 'high',
      disableWebPagePreview: true,
    });
  }

  /**
   * Send typing indicator
   */
  public async showTypingIndicator(chatId: number): Promise<void> {
    try {
      await this.telegramService.sendTypingAction(chatId);
    } catch (error) {
      this.logger.debug('Failed to send typing indicator:', error);
    }
  }

  /**
   * Add message to priority queue
   */
  private addToQueue(message: QueuedMessage): void {
    this.messageQueue.push(message);
    
    // Sort by priority (higher number = higher priority) and timestamp
    this.messageQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    this.logger.debug(`Added message to queue. Queue length: ${this.messageQueue.length}`);
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.messageQueue.length > 0) {
        await this.processQueue();
      }
    }, 100); // Check every 100ms
  }

  /**
   * Process the message queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Respect rate limiting
      const now = Date.now();
      const timeSinceLastMessage = now - this.lastMessageTime;
      
      if (timeSinceLastMessage < this.rateLimitDelay) {
        const waitTime = this.rateLimitDelay - timeSinceLastMessage;
        await this.sleep(waitTime);
      }

      const message = this.messageQueue.shift();
      if (!message) {
        return;
      }

      const success = await this.deliverMessage(message);
      
      if (!success && message.attempts < (message.options.retryAttempts || 3)) {
        // Retry with exponential backoff
        message.attempts++;
        message.timestamp = Date.now() + (message.options.retryDelay || 1000) * Math.pow(2, message.attempts - 1);
        
        // Re-add to queue for retry
        this.addToQueue(message);
        
        this.logger.warn(`Message delivery failed, queued for retry (attempt ${message.attempts})`);
      } else if (!success) {
        this.logger.error(`Message delivery failed after ${message.attempts} attempts, dropping message`);
      }

      this.lastMessageTime = Date.now();

    } catch (error) {
      this.logger.error('Error processing message queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Deliver a single message
   */
  private async deliverMessage(queuedMessage: QueuedMessage): Promise<boolean> {
    try {
      const sendOptions: SendMessageOptions = {
        chat_id: queuedMessage.chatId,
        text: queuedMessage.message,
        parse_mode: queuedMessage.options.parseMode || 'HTML',
        disable_web_page_preview: queuedMessage.options.disableWebPagePreview,
        reply_markup: queuedMessage.options.replyMarkup,
      };

      // Use service resilience for message delivery
      await serviceResilience.executeWithResilience(
        'telegram-api',
        () => this.telegramService.sendMessage(sendOptions),
        [
          // Fallback: try without formatting
          () => this.telegramService.sendMessage({
            ...sendOptions,
            parse_mode: undefined,
            text: this.stripFormatting(sendOptions.text),
          }),
          // Final fallback: simple error message
          () => this.telegramService.sendMessage({
            chat_id: sendOptions.chat_id,
            text: 'Message delivery failed. Please try again.',
          }),
        ],
        `message delivery to chat ${queuedMessage.chatId}`
      );
      
      this.logger.debug(`Message delivered successfully to chat ${queuedMessage.chatId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to deliver message to chat ${queuedMessage.chatId}:`, error);
      
      // Transform error to appropriate type
      const transformedError = this.transformError(error);
      throw transformedError;
    }
  }

  /**
   * Transform generic errors to specific error types
   */
  private transformError(error: any): Error {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return new RateLimitError('Telegram rate limit exceeded', { originalError: error });
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return new NetworkError('Network error communicating with Telegram', { originalError: error });
    }
    
    return new TelegramError('Telegram API error', { originalError: error });
  }

  /**
   * Strip HTML/Markdown formatting from text
   */
  private stripFormatting(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    // Retryable errors
    const retryableErrors = [
      'network',
      'timeout',
      'connection',
      'temporary',
      'rate limit',
      'too many requests',
    ];

    // Non-retryable errors
    const nonRetryableErrors = [
      'bot was blocked',
      'user not found',
      'chat not found',
      'message too long',
      'invalid',
      'forbidden',
    ];

    // Check for non-retryable errors first
    for (const nonRetryable of nonRetryableErrors) {
      if (errorMessage.includes(nonRetryable)) {
        return false;
      }
    }

    // Check for retryable errors
    for (const retryable of retryableErrors) {
      if (errorMessage.includes(retryable)) {
        return true;
      }
    }

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Get numeric priority value
   */
  private getPriorityValue(priority: 'high' | 'normal' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status for monitoring
   */
  public getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    lastMessageTime: number;
  } {
    return {
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessingQueue,
      lastMessageTime: this.lastMessageTime,
    };
  }

  /**
   * Clear the message queue (for emergency situations)
   */
  public clearQueue(): void {
    this.messageQueue = [];
    this.logger.warn('Message queue cleared');
  }

  /**
   * Shutdown the delivery service
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down Response Delivery Service...');
    
    // Wait for queue to empty or timeout after 10 seconds
    const maxWaitTime = 10000;
    const startTime = Date.now();
    
    while (this.messageQueue.length > 0 && (Date.now() - startTime) < maxWaitTime) {
      await this.sleep(100);
    }
    
    if (this.messageQueue.length > 0) {
      this.logger.warn(`Shutdown with ${this.messageQueue.length} messages still in queue`);
    }
    
    this.logger.info('Response Delivery Service shutdown complete');
  }
}