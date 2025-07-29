import { TelegramPollingService } from '@/services/telegram-polling';
import { TelegramUpdate } from '@/types/telegram';
import { TelegramAuthServiceImpl } from '@/services/auth-service';
import { AIMessageProcessorImpl } from '@/services/ai-message-processor';
import { AuthMiddleware, AuthenticatedUpdate, RateLimitMiddleware } from '@/utils/auth-middleware';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';

class TelegramBot {
  private pollingService: TelegramPollingService;
  private authService: TelegramAuthServiceImpl;
  private aiMessageProcessor: AIMessageProcessorImpl;
  private authMiddleware: AuthMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger = new Logger('TelegramBot');

  constructor() {
    this.pollingService = new TelegramPollingService();
    this.authService = new TelegramAuthServiceImpl();
    this.aiMessageProcessor = new AIMessageProcessorImpl();
    this.authMiddleware = new AuthMiddleware(this.authService);
    this.rateLimitMiddleware = new RateLimitMiddleware(config.telegram.rateLimitPerUser);
    
    this.setupMessageHandlers();
    this.setupGracefulShutdown();
    this.setupPeriodicCleanup();
  }

  private setupMessageHandlers(): void {
    // Register the main message handler
    this.pollingService.addMessageHandler(this.handleUpdate.bind(this));
  }

  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      if (!update.message?.text || !update.message.from) {
        return;
      }

      const chatId = update.message.chat.id;
      const telegramId = update.message.from.id.toString();
      const text = update.message.text.trim();
      const username = update.message.from.username || update.message.from.first_name;

      this.logger.info(`Received message from ${username} (${telegramId}): ${text}`);

      // Check rate limiting
      if (!this.rateLimitMiddleware.checkRateLimit(telegramId)) {
        await this.pollingService.sendMessage({
          chat_id: chatId,
          text: this.rateLimitMiddleware.getRateLimitMessage(),
        });
        return;
      }

      // Process through auth middleware
      const authenticatedUpdate = await this.authMiddleware.processUpdate(update, {
        requireAuth: false, // We'll handle auth per command
        allowCommands: ['/start', '/help', 'help', 'link', 'demo']
      });

      // Send typing indicator
      await this.pollingService.sendTypingAction(chatId);

