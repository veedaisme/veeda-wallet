import { AIMessageProcessorImpl } from '@/services/ai-message-processor';
import { TelegramAuthServiceImpl } from '@/services/auth-service';
import { ResponseDeliveryService } from '@/services/response-delivery-service';
import { TelegramPollingService } from '@/services/telegram-polling';
import { TelegramMessage } from '@/types/telegram';
import { UserContext } from '@/types/auth';

// Mock all external dependencies
jest.mock('@/services/telegram-polling');
jest.mock('@/services/auth-service');
jest.mock('@/utils/service-resilience');
jest.mock('@ai-sdk/openai');
jest.mock('ai');

// Mock fetch for API calls
global.fetch = jest.fn();

describe('End-to-End User Journey Tests', () => {
  let aiProcessor: AIMessageProcessorImpl;
  let authService: TelegramAuthServiceImpl;
  let responseService: ResponseDeliveryService;
  let telegramService: TelegramPollingService;
  
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  
  const mockUserContext: UserContext = {
    userId: 'user123',
    telegramId: '123456789',
    preferences: {
      currency: 'IDR',
      language: 'en',
      notifications: true,
    },
  };

  const createMockMessage = (text: string, userId: number = 123456789): TelegramMessage => ({
    message_id: Math.floor(Math.random() * 1000),
    from: {
      id: userId,
      is_bot: false,
      first_name: 'TestUser',
      username: 'testuser',
    },
    chat: {
      id: userId,
      type: 'private',
    },
    date: Math.floor(Date.now() / 1000),
    text,
  });

  beforeEach(() => {
    telegramService = new TelegramPollingService();
    authService = new TelegramAuthServiceImpl();
    responseService = new ResponseDeliveryService(telegramService);
    aiProcessor = new AIMessageProcessorImpl();
    
    jest.clearAllMocks();
    
    // Mock successful API responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    } as Response);
  });

  describe('Complete Authentication and Account Linking Journey', () => {
    it('should handle complete account linking flow', async () => {
      const userId = 123456789;
      
      // Step 1: User starts without authentication
      const startMessage = createMockMessage('/start', userId);
      
      // Mock auth service to return unauthenticated initially
      (authService.getUserByTelegramId as jest.Mock).mockResolvedValue(null);
      
      const processedStart = await aiProcessor.processMessage(startMessage);
      expect(processedStart.intent.type).toBe('GREETING');
      
      // Step 2: User tries to use protected feature
      const transactionMessage = createMockMessage('I spent 50000 on food', userId);
      
      const processedTransaction = await aiProcessor.processMessage(transactionMessage, undefined);
      const responseWithoutAuth = await aiProcessor.generateResponse(
        processedTransaction.intent,
        { ...mockUserContext, userId: 'unauthenticated' },
        'I spent 50000 on food'
      );
      
      expect(responseWithoutAuth).toContain('link your account');
      
      // Step 3: User initiates account linking
      const linkMessage = createMockMessage('link account', userId);
      
      // Mock auth service to generate linking token
      (authService.generateLinkingToken as jest.Mock).mockResolvedValue({
        success: true,
        token: 'link123',
        expires_at: new Date(Date.now() + 300000).toISOString(),
      });
      
      const processedLink = await aiProcessor.processMessage(linkMessage);
      const linkResponse = await aiProcessor.generateResponse(
        processedLink.intent,
        { ...mockUserContext, userId: 'unauthenticated' },
        'link account'
      );
      
      expect(linkResponse).toContain('link123');
      expect(linkResponse).toContain('expires in 5 minutes');
      
      // Step 4: User completes linking (simulated web flow)
      // Mock successful account linking
      (authService.getUserByTelegramId as jest.Mock).mockResolvedValue({
        id: 'user123',
        telegram_id: '123456789',
        user_id: 'user123',
        linked_at: new Date().toISOString(),
        preferences: mockUserContext.preferences,
      });
      
      // Step 5: User tries transaction again after linking
      const retryTransactionMessage = createMockMessage('I spent 50000 on food', userId);
      
      const processedRetry = await aiProcessor.processMessage(retryTransactionMessage, mockUserContext);
      const authenticatedResponse = await aiProcessor.generateResponse(
        processedRetry.intent,
        mockUserContext,
        'I spent 50000 on food'
      );
      
      expect(authenticatedResponse).toContain('Transaction added successfully');
      expect(authenticatedResponse).not.toContain('link your account');
    });

    it('should handle account linking timeout', async () => {
      const userId = 123456789;
      
      // Generate expired token
      (authService.generateLinkingToken as jest.Mock).mockResolvedValue({
        success: true,
        token: 'expired123',
        expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
      });
      
      const linkMessage = createMockMessage('link account', userId);
      const processedLink = await aiProcessor.processMessage(linkMessage);
      const linkResponse = await aiProcessor.generateResponse(
        processedLink.intent,
        { ...mockUserContext, userId: 'unauthenticated' },
        'link account'
      );
      
      expect(linkResponse).toContain('expired');
    });
  });

  describe('Complete Transaction Management Journey', () => {
    it('should handle complete transaction creation flow', async () => {
      const userId = 123456789;
      
      // Step 1: User adds a clear transaction
      const clearTransactionMessage = createMockMessage('I spent 50000 on lunch today', userId);
      
      // Mock successful transaction creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'tx123',
            user_id: 'user123',
            amount: 50000,
            category: 'Food',
            date: new Date().toISOString(),
            note: 'lunch',
          },
        }),
      } as Response);
      
      const processed = await aiProcessor.processMessage(clearTransactionMessage, mockUserContext);
      const response = await aiProcessor.generateResponse(
        processed.intent,
        mockUserContext,
        'I spent 50000 on lunch today'
      );
      
      expect(response).toContain('Transaction added successfully');
      expect(response).toContain('50,000');
      expect(response).toContain('Food');
      
      // Step 2: User adds an ambiguous transaction requiring confirmation
      const ambiguousMessage = createMockMessage('I spent money on stuff', userId);
      
      const processedAmbiguous = await aiProcessor.processMessage(ambiguousMessage, mockUserContext);
      const ambiguousResponse = await aiProcessor.generateResponse(
        processedAmbiguous.intent,
        mockUserContext,
        'I spent money on stuff'
      );
      
      expect(ambiguousResponse).toContain('need more information');
      
      // Step 3: User provides clarification
      const clarificationMessage = createMockMessage('25000 for transportation', userId);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'tx124',
            user_id: 'user123',
            amount: 25000,
            category: 'Transportation',
            date: new Date().toISOString(),
            note: 'transportation',
          },
        }),
      } as Response);
      
      const processedClarification = await aiProcessor.processMessage(clarificationMessage, mockUserContext);
      const clarificationResponse = await aiProcessor.generateResponse(
        processedClarification.intent,
        mockUserContext,
        '25000 for transportation'
      );
      
      expect(clarificationResponse).toContain('Transaction added successfully');
      expect(clarificationResponse).toContain('25,000');
      expect(clarificationResponse).toContain('Transportation');
    });

    it('should handle transaction viewing and filtering journey', async () => {
      const userId = 123456789;
      
      // Mock MCP service responses
      const mockTransactions = [
        {
          id: 'tx1',
          user_id: 'user123',
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Lunch',
        },
        {
          id: 'tx2',
          user_id: 'user123',
          amount: 25000,
          category: 'Transportation',
          date: '2024-01-14T08:15:00Z',
          note: 'Bus fare',
        },
      ];
      
      // Step 1: User views recent transactions
      const viewMessage = createMockMessage('show my recent transactions', userId);
      
      const processedView = await aiProcessor.processMessage(viewMessage, mockUserContext);
      const viewResponse = await aiProcessor.generateResponse(
        processedView.intent,
        mockUserContext,
        'show my recent transactions'
      );
      
      expect(viewResponse).toContain('Recent Transactions');
      expect(viewResponse).toContain('Food');
      expect(viewResponse).toContain('Transportation');
      
      // Step 2: User filters by category
      const filterMessage = createMockMessage('show my food expenses', userId);
      
      const processedFilter = await aiProcessor.processMessage(filterMessage, mockUserContext);
      const filterResponse = await aiProcessor.generateResponse(
        processedFilter.intent,
        mockUserContext,
        'show my food expenses'
      );
      
      expect(filterResponse).toContain('Food Transactions');
      expect(filterResponse).toContain('50,000');
      
      // Step 3: User searches for specific transactions
      const searchMessage = createMockMessage('find transactions with lunch', userId);
      
      const processedSearch = await aiProcessor.processMessage(searchMessage, mockUserContext);
      const searchResponse = await aiProcessor.generateResponse(
        processedSearch.intent,
        mockUserContext,
        'find transactions with lunch'
      );
      
      expect(searchResponse).toContain('Search Results');
      expect(searchResponse).toContain('lunch');
    });
  });

  describe('Complete Dashboard and Insights Journey', () => {
    it('should handle dashboard viewing and insights generation', async () => {
      const userId = 123456789;
      
      // Mock dashboard data
      const mockDashboardSummary = {
        spent_today: 50000,
        spent_yesterday: 30000,
        spent_this_week: 200000,
        spent_last_week: 180000,
        spent_this_month: 800000,
        spent_last_month: 750000,
      };
      
      // Step 1: User requests dashboard
      const dashboardMessage = createMockMessage('show my spending dashboard', userId);
      
      const processedDashboard = await aiProcessor.processMessage(dashboardMessage, mockUserContext);
      const dashboardResponse = await aiProcessor.generateResponse(
        processedDashboard.intent,
        mockUserContext,
        'show my spending dashboard'
      );
      
      expect(dashboardResponse).toContain('Spending Dashboard');
      expect(dashboardResponse).toContain('Today vs Yesterday');
      expect(dashboardResponse).toContain('50,000');
      expect(dashboardResponse).toContain('30,000');
      
      // Step 2: User requests insights
      const insightsMessage = createMockMessage('give me spending insights', userId);
      
      const processedInsights = await aiProcessor.processMessage(insightsMessage, mockUserContext);
      const insightsResponse = await aiProcessor.generateResponse(
        processedInsights.intent,
        mockUserContext,
        'give me spending insights'
      );
      
      expect(insightsResponse).toContain('insights');
      
      // Step 3: User requests comprehensive analysis
      const analysisMessage = createMockMessage('comprehensive spending analysis', userId);
      
      const processedAnalysis = await aiProcessor.processMessage(analysisMessage, mockUserContext);
      const analysisResponse = await aiProcessor.generateResponse(
        processedAnalysis.intent,
        mockUserContext,
        'comprehensive spending analysis'
      );
      
      expect(analysisResponse).toContain('analysis');
    });
  });

  describe('Complete Subscription Management Journey', () => {
    it('should handle subscription creation and management flow', async () => {
      const userId = 123456789;
      
      // Step 1: User adds a subscription
      const addSubMessage = createMockMessage('add Netflix subscription 169000 monthly', userId);
      
      // Mock successful subscription creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'sub123',
            user_id: 'user123',
            provider_name: 'Netflix',
            amount: 169000,
            currency: 'IDR',
            frequency: 'monthly',
            payment_date: '2024-02-01T00:00:00Z',
          },
        }),
      } as Response);
      
      const processedAdd = await aiProcessor.processMessage(addSubMessage, mockUserContext);
      const addResponse = await aiProcessor.generateResponse(
        processedAdd.intent,
        mockUserContext,
        'add Netflix subscription 169000 monthly'
      );
      
      expect(addResponse).toContain('Subscription added successfully');
      expect(addResponse).toContain('Netflix');
      expect(addResponse).toContain('169,000');
      
      // Step 2: User views subscriptions
      const viewSubMessage = createMockMessage('show my subscriptions', userId);
      
      // Mock subscription list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'sub123',
              provider_name: 'Netflix',
              amount: 169000,
              currency: 'IDR',
              frequency: 'monthly',
              payment_date: '2024-02-01T00:00:00Z',
            },
          ],
        }),
      } as Response);
      
      const processedView = await aiProcessor.processMessage(viewSubMessage, mockUserContext);
      const viewResponse = await aiProcessor.generateResponse(
        processedView.intent,
        mockUserContext,
        'show my subscriptions'
      );
      
      expect(viewResponse).toContain('Active Subscriptions');
      expect(viewResponse).toContain('Netflix');
      
      // Step 3: User requests subscription summary
      const summaryMessage = createMockMessage('subscription summary', userId);
      
      // Mock summary data
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              subscription_count: 1,
              total_monthly_recurring: 169000,
              upcoming_this_month: 169000,
            },
          }),
        } as Response);
      
      const processedSummary = await aiProcessor.processMessage(summaryMessage, mockUserContext);
      const summaryResponse = await aiProcessor.generateResponse(
        processedSummary.intent,
        mockUserContext,
        'subscription summary'
      );
      
      expect(summaryResponse).toContain('Summary');
      expect(summaryResponse).toContain('169,000');
    });
  });

  describe('Error Handling and Recovery Journey', () => {
    it('should handle service failures gracefully', async () => {
      const userId = 123456789;
      
      // Step 1: API service is down
      mockFetch.mockRejectedValue(new Error('Service unavailable'));
      
      const transactionMessage = createMockMessage('I spent 50000 on food', userId);
      
      const processed = await aiProcessor.processMessage(transactionMessage, mockUserContext);
      const response = await aiProcessor.generateResponse(
        processed.intent,
        mockUserContext,
        'I spent 50000 on food'
      );
      
      expect(response).toContain('trouble');
      expect(response).toContain('try again');
      
      // Step 2: Service recovers
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'tx123',
            user_id: 'user123',
            amount: 50000,
            category: 'Food',
            date: new Date().toISOString(),
            note: 'food',
          },
        }),
      } as Response);
      
      const retryMessage = createMockMessage('I spent 50000 on food', userId);
      
      const processedRetry = await aiProcessor.processMessage(retryMessage, mockUserContext);
      const retryResponse = await aiProcessor.generateResponse(
        processedRetry.intent,
        mockUserContext,
        'I spent 50000 on food'
      );
      
      expect(retryResponse).toContain('Transaction added successfully');
    });

    it('should handle rate limiting gracefully', async () => {
      const userId = 123456789;
      
      // Mock rate limit response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: 'Rate limit exceeded',
          retry_after: 60,
        }),
      } as Response);
      
      const transactionMessage = createMockMessage('I spent 50000 on food', userId);
      
      const processed = await aiProcessor.processMessage(transactionMessage, mockUserContext);
      const response = await aiProcessor.generateResponse(
        processed.intent,
        mockUserContext,
        'I spent 50000 on food'
      );
      
      expect(response).toContain('rate limit');
      expect(response).toContain('wait');
    });
  });

  describe('Multi-turn Conversation Journey', () => {
    it('should handle complex multi-turn conversation', async () => {
      const userId = 123456789;
      
      // Turn 1: User starts transaction
      const turn1 = createMockMessage('I spent money today', userId);
      const processed1 = await aiProcessor.processMessage(turn1, mockUserContext);
      const response1 = await aiProcessor.generateResponse(
        processed1.intent,
        mockUserContext,
        'I spent money today'
      );
      
      expect(response1).toContain('more information');
      
      // Turn 2: User provides amount
      const turn2 = createMockMessage('50000', userId);
      const processed2 = await aiProcessor.processMessage(turn2, mockUserContext);
      const response2 = await aiProcessor.generateResponse(
        processed2.intent,
        mockUserContext,
        '50000'
      );
      
      expect(response2).toContain('category');
      
      // Turn 3: User provides category
      const turn3 = createMockMessage('food', userId);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'tx123',
            user_id: 'user123',
            amount: 50000,
            category: 'Food',
            date: new Date().toISOString(),
            note: 'food expense',
          },
        }),
      } as Response);
      
      const processed3 = await aiProcessor.processMessage(turn3, mockUserContext);
      const response3 = await aiProcessor.generateResponse(
        processed3.intent,
        mockUserContext,
        'food'
      );
      
      expect(response3).toContain('Transaction added successfully');
      
      // Turn 4: User asks for confirmation
      const turn4 = createMockMessage('show me what I just added', userId);
      const processed4 = await aiProcessor.processMessage(turn4, mockUserContext);
      const response4 = await aiProcessor.generateResponse(
        processed4.intent,
        mockUserContext,
        'show me what I just added'
      );
      
      expect(response4).toContain('Recent Transactions');
    });
  });

  describe('Help and Onboarding Journey', () => {
    it('should guide new users through onboarding', async () => {
      const userId = 123456789;
      
      // Step 1: New user starts
      const startMessage = createMockMessage('/start', userId);
      
      (authService.getUserByTelegramId as jest.Mock).mockResolvedValue(null);
      
      const processedStart = await aiProcessor.processMessage(startMessage);
      const startResponse = await aiProcessor.generateResponse(
        processedStart.intent,
        { ...mockUserContext, userId: 'unauthenticated' },
        '/start'
      );
      
      expect(startResponse).toContain('Welcome');
      expect(startResponse).toContain('link account');
      
      // Step 2: User asks for help
      const helpMessage = createMockMessage('help', userId);
      
      const processedHelp = await aiProcessor.processMessage(helpMessage);
      const helpResponse = await aiProcessor.generateResponse(
        processedHelp.intent,
        { ...mockUserContext, userId: 'unauthenticated' },
        'help'
      );
      
      expect(helpResponse).toContain('Clair AI Assistant Help');
      expect(helpResponse).toContain('Getting Started');
      expect(helpResponse).toContain('link account');
      
      // Step 3: After authentication, help shows full features
      (authService.getUserByTelegramId as jest.Mock).mockResolvedValue({
        id: 'user123',
        telegram_id: '123456789',
        user_id: 'user123',
        linked_at: new Date().toISOString(),
        preferences: mockUserContext.preferences,
      });
      
      const authenticatedHelpMessage = createMockMessage('help', userId);
      
      const processedAuthHelp = await aiProcessor.processMessage(authenticatedHelpMessage, mockUserContext);
      const authHelpResponse = await aiProcessor.generateResponse(
        processedAuthHelp.intent,
        mockUserContext,
        'help'
      );
      
      expect(authHelpResponse).toContain('Transaction Management');
      expect(authHelpResponse).toContain('Dashboard & Insights');
      expect(authHelpResponse).toContain('Subscriptions');
    });
  });
});