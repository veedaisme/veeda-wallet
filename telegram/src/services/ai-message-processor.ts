import { 
  AIMessageProcessor,
  ProcessedMessage, 
  MessageIntent, 
  UserContext 
} from '@/types/ai';
import { 
  ConversationContext,
  CreateConversationContextData,
  UpdateConversationContextData 
} from '@/types/auth';
import { TelegramMessage } from '@/types/telegram';
import { AIIntentService } from './ai-intent-service';
import { TransactionAIService } from './transaction-ai-service';
import { TransactionService } from './transaction-service';
import { TransactionMCPService } from './transaction-mcp-service';
import { DashboardAIService } from './dashboard-ai-service';
import { InsightsAIService } from './insights-ai-service';
import { SubscriptionAIService } from './subscription-ai-service';
import { SubscriptionService } from './subscription-service';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';
import { serviceResilience } from '@/utils/service-resilience';
import { AIError, ValidationError } from '@/utils/custom-errors';
import crypto from 'crypto';

interface ConversationState {
  lastIntent?: MessageIntent;
  pendingTransaction?: {
    amount?: number;
    category?: string;
    note?: string;
    date?: string;
    needsConfirmation: boolean;
  };
  awaitingConfirmation?: boolean;
  conversationFlow?: string;
  messageHistory: Array<{
    timestamp: string;
    message: string;
    intent: string;
    response: string;
  }>;
}

export class AIMessageProcessorImpl implements AIMessageProcessor {
  private aiIntentService: AIIntentService;
  private transactionAIService: TransactionAIService;
  private transactionService: TransactionService;
  private transactionMCPService: TransactionMCPService;
  private dashboardAIService: DashboardAIService;
  private insightsAIService: InsightsAIService;
  private subscriptionAIService: SubscriptionAIService;
  private subscriptionService: SubscriptionService;
  private logger = new Logger('AIMessageProcessor');
  private conversationContexts = new Map<string, ConversationContext>(); // In-memory storage for demo

  constructor() {
    this.aiIntentService = new AIIntentService();
    this.transactionAIService = new TransactionAIService();
    this.transactionService = new TransactionService();
    this.transactionMCPService = new TransactionMCPService();
    this.dashboardAIService = new DashboardAIService();
    this.insightsAIService = new InsightsAIService();
    this.subscriptionAIService = new SubscriptionAIService();
    this.subscriptionService = new SubscriptionService();
    this.logger.info('AI Message Processor initialized with all services including subscriptions');
    this.setupContextCleanup();
  }