      // Route to appropriate handler
      await this.routeMessage(authenticatedUpdate, chatId, telegramId, text, username);

    } catch (error) {
      this.logger.error('Error handling update:', error);
      
      // Send generic error message to user
      if (update.message?.chat?.id) {
        await this.pollingService.sendMessage({
          chat_id: update.message.chat.id,
          text: '❌ Sorry, something went wrong. Please try again later.',
        });
      }
    }
  }

  private async routeMessage(
    update: AuthenticatedUpdate, 
    chatId: number, 
    telegramId: string, 
    text: string, 
    username: string
  ): Promise<void> {
    const lowerText = text.toLowerCase();
    const { isAuthenticated, userContext } = this.authMiddleware.getAuthStatus(update);

    let response: string;

    // Handle commands that don't require authentication
    if (lowerText.startsWith('/start') || lowerText === 'start') {
      response = await this.handleStartCommand(isAuthenticated, username);
    } 
    else if (lowerText.includes('help')) {
      response = await this.handleHelpCommand(isAuthenticated);
    }
    else if (lowerText.includes('link') && lowerText.includes('account')) {
      response = await this.handleLinkAccountCommand(telegramId);
    }
    else if (lowerText.startsWith('demo') && lowerText.includes('link')) {
      response = await this.handleDemoLinkCommand(telegramId);
    }
    else if (lowerText.includes('unlink')) {
      response = await this.handleUnlinkCommand(telegramId, isAuthenticated);
    }
    else if (lowerText.includes('status') || lowerText.includes('account')) {
      response = await this.handleStatusCommand(isAuthenticated, userContext);
    }
    // Commands that require authentication
    else if (isAuthenticated) {
      response = await this.handleAuthenticatedCommand(text, userContext!, update);
    }
    // Unauthenticated user trying to use protected features
    else {
      response = this.authMiddleware.getAuthRequiredMessage(telegramId);
    }

    // Send response
    await this.pollingService.sendMessage({
      chat_id: chatId,
      text: response,
      parse_mode: 'HTML',
    });

    this.logger.info(`Sent response to ${username} (${telegramId})`);
  }

  private async handleStartCommand(isAuthenticated: boolean, username: string): Promise<string> {
    if (isAuthenticated) {
      return `👋 Welcome back, ${username}!\n\n` +
             `Your account is linked and ready to use. Here's what you can do:\n\n` +
             `💸 **Add transactions**: "I spent 50000 on food today"\n` +
             `📊 **View dashboard**: "Show my spending summary"\n` +
             `📝 **Transaction history**: "Show my recent transactions"\n` +
             `🔄 **Subscriptions**: "Show my subscriptions"\n` +
             `💡 **Insights**: "Give me spending insights"\n\n` +
             `Just talk to me naturally - I'll understand! 😊`;
    }

    return `👋 Welcome to Clair AI Assistant, ${username}!\n\n` +
           `I'm here to help you manage your finances through natural conversation.\n\n` +
           `🔗 **To get started**, you need to link your Clair account:\n` +
           `• Type "link account" for the full process\n` +
           `• Type "demo link" for a quick demo\n\n` +
           `💰 **Once linked**, you can:\n` +
           `• Add transactions naturally\n` +
           `• View spending insights\n` +
           `• Manage subscriptions\n` +
           `• Get personalized advice\n\n` +
           `Type "help" to learn more! 🚀`;
  }

  private async handleHelpCommand(isAuthenticated: boolean): Promise<string> {
    const baseHelp = `🤖 **Clair AI Assistant Help**\n\n`;
    
    if (isAuthenticated) {
      return baseHelp +
             `**💸 Transaction Management:**\n` +
             `• "I spent 50000 on food today"\n` +
             `• "Add 25000 transportation expense"\n` +
             `• "Show my recent transactions"\n\n` +
             `**📊 Dashboard & Insights:**\n` +
             `• "Show my spending summary"\n` +
             `• "How much did I spend this week?"\n` +
             `• "Give me spending insights"\n\n` +
             `**🔄 Subscriptions:**\n` +
             `• "Show my subscriptions"\n` +
             `• "Add Netflix subscription 169000 monthly"\n\n` +
             `**⚙️ Account Management:**\n` +
             `• "account status" - Check your link status\n` +
             `• "unlink account" - Remove account link\n\n` +
             `Just talk naturally - I understand context! 😊`;
    }

    return baseHelp +
           `**🔗 Getting Started:**\n` +
           `• "link account" - Connect your Clair account\n` +
           `• "demo link" - Try with demo data\n\n` +
           `**📚 What you can do after linking:**\n` +
           `• Add transactions by describing them\n` +
           `• View spending summaries and insights\n` +
           `• Manage subscriptions conversationally\n` +
           `• Get personalized financial advice\n\n` +
           `**❓ Need help?**\n` +
           `• "help" - Show this message\n` +
           `• "account status" - Check link status\n\n` +
           `Ready to get started? Type "link account"! 🚀`;
  }

  private async handleLinkAccountCommand(telegramId: string): Promise<string> {
    try {
      const authUrl = await this.authService.generateAuthLink(telegramId);
      
      return `🔐 **Account Linking Process**\n\n` +
             `To securely link your Clair account:\n\n` +
             `1️⃣ Click this secure link: ${authUrl}\n` +
             `2️⃣ Log in with your Clair credentials\n` +
             `3️⃣ Authorize the Telegram bot access\n` +
             `4️⃣ Return here and start using the bot!\n\n` +
             `🔒 **Security Note:** This link is unique to you and expires in 10 minutes.\n\n` +
             `**For demo purposes**, you can also type "demo link" to try with sample data.`;
    } catch (error) {
      this.logger.error('Error generating auth link:', error);
      return `❌ Sorry, I couldn't generate the authentication link right now. Please try again later.`;
    }
  }

  private async handleDemoLinkCommand(telegramId: string): Promise<string> {
    try {
      const result = await this.authService.createDemoLink(telegramId);
      return result.message;
    } catch (error) {
      this.logger.error('Error creating demo link:', error);
      return `❌ Sorry, I couldn't create the demo link right now. Please try again later.`;
    }
  }

  private async handleUnlinkCommand(telegramId: string, isAuthenticated: boolean): Promise<string> {
    if (!isAuthenticated) {
      return `ℹ️ Your account is not currently linked.\n\nType "link account" to connect your Clair account.`;
    }

    try {
      await this.authService.unlinkAccount(telegramId);
      return `✅ **Account Unlinked Successfully**\n\n` +
             `Your Telegram account has been disconnected from Clair.\n\n` +
             `To use the bot features again, you'll need to link your account.\n` +
             `Type "link account" when you're ready! 👋`;
    } catch (error) {
      this.logger.error('Error unlinking account:', error);
      return `❌ Sorry, I couldn't unlink your account right now. Please try again later.`;
    }
  }

  private async handleStatusCommand(isAuthenticated: boolean, userContext?: any): Promise<string> {
    if (!isAuthenticated) {
      return `🔓 **Account Status: Not Linked**\n\n` +
             `Your Telegram account is not connected to Clair.\n\n` +
             `**To link your account:**\n` +
             `• Type "link account" for full setup\n` +
             `• Type "demo link" for demo mode\n\n` +
             `Once linked, you can manage your finances through chat! 💰`;
    }

    const preferences = userContext?.preferences || {};
    return `🔗 **Account Status: Linked** ✅\n\n` +
           `**Account Details:**\n` +
           `• User ID: ${userContext?.userId?.substring(0, 8)}...\n` +
           `• Linked: ${new Date(userContext?.linkedAt).toLocaleDateString()}\n\n` +
           `**Preferences:**\n` +
           `• Language: ${preferences.language || 'en'}\n` +
           `• Currency: ${preferences.currency || 'IDR'}\n` +
           `• Notifications: ${preferences.notifications ? '✅' : '❌'}\n\n` +
           `**Available Features:**\n` +
           `💸 Transaction management\n` +
           `📊 Dashboard insights\n` +
           `🔄 Subscription tracking\n` +
           `💡 AI-powered advice\n\n` +
           `Type "help" to see what you can do!`;
  }

  private async handleAuthenticatedCommand(text: string, userContext: any, update: AuthenticatedUpdate): Promise<string> {
    try {
      // Use AI to process the message and determine intent
      const processedMessage = await this.aiMessageProcessor.processMessage(update.message!, userContext);
      
      this.logger.debug(`AI processed intent: ${processedMessage.intent.type}, confidence: ${processedMessage.confidence}`);
      
      // Generate contextual response using AI
      const response = await this.aiMessageProcessor.generateResponse(
        processedMessage.intent,
        userContext,
        text
      );
      
      return response;
      
    } catch (error) {
      this.logger.error('Error in AI processing:', error);
      
      // Fallback to basic processing
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('transaction') || lowerText.includes('spent') || lowerText.includes('expense')) {
        return `💸 **Transaction Processing** (AI Fallback)\n\n` +
               `I received: "${text}"\n\n` +
               `🤖 AI processing encountered an issue, but I can still help!\n` +
               `Try being more specific: "I spent 50000 on food today"`;
      }
      
      if (lowerText.includes('dashboard') || lowerText.includes('summary') || lowerText.includes('spending')) {
        return `📊 **Dashboard Summary** (AI Fallback)\n\n` +
               `🤖 AI processing encountered an issue, but dashboard features are coming soon!\n` +
               `Soon I'll show you spending comparisons and insights!`;
      }
      
      if (lowerText.includes('subscription')) {
        return `🔄 **Subscription Management** (AI Fallback)\n\n` +
               `🤖 AI processing encountered an issue, but subscription features are coming soon!\n` +
               `Soon I'll help you track and manage recurring expenses!`;
      }
      
      return `🤖 I understand you said: "${text}"\n\n` +
             `AI processing encountered an issue, but your account is linked and ready!\n\n` +
             `For now, try:\n` +
             `• "account status" - Check your account\n` +
             `• "help" - See available commands\n\n` +
             `AI features will be more stable soon! 🚀`;
    }
  }

  private setupPeriodicCleanup(): void {
    // Clean up rate limiting data every 5 minutes
    setInterval(() => {
      this.rateLimitMiddleware.cleanup();
    }, 5 * 60 * 1000);
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        await this.pollingService.shutdown();
        this.logger.info('Bot shutdown complete');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  public async start(): Promise<void> {
    try {
      this.logger.info('Starting Clair Telegram Bot...');
      this.logger.info(`Environment: ${config.app.nodeEnv}`);
      this.logger.info(`Log level: ${config.app.logLevel}`);
      this.logger.info(`Polling interval: ${config.telegram.pollingInterval}ms`);
      
      await this.pollingService.startPolling();
      
      this.logger.info('🤖 Clair Telegram Bot is running!');
      this.logger.info('Press Ctrl+C to stop the bot');
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }
}

// Start the bot
const bot = new TelegramBot();
bot.start().catch((error) => {
  console.error('Failed to start Telegram bot:', error);
  process.exit(1);
});