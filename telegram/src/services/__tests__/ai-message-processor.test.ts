import { AIMessageProcessorImpl } from '../ai-message-processor';
import { TelegramMessage } from '@/types/telegram';
import { UserContext, MessageIntent } from '@/types/ai';
import { AIIntentService } from '../ai-intent-service';
import { TransactionAIService } from '../transaction-ai-service';
import { TransactionService } from '../transaction-service';
import { TransactionMCPService } from '../transaction-mcp-service';
import { DashboardAIService } from '../dashboard-ai-service';
import { InsightsAIService } from '../insights-ai-service';
import { SubscriptionAIService } from '../subscription-ai-service';
import { SubscriptionService } from '../subscription-service';

// Mock all dependencies
jest.mock('../ai-intent-service');
jest.mock('../transaction-ai-service');
jest.mock('../transaction-service');
jest.mock('../transaction-mcp-service');
jest.mock('../dashboard-ai-service');
jest.mock('../insights-ai-service');
jest.mock('../subscription-ai-service');
jest.mock('../subscription-service');
jest.mock('@/utils/service-resilience');

describe('AIMessageProcessorImpl', () => {
  let processor: AIMessageProcessorImpl;
  let mockAIIntentService: jest.Mocked<AIIntentService>;
  let mockTransactionAIService: jest.Mocked<TransactionAIService>;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockTransactionMCPService: jest.Mocked<TransactionMCPService>;
  let mockDashboardAIService: jest.Mocked<DashboardAIService>;
  let mockInsightsAIService: jest.Mocked<InsightsAIService>;
  let mockSubscriptionAIService: jest.Mocked<SubscriptionAIService>;
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;

  const mockUserContext: UserContext = {
    userId: 'user123',
    telegramId: '123456789',
    preferences: {
      currency: 'IDR',
      language: 'en',
      notifications: true,
    },
  };

  const mockTelegramMessage: TelegramMessage = {
    message_id: 1,
    from: {
      id: 123456789,
      is_bot: false,
      first_name: 'Test',
      username: 'testuser',
    },
    chat: {
      id: 123456789,
      type: 'private',
    },
    date: Math.floor(Date.now() / 1000),
    text: 'I spent 50000 on food today',
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create processor instance
    processor = new AIMessageProcessorImpl();

    // Get mocked instances
    mockAIIntentService = processor['aiIntentService'] as jest.Mocked<AIIntentService>;
    mockTransactionAIService = processor['transactionAIService'] as jest.Mocked<TransactionAIService>;
    mockTransactionService = processor['transactionService'] as jest.Mocked<TransactionService>;
    mockTransactionMCPService = processor['transactionMCPService'] as jest.Mocked<TransactionMCPService>;
    mockDashboardAIService = processor['dashboardAIService'] as jest.Mocked<DashboardAIService>;
    mockInsightsAIService = processor['insightsAIService'] as jest.Mocked<InsightsAIService>;
    mockSubscriptionAIService = processor['subscriptionAIService'] as jest.Mocked<SubscriptionAIService>;
    mockSubscriptionService = processor['subscriptionService'] as jest.Mocked<SubscriptionService>;
  });

  describe('processMessage', () => {
    it('should process message and return structured intent', async () => {
      const mockProcessedMessage = {
        intent: {
          type: 'ADD_TRANSACTION',
          confidence: 0.9,
          entities: {
            amount: 50000,
            category: 'Food',
          },
        },
        originalMessage: 'I spent 50000 on food today',
        timestamp: new Date().toISOString(),
      };

      mockAIIntentService.processMessage.mockResolvedValue(mockProcessedMessage);

      const result = await processor.processMessage(mockTelegramMessage, mockUserContext);

      expect(result).toEqual(mockProcessedMessage);
      expect(mockAIIntentService.processMessage).toHaveBeenCalledWith(
        mockTelegramMessage,
        mockUserContext
      );
    });

    it('should throw error when no Telegram ID found', async () => {
      const messageWithoutFrom = { ...mockTelegramMessage, from: undefined };

      await expect(
        processor.processMessage(messageWithoutFrom, mockUserContext)
      ).rejects.toThrow('No Telegram ID found in message');
    });

    it('should handle AI service errors', async () => {
      mockAIIntentService.processMessage.mockRejectedValue(new Error('AI service failed'));

      await expect(
        processor.processMessage(mockTelegramMessage, mockUserContext)
      ).rejects.toThrow('AI service failed');
    });
  });

  describe('generateResponse', () => {
    const mockIntent: MessageIntent = {
      type: 'ADD_TRANSACTION',
      confidence: 0.9,
      entities: {
        amount: 50000,
        category: 'Food',
      },
    };

    describe('ADD_TRANSACTION intent', () => {
      it('should handle successful transaction creation', async () => {
        const mockTransactionDetails = {
          amount: 50000,
          category: 'Food',
          date: new Date().toISOString(),
          note: '',
          confidence: 0.9,
          needsConfirmation: false,
        };

        const mockResult = {
          success: true,
          message: '✅ Transaction added successfully!',
          transaction: {
            id: 'tx123',
            user_id: 'user123',
            amount: 50000,
            category: 'Food',
            date: new Date().toISOString(),
            note: '',
          },
        };

        mockTransactionAIService.parseTransactionFromText.mockResolvedValue(mockTransactionDetails);
        mockTransactionService.createTransactionFromParsed.mockResolvedValue(mockResult);

        const response = await processor.generateResponse(
          mockIntent,
          mockUserContext,
          'I spent 50000 on food today'
        );

        expect(response).toBe('✅ Transaction added successfully!');
        expect(mockTransactionAIService.parseTransactionFromText).toHaveBeenCalledWith(
          'I spent 50000 on food today',
          'IDR'
        );
        expect(mockTransactionService.createTransactionFromParsed).toHaveBeenCalledWith(
          mockTransactionDetails,
          mockUserContext
        );
      });

      it('should handle transaction confirmation flow', async () => {
        const mockTransactionDetails = {
          amount: 50000,
          category: 'Food',
          date: new Date().toISOString(),
          note: '',
          confidence: 0.7,
          needsConfirmation: true,
        };

        const mockResult = {
          success: false,
          needsConfirmation: true,
          message: 'Please confirm: Food expense of Rp 50,000 for today?',
        };

        mockTransactionAIService.parseTransactionFromText.mockResolvedValue(mockTransactionDetails);
        mockTransactionService.createTransactionFromParsed.mockResolvedValue(mockResult);

        const response = await processor.generateResponse(
          mockIntent,
          mockUserContext,
          'I spent 50000 on food today'
        );

        expect(response).toBe('Please confirm: Food expense of Rp 50,000 for today?');
      });

      it('should handle transaction parsing errors', async () => {
        mockTransactionAIService.parseTransactionFromText.mockRejectedValue(
          new Error('Failed to parse transaction')
        );

        const response = await processor.generateResponse(
          mockIntent,
          mockUserContext,
          'I spent money'
        );

        expect(response).toContain('Sorry, I had trouble processing your transaction');
      });
    });

    describe('VIEW_TRANSACTIONS intent', () => {
      it('should handle recent transactions request', async () => {
        const mockQuery = {
          type: 'recent' as const,
          parameters: { limit: 10 },
        };

        const mockResult = {
          success: true,
          message: '📝 Recent Transactions (5)\n\n1. Food - Rp 50,000 (Today)',
          transactions: [],
        };

        mockTransactionMCPService.parseTransactionQuery.mockResolvedValue(mockQuery);
        mockTransactionMCPService.getRecentTransactions.mockResolvedValue(mockResult);

        const response = await processor.generateResponse(
          { type: 'VIEW_TRANSACTIONS', confidence: 0.9 },
          mockUserContext,
          'show my recent transactions'
        );

        expect(response).toBe('📝 Recent Transactions (5)\n\n1. Food - Rp 50,000 (Today)');
        expect(mockTransactionMCPService.parseTransactionQuery).toHaveBeenCalledWith(
          'show my recent transactions'
        );
        expect(mockTransactionMCPService.getRecentTransactions).toHaveBeenCalledWith(
          mockUserContext,
          10
        );
      });

      it('should handle category-based transactions request', async () => {
        const mockQuery = {
          type: 'category' as const,
          parameters: { category: 'Food' },
        };

        const mockResult = {
          success: true,
          message: '🍽️ Food Transactions\n\n1. Lunch - Rp 25,000',
          transactions: [],
        };

        mockTransactionMCPService.parseTransactionQuery.mockResolvedValue(mockQuery);
        mockTransactionMCPService.getTransactionsByCategory.mockResolvedValue(mockResult);

        const response = await processor.generateResponse(
          { type: 'VIEW_TRANSACTIONS', confidence: 0.9 },
          mockUserContext,
          'show my food expenses'
        );

        expect(response).toBe('🍽️ Food Transactions\n\n1. Lunch - Rp 25,000');
        expect(mockTransactionMCPService.getTransactionsByCategory).toHaveBeenCalledWith(
          mockUserContext,
          'Food'
        );
      });
    });

    describe('DASHBOARD intent', () => {
      it('should handle dashboard request successfully', async () => {
        const mockDashboardResult = {
          success: true,
          message: '📊 Your Spending Dashboard\n\nToday: Rp 50,000\nYesterday: Rp 30,000',
          summary: {
            spent_today: 50000,
            spent_yesterday: 30000,
            spent_this_week: 200000,
            spent_last_week: 180000,
            spent_this_month: 800000,
            spent_last_month: 750000,
          },
        };

        mockDashboardAIService.getDashboardSummary.mockResolvedValue(mockDashboardResult);

        const response = await processor.generateResponse(
          { type: 'DASHBOARD', confidence: 0.9 },
          mockUserContext,
          'show my dashboard'
        );

        expect(response).toBe('📊 Your Spending Dashboard\n\nToday: Rp 50,000\nYesterday: Rp 30,000');
        expect(mockDashboardAIService.getDashboardSummary).toHaveBeenCalledWith(mockUserContext);
      });

      it('should handle dashboard service failure', async () => {
        const mockDashboardResult = {
          success: false,
          message: '❌ Unable to fetch dashboard data right now',
        };

        mockDashboardAIService.getDashboardSummary.mockResolvedValue(mockDashboardResult);

        const response = await processor.generateResponse(
          { type: 'DASHBOARD', confidence: 0.9 },
          mockUserContext,
          'show my dashboard'
        );

        expect(response).toBe('❌ Unable to fetch dashboard data right now');
      });
    });

    describe('INSIGHTS intent', () => {
      it('should handle insights request with sufficient data', async () => {
        const mockTransactionsResult = {
          success: true,
          transactions: [
            { id: '1', amount: 50000, category: 'Food', date: new Date().toISOString() },
            { id: '2', amount: 25000, category: 'Transportation', date: new Date().toISOString() },
            { id: '3', amount: 100000, category: 'Shopping', date: new Date().toISOString() },
            { id: '4', amount: 30000, category: 'Food', date: new Date().toISOString() },
            { id: '5', amount: 15000, category: 'Transportation', date: new Date().toISOString() },
          ],
          message: 'Transactions retrieved',
        };

        const mockDashboardResult = {
          success: true,
          summary: {
            spent_today: 50000,
            spent_yesterday: 30000,
            spent_this_week: 200000,
            spent_last_week: 180000,
            spent_this_month: 800000,
            spent_last_month: 750000,
          },
          message: 'Dashboard retrieved',
        };

        mockTransactionMCPService.getRecentTransactions.mockResolvedValue(mockTransactionsResult);
        mockDashboardAIService.getDashboardSummary.mockResolvedValue(mockDashboardResult);
        mockInsightsAIService.generatePersonalizedRecommendations.mockResolvedValue(
          '💡 Based on your spending patterns, consider reducing food expenses by 20%'
        );

        const response = await processor.generateResponse(
          { type: 'INSIGHTS', confidence: 0.9 },
          mockUserContext,
          'give me insights'
        );

        expect(response).toContain('Based on your spending patterns');
        expect(mockInsightsAIService.generatePersonalizedRecommendations).toHaveBeenCalledWith(
          mockTransactionsResult.transactions,
          mockDashboardResult.summary,
          mockUserContext
        );
      });

      it('should handle insufficient data for insights', async () => {
        const mockTransactionsResult = {
          success: true,
          transactions: [
            { id: '1', amount: 50000, category: 'Food', date: new Date().toISOString() },
          ],
          message: 'Transactions retrieved',
        };

        mockTransactionMCPService.getRecentTransactions.mockResolvedValue(mockTransactionsResult);

        const response = await processor.generateResponse(
          { type: 'INSIGHTS', confidence: 0.9 },
          mockUserContext,
          'give me insights'
        );

        expect(response).toContain('Insights Coming Soon!');
        expect(response).toContain('I need more transaction data');
      });
    });

    describe('SUBSCRIPTIONS intent', () => {
      it('should handle view subscriptions request', async () => {
        const mockSubscriptionsResult = {
          success: true,
          subscriptions: [
            {
              id: '1',
              provider_name: 'Netflix',
              amount: 169000,
              currency: 'IDR',
              frequency: 'monthly',
              payment_date: new Date().toISOString(),
            },
          ],
          message: 'Subscriptions retrieved',
        };

        mockSubscriptionService.getUserSubscriptions.mockResolvedValue(mockSubscriptionsResult);
        mockSubscriptionAIService.formatSubscriptionList.mockReturnValue(
          '🔄 Your Active Subscriptions (1)\n\n🎬 Netflix - Rp 169,000/month'
        );

        const response = await processor.generateResponse(
          { type: 'SUBSCRIPTIONS', confidence: 0.9 },
          mockUserContext,
          'show my subscriptions'
        );

        expect(response).toContain('Your Active Subscriptions');
        expect(response).toContain('Netflix');
        expect(mockSubscriptionService.getUserSubscriptions).toHaveBeenCalledWith(mockUserContext);
      });

      it('should handle add subscription request', async () => {
        const mockParsedSubscription = {
          provider_name: 'Spotify',
          amount: 55000,
          currency: 'IDR',
          frequency: 'monthly',
          confidence: 0.9,
        };

        const mockResult = {
          success: true,
          message: '✅ Spotify subscription added successfully!',
        };

        mockSubscriptionAIService.parseSubscriptionFromText.mockResolvedValue(mockParsedSubscription);
        mockSubscriptionService.createSubscriptionFromParsed.mockResolvedValue(mockResult);

        const response = await processor.generateResponse(
          { type: 'SUBSCRIPTIONS', confidence: 0.9 },
          mockUserContext,
          'add Spotify subscription 55000 monthly'
        );

        expect(response).toBe('✅ Spotify subscription added successfully!');
        expect(mockSubscriptionAIService.parseSubscriptionFromText).toHaveBeenCalledWith(
          'add Spotify subscription 55000 monthly',
          'IDR'
        );
      });
    });

    it('should handle unknown intent types', async () => {
      mockAIIntentService.generateResponse.mockResolvedValue('I can help you with that!');

      const response = await processor.generateResponse(
        { type: 'UNKNOWN', confidence: 0.5 },
        mockUserContext,
        'hello'
      );

      expect(response).toBe('I can help you with that!');
      expect(mockAIIntentService.generateResponse).toHaveBeenCalledWith(
        { type: 'UNKNOWN', confidence: 0.5 },
        mockUserContext,
        'hello',
        undefined
      );
    });

    it('should handle errors gracefully', async () => {
      mockTransactionAIService.parseTransactionFromText.mockRejectedValue(
        new Error('Unexpected error')
      );

      const response = await processor.generateResponse(
        mockIntent,
        mockUserContext,
        'I spent money'
      );

      expect(response).toBe('❌ Sorry, I encountered an error processing your request. Please try again.');
    });
  });

  describe('conversation context management', () => {
    it('should create new conversation context for new user', async () => {
      const mockProcessedMessage = {
        intent: { type: 'ADD_TRANSACTION', confidence: 0.9 },
        originalMessage: 'test',
        timestamp: new Date().toISOString(),
      };

      mockAIIntentService.processMessage.mockResolvedValue(mockProcessedMessage);

      await processor.processMessage(mockTelegramMessage, mockUserContext);

      // Verify context was created (internal state check)
      const summary = await processor.getConversationSummary('123456789');
      expect(summary.messageCount).toBe(1);
    });

    it('should clear conversation context', async () => {
      // First create some context
      const mockProcessedMessage = {
        intent: { type: 'ADD_TRANSACTION', confidence: 0.9 },
        originalMessage: 'test',
        timestamp: new Date().toISOString(),
      };

      mockAIIntentService.processMessage.mockResolvedValue(mockProcessedMessage);
      await processor.processMessage(mockTelegramMessage, mockUserContext);

      // Clear context
      await processor.clearConversationContext('123456789');

      // Verify context was cleared
      const summary = await processor.getConversationSummary('123456789');
      expect(summary.messageCount).toBe(0);
    });
  });
});