  /**
   * Process a message and return structured intent and entities
   */
  public async processMessage(message: TelegramMessage, userContext?: UserContext): Promise<ProcessedMessage> {
    try {
      const telegramId = message.from?.id.toString();
      if (!telegramId) {
        throw new Error('No Telegram ID found in message');
      }

      // Get or create conversation context
      const conversationContext = await this.getOrCreateConversationContext(telegramId);
      
      // Process the message with AI using service resilience
      const processedMessage = await serviceResilience.executeWithErrorFallback(
        'ai-service',
        () => this.aiIntentService.processMessage(message, userContext),
        '❌ I\'m having trouble understanding your message right now. Could you please try rephrasing it?',
        'AI message processing'
      );
      
      // Update conversation context with the new message
      await this.updateConversationContext(telegramId, {
        lastIntent: processedMessage.intent,
        messageText: message.text || '',
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Processed message for ${telegramId}: ${processedMessage.intent.type}`);
      
      return processedMessage;

    } catch (error) {
      this.logger.error('Error processing message:', error);
      throw error;
    }
  }

  /**
   * Generate a contextual response based on intent and conversation history
   */
  public async generateResponse(
    intent: MessageIntent, 
    context: UserContext,
    originalMessage: string,
    additionalData?: any
  ): Promise<string> {
    try {
      const telegramId = context.telegramId;
      const conversationContext = await this.getConversationContext(telegramId);
      const conversationState = this.parseConversationState(conversationContext);

      // Handle different types of intents with context awareness
      switch (intent.type) {
        case 'ADD_TRANSACTION':
          return await this.handleTransactionIntent(intent, context, originalMessage, conversationState);
        
        case 'VIEW_TRANSACTIONS':
          return await this.handleViewTransactionsIntent(intent, context, conversationState, originalMessage);
        
        case 'DASHBOARD':
          return await this.handleDashboardIntent(intent, context, conversationState);
        
        case 'INSIGHTS':
          return await this.handleInsightsIntent(intent, context, conversationState);
        
        case 'SUBSCRIPTIONS':
          return await this.handleSubscriptionsIntent(intent, context, conversationState, originalMessage);
        
        default:
          return await this.aiIntentService.generateResponse(intent, context, originalMessage, additionalData);
      }

    } catch (error) {
      this.logger.error('Error generating response:', error);
      return '❌ Sorry, I encountered an error processing your request. Please try again.';
    }
  }

  /**
   * Handle transaction-related intents with conversation flow
   */
  private async handleTransactionIntent(
    intent: MessageIntent,
    context: UserContext,
    originalMessage: string,
    conversationState: ConversationState
  ): Promise<string> {
    try {
      // Check if we're in a confirmation flow
      if (conversationState.awaitingConfirmation && conversationState.pendingTransaction) {
        return await this.handleTransactionConfirmation(originalMessage, context, conversationState);
      }

      // Extract transaction details using AI
      const transactionDetails = await this.transactionAIService.parseTransactionFromText(
        originalMessage, 
        context.preferences.currency
      );
      
      // Try to create the transaction using the transaction service
      const result = await this.transactionService.createTransactionFromParsed(transactionDetails, context);
      
      if (result.success) {
        // Transaction created successfully
        await this.updateConversationState(context.telegramId, {
          ...conversationState,
          pendingTransaction: undefined,
          awaitingConfirmation: false,
          conversationFlow: undefined,
        });
        
        return result.message;
      } else if (result.needsConfirmation) {
        // Need confirmation from user
        await this.updateConversationState(context.telegramId, {
          ...conversationState,
          pendingTransaction: transactionDetails,
          awaitingConfirmation: true,
          conversationFlow: 'transaction_confirmation',
        });
        
        return result.message;
      } else {
        // Error occurred
        return result.message;
      }

    } catch (error) {
      this.logger.error('Error handling transaction intent:', error);
      return '❌ Sorry, I had trouble processing your transaction. Could you please try again with more details?';
    }
  }

  /**
   * Handle transaction confirmation flow
   */
  private async handleTransactionConfirmation(
    userResponse: string,
    context: UserContext,
    conversationState: ConversationState
  ): Promise<string> {
    try {
      if (!conversationState.pendingTransaction) {
        return '❌ No pending transaction found. Please start over with your transaction details.';
      }

      const result = await this.transactionService.processTransactionConfirmation(
        conversationState.pendingTransaction,
        userResponse,
        context
      );

      if (result.success) {
        // Transaction confirmed and created
        await this.updateConversationState(context.telegramId, {
          ...conversationState,
          pendingTransaction: undefined,
          awaitingConfirmation: false,
          conversationFlow: undefined,
        });
      } else if (result.needsMoreInfo) {
        // User provided additional info, need to re-process
        await this.updateConversationState(context.telegramId, {
          ...conversationState,
          awaitingConfirmation: false,
          conversationFlow: undefined,
        });
      } else {
        // Keep current state for retry or cancellation
      }

      return result.message;

    } catch (error) {
      this.logger.error('Error handling transaction confirmation:', error);
      return '❌ Sorry, I had trouble processing your confirmation. Please try again.';
    }
  }

  /**
   * Handle view transactions intent
   */
  private async handleViewTransactionsIntent(
    intent: MessageIntent,
    context: UserContext,
    conversationState: ConversationState,
    originalMessage?: string
  ): Promise<string> {
    try {
      // Parse the user's query to determine what they want to see
      const query = originalMessage || 'recent transactions';
      const parsedQuery = await this.transactionMCPService.parseTransactionQuery(query);
      
      this.logger.debug(`Parsed transaction query: ${parsedQuery.type}`, parsedQuery.parameters);

      // Route to appropriate MCP service method based on query type
      switch (parsedQuery.type) {
        case 'recent':
          const recentResult = await this.transactionMCPService.getRecentTransactions(
            context, 
            parsedQuery.parameters.limit || 10
          );
          return recentResult.message;

        case 'category':
          const categoryResult = await this.transactionMCPService.getTransactionsByCategory(
            context, 
            parsedQuery.parameters.category
          );
          return categoryResult.message;

        case 'dateRange':
          const dateRangeResult = await this.transactionMCPService.getTransactionsByDateRange(
            context,
            parsedQuery.parameters.startDate,
            parsedQuery.parameters.endDate
          );
          return dateRangeResult.message;

        case 'search':
          const searchResult = await this.transactionMCPService.searchTransactions(
            context,
            parsedQuery.parameters.searchTerm,
            20
          );
          return searchResult.message;

        default:
          // Fallback to recent transactions
          const defaultResult = await this.transactionMCPService.getRecentTransactions(context, 10);
          return defaultResult.message;
      }

    } catch (error) {
      this.logger.error('Error handling view transactions intent:', error);
      return '❌ Sorry, I couldn\'t retrieve your transactions right now. Please try again later.';
    }
  }

  /**
   * Handle dashboard intent
   */
  private async handleDashboardIntent(
    intent: MessageIntent,
    context: UserContext,
    conversationState: ConversationState
  ): Promise<string> {
    try {
      this.logger.info(`Fetching dashboard for user ${context.userId}`);

      // Get dashboard summary
      const dashboardResult = await this.dashboardAIService.getDashboardSummary(context);
      
      if (!dashboardResult.success) {
        return dashboardResult.message;
      }

      // Check if user wants visualization
      const messageHistory = conversationState.messageHistory.slice(-3);
      const wantsChart = messageHistory.some(h => 
        h.message.toLowerCase().includes('chart') || 
        h.message.toLowerCase().includes('graph') ||
        h.message.toLowerCase().includes('visual')
      );

      if (wantsChart) {
        // Add spending visualization
        const visualization = await this.dashboardAIService.getSpendingVisualization(context, 'weekly');
        return `${dashboardResult.message}\n\n${visualization}`;
      }

      return dashboardResult.message;

    } catch (error) {
      this.logger.error('Error handling dashboard intent:', error);
      return '❌ Sorry, I couldn\'t fetch your dashboard right now. Please try again later.';
    }
  }

  /**
   * Handle insights intent
   */
  private async handleInsightsIntent(
    intent: MessageIntent,
    context: UserContext,
    conversationState: ConversationState
  ): Promise<string> {
    try {
      this.logger.info(`Generating insights for user ${context.userId}`);

      // Get recent transactions for analysis
      const transactionsResult = await this.transactionMCPService.getRecentTransactions(context, 20);
      
      if (!transactionsResult.success || !transactionsResult.transactions || transactionsResult.transactions.length < 3) {
        return `💡 **Insights Coming Soon!**\n\n` +
               `I need more transaction data to provide meaningful insights.\n\n` +
               `**Current data:** ${transactionsResult.transactions?.length || 0} transactions\n` +
               `**Needed:** At least 5-10 transactions\n\n` +
               `Keep adding transactions and ask me again soon! 📈`;
      }

      // Get dashboard summary for trend analysis
      const dashboardResult = await this.dashboardAIService.getDashboardSummary(context);
      
      if (!dashboardResult.success || !dashboardResult.summary) {
        return '❌ Sorry, I couldn\'t fetch your spending data for insights right now.';
      }

      // Check what type of insights the user wants
      const messageHistory = conversationState.messageHistory.slice(-3);
      const wantsComprehensive = messageHistory.some(h => 
        h.message.toLowerCase().includes('comprehensive') || 
        h.message.toLowerCase().includes('detailed') ||
        h.message.toLowerCase().includes('analysis')
      );

      if (wantsComprehensive) {
        // Generate comprehensive analysis
        const analysisResult = await this.insightsAIService.generateComprehensiveAnalysis(
          transactionsResult.transactions,
          dashboardResult.summary,
          context
        );
        return analysisResult.message;
      } else {
        // Generate personalized recommendations
        const recommendations = await this.insightsAIService.generatePersonalizedRecommendations(
          transactionsResult.transactions,
          dashboardResult.summary,
          context
        );
        return recommendations;
      }

    } catch (error) {
      this.logger.error('Error handling insights intent:', error);
      return '❌ Sorry, I couldn\'t generate insights right now. Please try again later.';
    }
  }

  /**
   * Handle subscriptions intent
   */
  private async handleSubscriptionsIntent(
    intent: MessageIntent,
    context: UserContext,
    conversationState: ConversationState,
    originalMessage?: string
  ): Promise<string> {
    try {
      this.logger.info(`Handling subscriptions for user ${context.userId}`);

      // Check if we're in a subscription confirmation flow
      if (conversationState.awaitingConfirmation && conversationState.conversationFlow === 'subscription_confirmation') {
        return await this.handleSubscriptionConfirmation(originalMessage || '', context, conversationState);
      }

      // Determine what the user wants to do with subscriptions
      const message = originalMessage?.toLowerCase() || '';
      
      // Check if user wants to add a subscription
      if (message.includes('add') || message.includes('subscribe') || message.includes('new')) {
        return await this.handleAddSubscription(originalMessage || '', context, conversationState);
      }
      
      // Check if user wants subscription summary/insights
      if (message.includes('summary') || message.includes('total') || message.includes('cost')) {
        return await this.handleSubscriptionSummary(context);
      }
      
      // Check if user wants upcoming payments
      if (message.includes('upcoming') || message.includes('due') || message.includes('payment')) {
        return await this.handleUpcomingPayments(context);
      }
      
      // Check if user wants insights
      if (message.includes('insight') || message.includes('advice') || message.includes('optimize')) {
        return await this.handleSubscriptionInsights(context);
      }
      
      // Default: show subscription list
      return await this.handleViewSubscriptions(context);

    } catch (error) {
      this.logger.error('Error handling subscriptions intent:', error);
      return '❌ Sorry, I couldn\'t process your subscription request right now. Please try again later.';
    }
  }

  /**
   * Handle adding a new subscription
   */
  private async handleAddSubscription(
    originalMessage: string,
    context: UserContext,
    conversationState: ConversationState
  ): Promise<string> {
    try {
      // Parse subscription details from the message
      const parsedSubscription = await this.subscriptionAIService.parseSubscriptionFromText(
        originalMessage,
        context.preferences.currency
      );

      // Try to create the subscription
      const result = await this.subscriptionService.createSubscriptionFromParsed(parsedSubscription, context);

      if (result.success) {
        // Subscription created successfully
        await this.updateConversationState(context.telegramId, {
          ...conversationState,
          awaitingConfirmation: false,
          conversationFlow: undefined,
        });
        return result.message;
      } else if (result.needsConfirmation) {
        // Need confirmation from user
        await this.updateConversationState(context.telegramId, {
          ...conversationState,
          awaitingConfirmation: true,
          conversationFlow: 'subscription_confirmation',
          pendingSubscription: parsedSubscription,
        });
        return result.message;
      } else {
        return result.message;
      }

    } catch (error) {
      this.logger.error('Error adding subscription:', error);
      return '❌ Sorry, I had trouble adding your subscription. Could you please try again with more details?';
    }
  }

  /**
   * Handle subscription confirmation flow
   */
  private async handleSubscriptionConfirmation(
    userResponse: string,
    context: UserContext,
    conversationState: ConversationState
  ): Promise<string> {
    try {
      const pendingSubscription = (conversationState as any).pendingSubscription;
      if (!pendingSubscription) {
        return '❌ No pending subscription found. Please start over with your subscription details.';
      }

      const result = await this.subscriptionService.processSubscriptionConfirmation(
        pendingSubscription,
        userResponse,
        context
      );

      if (result.success) {
        // Subscription confirmed and created
        await this.updateConversationState(context.telegramId, {
          ...conversationState,
          awaitingConfirmation: false,
          conversationFlow: undefined,
          pendingSubscription: undefined,
        });
      } else if (result.needsMoreInfo) {
        // User provided additional info, need to re-process
        await this.updateConversationState(context.telegramId, {
          ...conversationState,
          awaitingConfirmation: false,
          conversationFlow: undefined,
          pendingSubscription: undefined,
        });
      }

      return result.message;

    } catch (error) {
      this.logger.error('Error handling subscription confirmation:', error);
      return '❌ Sorry, I had trouble processing your confirmation. Please try again.';
    }
  }

  /**
   * Handle viewing subscriptions
   */
  private async handleViewSubscriptions(context: UserContext): Promise<string> {
    try {
      const result = await this.subscriptionService.getUserSubscriptions(context);
      
      if (!result.success) {
        return result.message;
      }

      if (!result.subscriptions || result.subscriptions.length === 0) {
        return result.message;
      }

      // Format subscription list
      const formattedList = this.subscriptionAIService.formatSubscriptionList(
        result.subscriptions,
        context.preferences.currency
      );

      return `${formattedList}\n\n💡 **Try saying:**\n• "subscription summary" for cost overview\n• "upcoming payments" for due dates\n• "add Netflix subscription" to add new ones`;

    } catch (error) {
      this.logger.error('Error viewing subscriptions:', error);
      return '❌ Sorry, I couldn\'t fetch your subscriptions right now. Please try again later.';
    }
  }

  /**
   * Handle subscription summary
   */
  private async handleSubscriptionSummary(context: UserContext): Promise<string> {
    try {
      const result = await this.subscriptionService.getSubscriptionSummary(context);
      
      if (!result.success || !result.summary || !result.subscriptions) {
        return result.message;
      }

      return this.subscriptionAIService.formatSubscriptionSummary(
        result.summary,
        result.subscriptions,
        context.preferences.currency
      );

    } catch (error) {
      this.logger.error('Error getting subscription summary:', error);
      return '❌ Sorry, I couldn\'t fetch your subscription summary right now. Please try again later.';
    }
  }

  /**
   * Handle upcoming payments
   */
  private async handleUpcomingPayments(context: UserContext): Promise<string> {
    try {
      const result = await this.subscriptionService.getUserSubscriptions(context);
      
      if (!result.success || !result.subscriptions) {
        return result.message;
      }

      const upcomingResult = this.subscriptionAIService.getUpcomingPayments(result.subscriptions, 30);
      return upcomingResult.message;

    } catch (error) {
      this.logger.error('Error getting upcoming payments:', error);
      return '❌ Sorry, I couldn\'t fetch your upcoming payments right now. Please try again later.';
    }
  }

  /**
   * Handle subscription insights
   */
  private async handleSubscriptionInsights(context: UserContext): Promise<string> {
    try {
      const result = await this.subscriptionService.getSubscriptionSummary(context);
      
      if (!result.success || !result.summary || !result.subscriptions) {
        return result.message;
      }

      return await this.subscriptionAIService.generateSubscriptionInsights(
        result.subscriptions,
        result.summary,
        context
      );

    } catch (error) {
      this.logger.error('Error generating subscription insights:', error);
      return '❌ Sorry, I couldn\'t generate subscription insights right now. Please try again later.';
    }
  }

  /**
   * Generate clarification message for incomplete transactions
   */
  private generateTransactionClarificationMessage(
    transactionDetails: any,
    context: UserContext
  ): string {
    const missing = [];
    if (!transactionDetails.amount) missing.push('amount');
    if (!transactionDetails.category) missing.push('category');

    let message = `💸 **Transaction Details Needed**\n\n`;
    
    if (transactionDetails.amount) {
      message += `✅ Amount: ${this.formatCurrency(transactionDetails.amount, context.preferences.currency)}\n`;
    } else {
      message += `❓ Amount: Please specify how much you spent\n`;
    }
    
    if (transactionDetails.category) {
      message += `✅ Category: ${transactionDetails.category}\n`;
    } else {
      message += `❓ Category: What category is this expense?\n`;
    }
    
    message += `📅 Date: ${transactionDetails.date || 'Today'}\n`;
    message += `📝 Note: ${transactionDetails.note || 'None'}\n\n`;
    
    message += `**Please provide the missing information:**\n`;
    message += missing.map(item => `• ${item.charAt(0).toUpperCase() + item.slice(1)}`).join('\n');
    
    return message;
  }

  /**
   * Get or create conversation context for a user
   */
  private async getOrCreateConversationContext(telegramId: string): Promise<ConversationContext> {
    let context = this.conversationContexts.get(telegramId);
    
    if (!context || new Date(context.expires_at) < new Date()) {
      // Create new context
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + config.app.sessionTimeout).toISOString();
      
      context = {
        id: crypto.randomUUID(),
        telegram_id: telegramId,
        session_id: sessionId,
        context: {
          messageHistory: [],
          conversationFlow: null,
          pendingTransaction: null,
        },
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };
      
      this.conversationContexts.set(telegramId, context);
      this.logger.debug(`Created new conversation context for ${telegramId}`);
    }
    
    return context;
  }

  /**
   * Get existing conversation context
   */
  private async getConversationContext(telegramId: string): Promise<ConversationContext | null> {
    const context = this.conversationContexts.get(telegramId);
    
    if (context && new Date(context.expires_at) > new Date()) {
      return context;
    }
    
    return null;
  }

  /**
   * Update conversation context
   */
  private async updateConversationContext(
    telegramId: string, 
    updates: {
      lastIntent?: MessageIntent;
      messageText?: string;
      timestamp?: string;
    }
  ): Promise<void> {
    const context = await this.getOrCreateConversationContext(telegramId);
    const state = this.parseConversationState(context);
    
    if (updates.lastIntent && updates.messageText) {
      state.messageHistory.push({
        timestamp: updates.timestamp || new Date().toISOString(),
        message: updates.messageText,
        intent: updates.lastIntent.type,
        response: '', // Will be filled when response is generated
      });
      
      // Keep only last 20 messages
      if (state.messageHistory.length > 20) {
        state.messageHistory = state.messageHistory.slice(-20);
      }
    }
    
    context.context = state;
    this.conversationContexts.set(telegramId, context);
  }

  /**
   * Update conversation state
   */
  private async updateConversationState(telegramId: string, newState: ConversationState): Promise<void> {
    const context = await this.getOrCreateConversationContext(telegramId);
    context.context = newState;
    this.conversationContexts.set(telegramId, context);
  }

  /**
   * Parse conversation state from context
   */
  private parseConversationState(context: ConversationContext | null): ConversationState {
    if (!context || !context.context) {
      return {
        messageHistory: [],
      };
    }
    
    return {
      lastIntent: context.context.lastIntent,
      pendingTransaction: context.context.pendingTransaction,
      awaitingConfirmation: context.context.awaitingConfirmation,
      conversationFlow: context.context.conversationFlow,
      messageHistory: context.context.messageHistory || [],
    };
  }

  /**
   * Format currency based on user preferences
   */
  private formatCurrency(amount: number, currency: string): string {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }

  /**
   * Setup periodic cleanup of expired contexts
   */
  private setupContextCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [telegramId, context] of this.conversationContexts.entries()) {
        if (new Date(context.expires_at) < now) {
          this.conversationContexts.delete(telegramId);
          this.logger.debug(`Cleaned up expired context for ${telegramId}`);
        }
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  /**
   * Get conversation summary for a user
   */
  public async getConversationSummary(telegramId: string): Promise<{
    messageCount: number;
    lastActivity: string | null;
    currentFlow: string | null;
    pendingActions: string[];
  }> {
    const context = await this.getConversationContext(telegramId);
    const state = this.parseConversationState(context);
    
    const pendingActions = [];
    if (state.awaitingConfirmation) {
      pendingActions.push('Transaction confirmation pending');
    }
    if (state.pendingTransaction) {
      pendingActions.push('Transaction details incomplete');
    }
    
    return {
      messageCount: state.messageHistory.length,
      lastActivity: state.messageHistory[state.messageHistory.length - 1]?.timestamp || null,
      currentFlow: state.conversationFlow || null,
      pendingActions,
    };
  }

  /**
   * Clear conversation context for a user
   */
  public async clearConversationContext(telegramId: string): Promise<void> {
    this.conversationContexts.delete(telegramId);
    this.logger.info(`Cleared conversation context for ${telegramId}`);
  }
}