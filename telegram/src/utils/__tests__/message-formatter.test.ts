import { MessageFormatter, MessageFormatterOptions } from '../message-formatter';
import { Transaction } from '@/services/transaction-ai-service';
import { Subscription, SubscriptionSummary } from '@/services/subscription-ai-service';
import { DashboardSummary } from '@/services/dashboard-ai-service';
import { UserContext } from '@/types/auth';

describe('MessageFormatter', () => {
  let formatter: MessageFormatter;

  beforeEach(() => {
    formatter = new MessageFormatter();
  });

  describe('formatTransaction', () => {
    const mockTransaction: Transaction = {
      id: 'tx123',
      amount: 50000,
      category: 'Food',
      date: '2024-01-15T10:30:00Z',
      note: 'Lunch at restaurant',
    };

    it('should format transaction with all details', () => {
      const result = formatter.formatTransaction(mockTransaction);

      expect(result).toContain('🍽️'); // Food emoji
      expect(result).toContain('**Food**');
      expect(result).toContain('Rp 50,000');
      expect(result).toContain('Lunch at restaurant');
      expect(result).toContain('tx123');
    });

    it('should format transaction in compact mode', () => {
      const result = formatter.formatTransaction(mockTransaction, { compactMode: true });

      expect(result).toContain('🍽️ Rp 50,000 - Food');
      expect(result).not.toContain('**Food**'); // No bold formatting in compact mode
    });

    it('should format transaction without emojis', () => {
      const result = formatter.formatTransaction(mockTransaction, { includeEmojis: false });

      expect(result).not.toContain('🍽️');
      expect(result).toContain('**Food**');
      expect(result).toContain('Rp 50,000');
    });

    it('should format transaction with different currency', () => {
      const result = formatter.formatTransaction(mockTransaction, { currency: 'USD' });

      expect(result).toContain('USD 50,000');
      expect(result).not.toContain('Rp');
    });

    it('should handle transaction without note', () => {
      const transactionWithoutNote = { ...mockTransaction, note: undefined };
      const result = formatter.formatTransaction(transactionWithoutNote);

      expect(result).not.toContain('📝');
      expect(result).toContain('🆔 tx123');
    });
  });

  describe('formatTransactionList', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'tx1',
        amount: 50000,
        category: 'Food',
        date: '2024-01-15T10:30:00Z',
        note: 'Lunch',
      },
      {
        id: 'tx2',
        amount: 25000,
        category: 'Transportation',
        date: '2024-01-14T08:15:00Z',
        note: 'Bus fare',
      },
    ];

    it('should format transaction list with summary', () => {
      const result = formatter.formatTransactionList(mockTransactions);

      expect(result).toContain('📝 **Recent Transactions** (2)');
      expect(result).toContain('1. 🍽️ Rp 50,000 - Food');
      expect(result).toContain('2. 🚗 Rp 25,000 - Transportation');
      expect(result).toContain('📊 **Summary:**');
      expect(result).toContain('• Showing 2 of 2 transactions');
      expect(result).toContain('• Total: Rp 75,000');
    });

    it('should handle empty transaction list', () => {
      const result = formatter.formatTransactionList([]);

      expect(result).toContain('📝 **No Transactions Found**');
      expect(result).toContain('You haven\'t recorded any transactions yet');
      expect(result).toContain('💡 **Get started by saying:**');
    });

    it('should truncate long transaction lists', () => {
      const manyTransactions = Array.from({ length: 50 }, (_, i) => ({
        id: `tx${i}`,
        amount: 10000,
        category: 'Food',
        date: '2024-01-15T10:30:00Z',
        note: `Transaction ${i}`,
      }));

      const result = formatter.formatTransactionList(manyTransactions, { maxLength: 1000 });

      expect(result).toContain('more transactions available');
      expect(result.length).toBeLessThan(1000);
    });
  });

  describe('formatDashboard', () => {
    const mockSummary: DashboardSummary = {
      spent_today: 50000,
      spent_yesterday: 30000,
      spent_this_week: 200000,
      spent_last_week: 180000,
      spent_this_month: 800000,
      spent_last_month: 750000,
    };

    it('should format dashboard with all sections', () => {
      const result = formatter.formatDashboard(mockSummary);

      expect(result).toContain('📊 **Your Spending Dashboard**');
      expect(result).toContain('**📅 Today vs Yesterday**');
      expect(result).toContain('**📈 This Week vs Last Week**');
      expect(result).toContain('**📆 This Month vs Last Month**');
      expect(result).toContain('• Today: Rp 50,000');
      expect(result).toContain('• Yesterday: Rp 30,000');
      expect(result).toContain('**💡 Quick Insights**');
    });

    it('should calculate percentage changes correctly', () => {
      const result = formatter.formatDashboard(mockSummary);

      // Today vs Yesterday: (50000 - 30000) / 30000 * 100 = 66.7%
      expect(result).toContain('📈 +66.7%');
      
      // Week vs Last Week: (200000 - 180000) / 180000 * 100 = 11.1%
      expect(result).toContain('📈 +11.1%');
      
      // Month vs Last Month: (800000 - 750000) / 750000 * 100 = 6.7%
      expect(result).toContain('📈 +6.7%');
    });

    it('should show insights for significant changes', () => {
      const summaryWithBigChange: DashboardSummary = {
        spent_today: 100000,
        spent_yesterday: 30000, // 233% increase
        spent_this_week: 200000,
        spent_last_week: 180000,
        spent_this_month: 800000,
        spent_last_month: 750000,
      };

      const result = formatter.formatDashboard(summaryWithBigChange);

      expect(result).toContain('📈 Daily spending increased significantly');
    });

    it('should format without emojis', () => {
      const result = formatter.formatDashboard(mockSummary, { includeEmojis: false });

      expect(result).not.toContain('📊');
      expect(result).not.toContain('📅');
      expect(result).not.toContain('📈');
      expect(result).toContain('**Your Spending Dashboard**');
    });
  });

  describe('formatSubscriptions', () => {
    const mockSubscriptions: Subscription[] = [
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

    const mockSummary: SubscriptionSummary = {
      subscription_count: 2,
      total_monthly_recurring: 224000,
      upcoming_this_month: 224000,
    };

    it('should format subscription list with summary', () => {
      const result = formatter.formatSubscriptions(mockSubscriptions, mockSummary);

      expect(result).toContain('🔄 **Your Active Subscriptions** (2)');
      expect(result).toContain('**Monthly Subscriptions:**');
      expect(result).toContain('🎬 **Netflix**');
      expect(result).toContain('🎵 **Spotify**');
      expect(result).toContain('📊 **Summary:**');
      expect(result).toContain('• 2 active subscriptions');
      expect(result).toContain('• Rp 224,000/month');
    });

    it('should handle empty subscription list', () => {
      const result = formatter.formatSubscriptions([]);

      expect(result).toContain('🔄 **No Active Subscriptions**');
      expect(result).toContain('You haven\'t added any subscriptions yet');
      expect(result).toContain('💡 **Add one by saying:**');
    });

    it('should group subscriptions by frequency', () => {
      const mixedSubscriptions: Subscription[] = [
        { ...mockSubscriptions[0], frequency: 'monthly' },
        { ...mockSubscriptions[1], frequency: 'annually' },
      ];

      const result = formatter.formatSubscriptions(mixedSubscriptions);

      expect(result).toContain('**Monthly Subscriptions:**');
      expect(result).toContain('**Annually Subscriptions:**');
    });
  });

  describe('formatError', () => {
    it('should format error with context', () => {
      const error = new Error('Network connection failed');
      const result = formatter.formatError(error, 'fetching transactions');

      expect(result).toContain('❌ **Something went wrong**');
      expect(result).toContain('**Context:** fetching transactions');
      expect(result).toContain('**Error:** Network connection failed');
      expect(result).toContain('**What you can try:**');
      expect(result).toContain('• Check your internet connection');
    });

    it('should format string error', () => {
      const result = formatter.formatError('Something went wrong');

      expect(result).toContain('❌ **Something went wrong**');
      expect(result).toContain('**Error:** Something went wrong');
    });

    it('should provide appropriate suggestions for different error types', () => {
      const authError = formatter.formatError('Authentication failed');
      expect(authError).toContain('• Check if your account is properly linked');

      const rateError = formatter.formatError('Rate limit exceeded');
      expect(rateError).toContain('• Wait a moment before trying again');

      const networkError = formatter.formatError('Network connection timeout');
      expect(networkError).toContain('• Check your internet connection');
    });

    it('should format without emojis', () => {
      const result = formatter.formatError('Error occurred', undefined, { includeEmojis: false });

      expect(result).not.toContain('❌');
      expect(result).toContain('**Something went wrong**');
    });
  });

  describe('formatErrorWithSuggestions', () => {
    it('should format error with custom suggestions', () => {
      const suggestions = ['Try again later', 'Contact support', 'Check your settings'];
      const result = formatter.formatErrorWithSuggestions(
        'Service unavailable',
        suggestions,
        'API call'
      );

      expect(result).toContain('**Context:** API call');
      expect(result).toContain('**Error:** Service unavailable');
      expect(result).toContain('**💡 Try this:**');
      expect(result).toContain('• Try again later');
      expect(result).toContain('• Contact support');
      expect(result).toContain('• Check your settings');
    });
  });

  describe('formatRetryNotification', () => {
    it('should format retry notification', () => {
      const result = formatter.formatRetryNotification('API call', 2, 3);

      expect(result).toBe('🔄 Retrying API call... (2/3)');
    });

    it('should format retry notification without emojis', () => {
      const result = formatter.formatRetryNotification('API call', 2, 3, { includeEmojis: false });

      expect(result).toBe('Retrying API call... (2/3)');
    });
  });

  describe('formatServiceUnavailable', () => {
    it('should format service unavailable message', () => {
      const result = formatter.formatServiceUnavailable('AI Service');

      expect(result).toContain('🚫 **Service Temporarily Unavailable**');
      expect(result).toContain('The AI Service service is currently experiencing issues');
      expect(result).toContain('Please try again in a few minutes');
    });
  });

  describe('formatFallbackResponse', () => {
    it('should format fallback response', () => {
      const result = formatter.formatFallbackResponse(
        'AI processing',
        'Here is basic information instead'
      );

      expect(result).toContain('⚠️ **Limited Functionality**');
      expect(result).toContain('Unable to complete AI processing normally');
      expect(result).toContain('Here is basic information instead');
    });
  });

  describe('splitLongMessage', () => {
    it('should not split short messages', () => {
      const shortMessage = 'This is a short message';
      const result = formatter.splitLongMessage(shortMessage);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(shortMessage);
    });

    it('should split long messages', () => {
      const longMessage = 'A'.repeat(5000); // Very long message
      const result = formatter.splitLongMessage(longMessage, 1000);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0]).toContain('📄 *Continued...*');
      expect(result[result.length - 1]).toContain('*...continued from previous message*');
    });

    it('should add continuation indicators', () => {
      const longMessage = 'Line 1\n' + 'A'.repeat(4000) + '\nLine 2';
      const result = formatter.splitLongMessage(longMessage, 2000);

      expect(result.length).toBeGreaterThan(1);
      expect(result[0]).toContain('📄 *Continued...*');
      expect(result[1]).toContain('📄 *...continued from previous message*');
    });
  });

  describe('formatHelpMessage', () => {
    const mockUserContext: UserContext = {
      userId: 'user123',
      telegramId: '123456789',
      preferences: {
        currency: 'IDR',
        language: 'en',
        notifications: true,
      },
    };

    it('should format help for authenticated user', () => {
      const result = formatter.formatHelpMessage(true, mockUserContext);

      expect(result).toContain('🤖 **Clair AI Assistant Help**');
      expect(result).toContain('**💸 Transaction Management:**');
      expect(result).toContain('**📊 Dashboard & Insights:**');
      expect(result).toContain('**🔄 Subscriptions:**');
      expect(result).toContain('**⚙️ Account Management:**');
      expect(result).toContain('**Your Settings:**');
      expect(result).toContain('• Language: en');
      expect(result).toContain('• Currency: IDR');
    });

    it('should format help for unauthenticated user', () => {
      const result = formatter.formatHelpMessage(false);

      expect(result).toContain('🤖 **Clair AI Assistant Help**');
      expect(result).toContain('**🔗 Getting Started:**');
      expect(result).toContain('• "link account" - Connect your Clair account');
      expect(result).toContain('**📚 What you can do after linking:**');
      expect(result).toContain('🚀 Ready to get started? Type "link account"!');
    });

    it('should format help without emojis', () => {
      const result = formatter.formatHelpMessage(true, mockUserContext, { includeEmojis: false });

      expect(result).not.toContain('🤖');
      expect(result).not.toContain('💸');
      expect(result).toContain('**Clair AI Assistant Help**');
    });
  });

  describe('private helper methods', () => {
    it('should get correct category emoji', () => {
      // Access private method through bracket notation for testing
      const getCategoryEmoji = (formatter as any).getCategoryEmoji.bind(formatter);

      expect(getCategoryEmoji('Food')).toBe('🍽️');
      expect(getCategoryEmoji('Transportation')).toBe('🚗');
      expect(getCategoryEmoji('Entertainment')).toBe('🎬');
      expect(getCategoryEmoji('Unknown')).toBe('📦');
    });

    it('should get correct provider emoji', () => {
      const getProviderEmoji = (formatter as any).getProviderEmoji.bind(formatter);

      expect(getProviderEmoji('Netflix')).toBe('🎬');
      expect(getProviderEmoji('Spotify')).toBe('🎵');
      expect(getProviderEmoji('YouTube')).toBe('📺');
      expect(getProviderEmoji('Unknown Service')).toBe('🔄');
    });

    it('should format currency correctly', () => {
      const formatCurrency = (formatter as any).formatCurrency.bind(formatter);

      expect(formatCurrency(50000, 'IDR')).toBe('Rp 50,000');
      expect(formatCurrency(100, 'USD')).toBe('USD 100');
    });

    it('should format date correctly', () => {
      const formatDate = (formatter as any).formatDate.bind(formatter);
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      expect(formatDate(today)).toBe('Today');
      expect(formatDate(yesterday)).toBe('Yesterday');
    });
  });
});