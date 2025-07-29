import { TransactionMCPService } from '../../transaction-mcp-service';
import { UserContext } from '@/types/auth';

// Mock the MCP client
const mockMCPClient = {
  callTool: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: jest.fn().mockImplementation(() => mockMCPClient),
}));

describe('MCP Integration Tests', () => {
  let service: TransactionMCPService;
  let mockUserContext: UserContext;

  beforeEach(() => {
    service = new TransactionMCPService();
    mockUserContext = {
      userId: 'user123',
      telegramId: '123456789',
      preferences: {
        currency: 'IDR',
        language: 'en',
        notifications: true,
      },
    };
    
    jest.clearAllMocks();
  });

  describe('getRecentTransactions integration', () => {
    it('should fetch recent transactions via MCP', async () => {
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

      mockMCPClient.callTool.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: mockTransactions,
              count: 2,
            }),
          },
        ],
      });

      const result = await service.getRecentTransactions(mockUserContext, 10);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_recent_transactions',
        arguments: {
          user_id: 'user123',
          limit: 10,
        },
      });

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions?.[0].id).toBe('tx1');
      expect(result.message).toContain('Recent Transactions (2)');
    });

    it('should handle MCP connection errors', async () => {
      mockMCPClient.callTool.mockRejectedValue(new Error('MCP connection failed'));

      const result = await service.getRecentTransactions(mockUserContext, 10);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unable to fetch transactions');
    });

    it('should handle empty transaction results', async () => {
      mockMCPClient.callTool.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: [],
              count: 0,
            }),
          },
        ],
      });

      const result = await service.getRecentTransactions(mockUserContext, 10);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(0);
      expect(result.message).toContain('No Transactions Found');
    });
  });

  describe('getTransactionsByCategory integration', () => {
    it('should fetch transactions by category via MCP', async () => {
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
          amount: 30000,
          category: 'Food',
          date: '2024-01-14T19:00:00Z',
          note: 'Dinner',
        },
      ];

      mockMCPClient.callTool.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: mockTransactions,
              count: 2,
              total_amount: 80000,
            }),
          },
        ],
      });

      const result = await service.getTransactionsByCategory(mockUserContext, 'Food');

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_transactions_by_category',
        arguments: {
          user_id: 'user123',
          category: 'Food',
        },
      });

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.message).toContain('🍽️ Food Transactions');
      expect(result.message).toContain('Total: Rp 80,000');
    });
  });

  describe('getTransactionsByDateRange integration', () => {
    it('should fetch transactions by date range via MCP', async () => {
      const mockTransactions = [
        {
          id: 'tx1',
          user_id: 'user123',
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'Lunch',
        },
      ];

      mockMCPClient.callTool.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: mockTransactions,
              count: 1,
              date_range: {
                start: '2024-01-15',
                end: '2024-01-15',
              },
            }),
          },
        ],
      });

      const result = await service.getTransactionsByDateRange(
        mockUserContext,
        '2024-01-15',
        '2024-01-15'
      );

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'get_transactions_by_date_range',
        arguments: {
          user_id: 'user123',
          start_date: '2024-01-15',
          end_date: '2024-01-15',
        },
      });

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.message).toContain('📅 Transactions for Jan 15, 2024');
    });

    it('should handle invalid date ranges', async () => {
      mockMCPClient.callTool.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid date range',
            }),
          },
        ],
      });

      const result = await service.getTransactionsByDateRange(
        mockUserContext,
        '2024-01-20',
        '2024-01-15' // End before start
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid date range');
    });
  });

  describe('searchTransactions integration', () => {
    it('should search transactions via MCP', async () => {
      const mockTransactions = [
        {
          id: 'tx1',
          user_id: 'user123',
          amount: 50000,
          category: 'Food',
          date: '2024-01-15T10:30:00Z',
          note: 'McDonald lunch',
        },
      ];

      mockMCPClient.callTool.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: mockTransactions,
              count: 1,
              search_term: 'McDonald',
            }),
          },
        ],
      });

      const result = await service.searchTransactions(mockUserContext, 'McDonald', 20);

      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'search_transactions',
        arguments: {
          user_id: 'user123',
          search_term: 'McDonald',
          limit: 20,
        },
      });

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.message).toContain('🔍 Search Results for \"McDonald\"');
    });

    it('should handle no search results', async () => {
      mockMCPClient.callTool.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: [],
              count: 0,
              search_term: 'nonexistent',
            }),
          },
        ],
      });

      const result = await service.searchTransactions(mockUserContext, 'nonexistent', 20);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(0);
      expect(result.message).toContain('No transactions found for \"nonexistent\"');
    });
  });

  describe('parseTransactionQuery integration', () => {
    it('should parse recent transaction queries', async () => {
      const result = await service.parseTransactionQuery('show my recent transactions');

      expect(result.type).toBe('recent');
      expect(result.parameters.limit).toBe(10);
    });

    it('should parse category queries', async () => {
      const result = await service.parseTransactionQuery('show my food expenses');

      expect(result.type).toBe('category');
      expect(result.parameters.category).toBe('Food');
    });

    it('should parse date range queries', async () => {
      const result = await service.parseTransactionQuery('transactions from last week');

      expect(result.type).toBe('dateRange');
      expect(result.parameters.startDate).toBeDefined();
      expect(result.parameters.endDate).toBeDefined();
    });

    it('should parse search queries', async () => {
      const result = await service.parseTransactionQuery('find transactions with McDonald');

      expect(result.type).toBe('search');
      expect(result.parameters.searchTerm).toBe('McDonald');
    });

    it('should default to recent for unclear queries', async () => {
      const result = await service.parseTransactionQuery('show me stuff');

      expect(result.type).toBe('recent');
      expect(result.parameters.limit).toBe(10);
    });
  });

  describe('MCP connection management', () => {
    it('should handle MCP connection lifecycle', async () => {
      // Test connection establishment
      mockMCPClient.connect.mockResolvedValue(undefined);
      
      // Test successful operation
      mockMCPClient.callTool.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, data: [], count: 0 }),
          },
        ],
      });

      const result = await service.getRecentTransactions(mockUserContext, 5);

      expect(result.success).toBe(true);
    });

    it('should handle MCP disconnection gracefully', async () => {
      mockMCPClient.callTool.mockRejectedValue(new Error('Connection closed'));

      const result = await service.getRecentTransactions(mockUserContext, 5);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unable to fetch transactions');
    });
  });
});