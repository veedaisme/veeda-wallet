import { TransactionService } from '../../transaction-service';
import { SubscriptionService } from '../../subscription-service';
import { UserContext } from '@/types/auth';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('API Client Integration Tests', () => {
  let transactionService: TransactionService;
  let subscriptionService: SubscriptionService;
  let mockUserContext: UserContext;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    transactionService = new TransactionService();
    subscriptionService = new SubscriptionService();
    mockUserContext = {
      userId: 'user123',
      telegramId: '123456789',
      preferences: {
        currency: 'IDR',
        language: 'en',
        notifications: true,
      },
    };
    
    mockFetch.mockClear();
  });

  describe('Transaction API Integration', () => {
    describe('createTransactionFromParsed', () => {
      it('should create transaction via API successfully', async () => {
        const mockTransaction = {
          id: 'tx123',
          user_id: 'user123',
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Lunch at restaurant',
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockTransaction,
          }),
        } as Response);

        const parsedTransaction = {
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Lunch at restaurant',
          confidence: 0.9,
          needsConfirmation: false,
        };

        const result = await transactionService.createTransactionFromParsed(
          parsedTransaction,
          mockUserContext
        );

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/transactions'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              user_id: 'user123',
              amount: 50000,
              category: 'Food',
              date: '2024-01-15T10:30:00Z',
              note: 'Lunch at restaurant',
            }),
          })
        );

        expect(result.success).toBe(true);
        expect(result.message).toContain('Transaction added successfully');
        expect(result.transaction).toEqual(mockTransaction);
      });

      it('should handle API validation errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error: 'Validation failed',
            details: ['Amount must be positive', 'Category is required'],
          }),
        } as Response);

        const parsedTransaction = {
          amount: -100,
          category: null,
          date: '2024-01-15T10:30:00Z',
          note: 'Invalid transaction',
          confidence: 0.9,
          needsConfirmation: false,
        };

        const result = await transactionService.createTransactionFromParsed(
          parsedTransaction,
          mockUserContext
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('Validation failed');
      });

      it('should handle API server errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            error: 'Internal server error',
          }),
        } as Response);

        const parsedTransaction = {
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Test transaction',
          confidence: 0.9,
          needsConfirmation: false,
        };

        const result = await transactionService.createTransactionFromParsed(
          parsedTransaction,
          mockUserContext
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('server error');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network connection failed'));

        const parsedTransaction = {
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Test transaction',
          confidence: 0.9,
          needsConfirmation: false,
        };

        const result = await transactionService.createTransactionFromParsed(
          parsedTransaction,
          mockUserContext
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('network issue');
      });
    });

    describe('processTransactionConfirmation', () => {
      it('should handle confirmation and create transaction', async () => {
        const mockTransaction = {
          id: 'tx123',
          user_id: 'user123',
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Confirmed lunch',
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockTransaction,
          }),
        } as Response);

        const pendingTransaction = {
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Lunch',
          confidence: 0.7,
          needsConfirmation: true,
        };

        const result = await transactionService.processTransactionConfirmation(
          pendingTransaction,
          'yes',
          mockUserContext
        );

        expect(result.success).toBe(true);
        expect(result.message).toContain('Transaction confirmed');
      });

      it('should handle confirmation rejection', async () => {
        const pendingTransaction = {
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Lunch',
          confidence: 0.7,
          needsConfirmation: true,
        };

        const result = await transactionService.processTransactionConfirmation(
          pendingTransaction,
          'no',
          mockUserContext
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('Transaction cancelled');
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('Subscription API Integration', () => {
    describe('createSubscriptionFromParsed', () => {
      it('should create subscription via API successfully', async () => {
        const mockSubscription = {
          id: 'sub123',
          user_id: 'user123',
          provider_name: 'Netflix',
          amount: 169000,
          currency: 'IDR',
          frequency: 'monthly',
          payment_date: '2024-02-01T00:00:00Z',
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockSubscription,
          }),
        } as Response);

        const parsedSubscription = {
          provider_name: 'Netflix',
          amount: 169000,
          currency: 'IDR',
          frequency: 'monthly' as const,
          payment_date: '2024-02-01T00:00:00Z',
          confidence: 0.9,
          needsConfirmation: false,
        };

        const result = await subscriptionService.createSubscriptionFromParsed(
          parsedSubscription,
          mockUserContext
        );

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/subscriptions'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              user_id: 'user123',
              provider_name: 'Netflix',
              amount: 169000,
              currency: 'IDR',
              frequency: 'monthly',
              payment_date: '2024-02-01T00:00:00Z',
            }),
          })
        );

        expect(result.success).toBe(true);
        expect(result.message).toContain('Subscription added successfully');
      });

      it('should handle duplicate subscription errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 409,
          json: async () => ({
            success: false,
            error: 'Subscription already exists',
          }),
        } as Response);

        const parsedSubscription = {
          provider_name: 'Netflix',
          amount: 169000,
          currency: 'IDR',
          frequency: 'monthly' as const,
          payment_date: '2024-02-01T00:00:00Z',
          confidence: 0.9,
          needsConfirmation: false,
        };

        const result = await subscriptionService.createSubscriptionFromParsed(
          parsedSubscription,
          mockUserContext
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('already exists');
      });
    });

    describe('getUserSubscriptions', () => {
      it('should fetch user subscriptions via API', async () => {
        const mockSubscriptions = [
          {
            id: 'sub1',
            provider_name: 'Netflix',
            amount: 169000,
            currency: 'IDR',
            frequency: 'monthly',
            payment_date: '2024-02-01T00:00:00Z',
          },
          {
            id: 'sub2',
            provider_name: 'Spotify',
            amount: 55000,
            currency: 'IDR',
            frequency: 'monthly',
            payment_date: '2024-02-05T00:00:00Z',
          },
        ];

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockSubscriptions,
          }),
        } as Response);

        const result = await subscriptionService.getUserSubscriptions(mockUserContext);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/subscriptions?user_id=user123'),
          expect.objectContaining({
            method: 'GET',
          })
        );

        expect(result.success).toBe(true);
        expect(result.subscriptions).toHaveLength(2);
        expect(result.subscriptions?.[0].provider_name).toBe('Netflix');
      });

      it('should handle empty subscription list', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        } as Response);

        const result = await subscriptionService.getUserSubscriptions(mockUserContext);

        expect(result.success).toBe(true);
        expect(result.subscriptions).toHaveLength(0);
        expect(result.message).toContain('No Active Subscriptions');
      });
    });

    describe('getSubscriptionSummary', () => {
      it('should fetch subscription summary via API', async () => {
        const mockSummary = {
          subscription_count: 2,
          total_monthly_recurring: 224000,
          upcoming_this_month: 224000,
        };

        const mockSubscriptions = [
          {
            id: 'sub1',
            provider_name: 'Netflix',
            amount: 169000,
            currency: 'IDR',
            frequency: 'monthly',
            payment_date: '2024-02-01T00:00:00Z',
          },
        ];

        // Mock both API calls
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: mockSubscriptions }),
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: mockSummary }),
          } as Response);

        const result = await subscriptionService.getSubscriptionSummary(mockUserContext);

        expect(result.success).toBe(true);
        expect(result.summary).toEqual(mockSummary);
        expect(result.subscriptions).toEqual(mockSubscriptions);
      });
    });
  });

  describe('API Authentication', () => {
    it('should include authentication headers in requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      const parsedTransaction = {
        amount: 50000,
        category: 'Food',
        date: '2024-01-15T10:30:00Z',
        note: 'Test',
        confidence: 0.9,
        needsConfirmation: false,
      };

      await transactionService.createTransactionFromParsed(parsedTransaction, mockUserContext);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Unauthorized',
        }),
      } as Response);

      const parsedTransaction = {
        amount: 50000,
        category: 'Food',
        date: '2024-01-15T10:30:00Z',
        note: 'Test',
        confidence: 0.9,
        needsConfirmation: false,
      };

      const result = await transactionService.createTransactionFromParsed(
        parsedTransaction,
        mockUserContext
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('authentication');
    });
  });

  describe('API Rate Limiting', () => {
    it('should handle rate limit responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: 'Rate limit exceeded',
          retry_after: 60,
        }),
      } as Response);

      const parsedTransaction = {
        amount: 50000,
        category: 'Food',
        date: '2024-01-15T10:30:00Z',
        note: 'Test',
        confidence: 0.9,
        needsConfirmation: false,
      };

      const result = await transactionService.createTransactionFromParsed(
        parsedTransaction,
        mockUserContext
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('rate limit');
    });
  });
});