import { Transaction } from './transaction-ai-service';
import { TransactionAIService } from './transaction-ai-service';
import { UserContext } from '@/types/auth';
import { Logger } from '@/utils/logger';

// MCP Tool interfaces (these would be provided by the MCP server)
interface MCPTransactionFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

interface MCPTransactionResponse {
  data: Transaction[];
  total: number;
  hasMore: boolean;
}

// Mock MCP client for demonstration
class MockMCPClient {
  private logger = new Logger('MockMCPClient');

  async getUserTransactions(userId: string, filters?: MCPTransactionFilters): Promise<MCPTransactionResponse> {
    this.logger.info(`MCP: Fetching transactions for user ${userId}`, filters);
    
    // Simulate MCP call delay
    await this.sleep(300);
    
    // Mock transaction data (in real implementation, this comes from Supabase via MCP)
    const mockTransactions: Transaction[] = [
      {
        id: 'tx_001',
        amount: 50000,
        category: 'Food',
        note: 'Lunch at Warung Padang',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        user_id: userId,
      },
      {
        id: 'tx_002',
        amount: 25000,
        category: 'Transportation',
        note: 'Grab ride to office',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        user_id: userId,
      },
      {
        id: 'tx_003',
        amount: 150000,
        category: 'Shopping',
        note: 'New shirt',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        user_id: userId,
      },
      {
        id: 'tx_004',
        amount: 75000,
        category: 'Entertainment',
        note: 'Movie tickets',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        user_id: userId,
      },
      {
        id: 'tx_005',
        amount: 35000,
        category: 'Food',
        note: 'Coffee and snacks',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        user_id: userId,
      },
    ];

    // Apply filters
    let filteredTransactions = mockTransactions;
    
    if (filters?.category) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.date) >= fromDate
      );
    }
    
    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredTransactions = filteredTransactions.filter(t => 
        new Date(t.date) <= toDate
      );
    }
    
    if (filters?.minAmount) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.amount >= filters.minAmount!
      );
    }
    
    if (filters?.maxAmount) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.amount <= filters.maxAmount!
      );
    }
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTransactions = filteredTransactions.filter(t => 
        t.note?.toLowerCase().includes(searchTerm) ||
        t.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
    
    this.logger.info(`MCP: Returning ${paginatedTransactions.length} transactions`);
    
    return {
      data: paginatedTransactions,
      total: filteredTransactions.length,
      hasMore: offset + limit < filteredTransactions.length,
    };
  }

  async getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]> {
    this.logger.info(`MCP: Fetching ${category} transactions for user ${userId}`);
    
    const response = await this.getUserTransactions(userId, { category, limit: 50 });
    return response.data;
  }

  async getTransactionsByDateRange(userId: string, startDate: string, endDate: string): Promise<Transaction[]> {
    this.logger.info(`MCP: Fetching transactions from ${startDate} to ${endDate} for user ${userId}`);
    
    const response = await this.getUserTransactions(userId, { 
      dateFrom: startDate, 
      dateTo: endDate,
      limit: 100 
    });
    return response.data;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class TransactionMCPService {
  private mcpClient: MockMCPClient;
  private transactionAIService: TransactionAIService;
  private logger = new Logger('TransactionMCPService');

  constructor() {
    this.mcpClient = new MockMCPClient();
    this.transactionAIService = new TransactionAIService();
    this.logger.info('Transaction MCP Service initialized');
  }

  /**
   * Get recent transactions for a user
   */
  public async getRecentTransactions(
    userContext: UserContext,
    limit: number = 10
  ): Promise<{
    success: boolean;
    transactions?: Transaction[];
    message: string;
  }> {
    try {
      this.logger.info(`Fetching recent transactions for user ${userContext.userId}`);

      const response = await this.mcpClient.getUserTransactions(userContext.userId, { 
        limit,
        offset: 0 
      });

      if (response.data.length === 0) {
        return {
          success: true,
          transactions: [],
          message: '📝 **No Transactions Found**\n\n' +
                  'You haven\'t recorded any transactions yet.\n\n' +
                  '💡 **Get started by saying:**\n' +
                  '• "I spent 50000 on food today"\n' +
                  '• "Add 25000 transportation expense"\n\n' +
                  'I\'ll help you track your spending! 💰',
        };
      }

      const formattedList = this.transactionAIService.formatTransactionList(
        response.data, 
        userContext.preferences.currency
      );

      const message = `${formattedList}\n\n` +
                     `📊 **Summary:**\n` +
                     `• Showing ${response.data.length} of ${response.total} transactions\n` +
                     `• Total amount: ${this.formatCurrency(
                       response.data.reduce((sum, t) => sum + t.amount, 0),
                       userContext.preferences.currency
                     )}\n\n` +
                     `💡 Try: "Show food transactions" or "Transactions from last week"`;

      return {
        success: true,
        transactions: response.data,
        message,
      };

    } catch (error) {
      this.logger.error('Error fetching recent transactions:', error);
      return {
        success: false,
        message: '❌ Sorry, I couldn\'t fetch your transactions right now. Please try again later.',
      };
    }
  }

  /**
   * Get transactions by category
   */
  public async getTransactionsByCategory(
    userContext: UserContext,
    category: string
  ): Promise<{
    success: boolean;
    transactions?: Transaction[];
    message: string;
  }> {
    try {
      this.logger.info(`Fetching ${category} transactions for user ${userContext.userId}`);

      const transactions = await this.mcpClient.getTransactionsByCategory(userContext.userId, category);

      if (transactions.length === 0) {
        return {
          success: true,
          transactions: [],
          message: `📝 **No ${category} Transactions Found**\n\n` +
                  `You haven't recorded any ${category.toLowerCase()} expenses yet.\n\n` +
                  `💡 **Add one by saying:**\n` +
                  `"I spent [amount] on ${category.toLowerCase()}"`,
        };
      }

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const formattedList = this.transactionAIService.formatTransactionList(
        transactions, 
        userContext.preferences.currency
      );

      const message = `🏷️ **${category} Transactions**\n\n` +
                     `${formattedList}\n\n` +
                     `📊 **${category} Summary:**\n` +
                     `• Total transactions: ${transactions.length}\n` +
                     `• Total spent: ${this.formatCurrency(totalAmount, userContext.preferences.currency)}\n` +
                     `• Average per transaction: ${this.formatCurrency(totalAmount / transactions.length, userContext.preferences.currency)}`;

      return {
        success: true,
        transactions,
        message,
      };

    } catch (error) {
      this.logger.error('Error fetching transactions by category:', error);
      return {
        success: false,
        message: `❌ Sorry, I couldn't fetch your ${category} transactions right now. Please try again later.`,
      };
    }
  }

  /**
   * Get transactions by date range
   */
  public async getTransactionsByDateRange(
    userContext: UserContext,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    transactions?: Transaction[];
    message: string;
  }> {
    try {
      this.logger.info(`Fetching transactions from ${startDate} to ${endDate} for user ${userContext.userId}`);

      const transactions = await this.mcpClient.getTransactionsByDateRange(
        userContext.userId, 
        startDate, 
        endDate
      );

      if (transactions.length === 0) {
        const start = new Date(startDate).toLocaleDateString();
        const end = new Date(endDate).toLocaleDateString();
        
        return {
          success: true,
          transactions: [],
          message: `📅 **No Transactions Found**\n\n` +
                  `No transactions found between ${start} and ${end}.\n\n` +
                  `💡 **Try a different date range or add some transactions!**`,
        };
      }

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const formattedList = this.transactionAIService.formatTransactionList(
        transactions, 
        userContext.preferences.currency
      );

      const start = new Date(startDate).toLocaleDateString();
      const end = new Date(endDate).toLocaleDateString();

      const message = `📅 **Transactions: ${start} - ${end}**\n\n` +
                     `${formattedList}\n\n` +
                     `📊 **Period Summary:**\n` +
                     `• Total transactions: ${transactions.length}\n` +
                     `• Total spent: ${this.formatCurrency(totalAmount, userContext.preferences.currency)}\n` +
                     `• Daily average: ${this.formatCurrency(
                       totalAmount / Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))),
                       userContext.preferences.currency
                     )}`;

      return {
        success: true,
        transactions,
        message,
      };

    } catch (error) {
      this.logger.error('Error fetching transactions by date range:', error);
      return {
        success: false,
        message: '❌ Sorry, I couldn\'t fetch your transactions for that date range. Please try again later.',
      };
    }
  }

  /**
   * Search transactions by text
   */
  public async searchTransactions(
    userContext: UserContext,
    searchTerm: string,
    limit: number = 20
  ): Promise<{
    success: boolean;
    transactions?: Transaction[];
    message: string;
  }> {
    try {
      this.logger.info(`Searching transactions for "${searchTerm}" for user ${userContext.userId}`);

      const response = await this.mcpClient.getUserTransactions(userContext.userId, { 
        search: searchTerm,
        limit 
      });

      if (response.data.length === 0) {
        return {
          success: true,
          transactions: [],
          message: `🔍 **No Results Found**\n\n` +
                  `No transactions found matching "${searchTerm}".\n\n` +
                  `💡 **Try searching for:**\n` +
                  `• Category names (food, transport, etc.)\n` +
                  `• Notes or descriptions\n` +
                  `• Place names or brands`,
        };
      }

      const formattedList = this.transactionAIService.formatTransactionList(
        response.data, 
        userContext.preferences.currency
      );

      const totalAmount = response.data.reduce((sum, t) => sum + t.amount, 0);

      const message = `🔍 **Search Results: "${searchTerm}"**\n\n` +
                     `${formattedList}\n\n` +
                     `📊 **Search Summary:**\n` +
                     `• Found ${response.data.length} transactions\n` +
                     `• Total amount: ${this.formatCurrency(totalAmount, userContext.preferences.currency)}`;

      return {
        success: true,
        transactions: response.data,
        message,
      };

    } catch (error) {
      this.logger.error('Error searching transactions:', error);
      return {
        success: false,
        message: '❌ Sorry, I couldn\'t search your transactions right now. Please try again later.',
      };
    }
  }

  /**
   * Parse natural language query for transaction retrieval
   */
  public async parseTransactionQuery(query: string): Promise<{
    type: 'recent' | 'category' | 'dateRange' | 'search';
    parameters: any;
  }> {
    const lowerQuery = query.toLowerCase();

    // Check for category queries
    const categories = ['food', 'transportation', 'entertainment', 'shopping', 'housing', 'utilities', 'health'];
    for (const category of categories) {
      if (lowerQuery.includes(category)) {
        return {
          type: 'category',
          parameters: { category: category.charAt(0).toUpperCase() + category.slice(1) },
        };
      }
    }

    // Check for date range queries
    if (lowerQuery.includes('last week') || lowerQuery.includes('past week')) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        type: 'dateRange',
        parameters: { 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        },
      };
    }

    if (lowerQuery.includes('last month') || lowerQuery.includes('past month')) {
      const endDate = new Date();
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());
      return {
        type: 'dateRange',
        parameters: { 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        },
      };
    }

    if (lowerQuery.includes('today')) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      return {
        type: 'dateRange',
        parameters: { 
          startDate: startOfDay.toISOString(), 
          endDate: endOfDay.toISOString() 
        },
      };
    }

    // Check for recent queries
    if (lowerQuery.includes('recent') || lowerQuery.includes('latest') || lowerQuery.includes('last')) {
      return {
        type: 'recent',
        parameters: { limit: 10 },
      };
    }

    // Default to search
    return {
      type: 'search',
      parameters: { searchTerm: query },
    };
  }

  /**
   * Format currency based on user preferences
   */
  private formatCurrency(amount: number, currency: string = 'IDR'): string {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }
}