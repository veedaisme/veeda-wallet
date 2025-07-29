import { 
  Transaction, 
  TransactionCreateData, 
  ParsedTransaction 
} from './transaction-ai-service';
import { UserContext } from '@/types/auth';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';

// API Client interface (matching the web API client)
interface APIClient {
  setToken(token: string): void;
  clearToken(): void;
  createTransaction(data: TransactionCreateData): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<TransactionCreateData>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<{ message: string }>;
  getTransaction(id: string): Promise<Transaction>;
}

// Mock API client for now (will be replaced with actual implementation)
class MockAPIClient implements APIClient {
  private token: string | null = null;
  private logger = new Logger('MockAPIClient');

  setToken(token: string): void {
    this.token = token;
    this.logger.debug('Token set for API client');
  }

  clearToken(): void {
    this.token = null;
    this.logger.debug('Token cleared from API client');
  }

  async createTransaction(data: TransactionCreateData): Promise<Transaction> {
    this.logger.info('Creating transaction:', data);
    
    // Simulate API call delay
    await this.sleep(500);
    
    // Mock successful creation
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      amount: data.amount,
      category: data.category,
      note: data.note || null,
      date: data.date,
      user_id: 'mock_user_id',
    };
    
    this.logger.info('Transaction created successfully:', transaction.id);
    return transaction;
  }

  async updateTransaction(id: string, data: Partial<TransactionCreateData>): Promise<Transaction> {
    this.logger.info(`Updating transaction ${id}:`, data);
    
    await this.sleep(300);
    
    // Mock update
    const transaction: Transaction = {
      id,
      amount: data.amount || 0,
      category: data.category || 'Other',
      note: data.note || null,
      date: data.date || new Date().toISOString(),
      user_id: 'mock_user_id',
    };
    
    this.logger.info('Transaction updated successfully:', id);
    return transaction;
  }

  async deleteTransaction(id: string): Promise<{ message: string }> {
    this.logger.info(`Deleting transaction ${id}`);
    
    await this.sleep(200);
    
    this.logger.info('Transaction deleted successfully:', id);
    return { message: 'Transaction deleted successfully' };
  }

  async getTransaction(id: string): Promise<Transaction> {
    this.logger.info(`Fetching transaction ${id}`);
    
    await this.sleep(200);
    
    // Mock transaction
    const transaction: Transaction = {
      id,
      amount: 50000,
      category: 'Food',
      note: 'Mock transaction',
      date: new Date().toISOString(),
      user_id: 'mock_user_id',
    };
    
    return transaction;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class TransactionService {
  private apiClient: APIClient;
  private logger = new Logger('TransactionService');

  constructor() {
    // For now, use mock API client
    // In production, this would be the actual API client from web/lib/apiClient.ts
    this.apiClient = new MockAPIClient();
    this.logger.info('Transaction Service initialized with mock API client');
  }

  /**
   * Create a transaction from parsed AI data
   */
  public async createTransactionFromParsed(
    parsedTransaction: ParsedTransaction,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    transaction?: Transaction;
    message: string;
    needsConfirmation?: boolean;
  }> {
    try {
      // Set user token for API authentication
      this.apiClient.setToken(userContext.authToken);

      // Validate the parsed transaction
      if (parsedTransaction.needsConfirmation || parsedTransaction.confidence < 0.8) {
        return {
          success: false,
          message: this.generateConfirmationMessage(parsedTransaction, userContext),
          needsConfirmation: true,
        };
      }

      // Prepare transaction data
      const transactionData: TransactionCreateData = {
        amount: parsedTransaction.amount,
        category: parsedTransaction.category,
        note: parsedTransaction.note,
        date: parsedTransaction.date,
      };

      // Create transaction via API
      const transaction = await this.apiClient.createTransaction(transactionData);

      this.logger.info(`Transaction created successfully for user ${userContext.userId}: ${transaction.id}`);

      return {
        success: true,
        transaction,
        message: this.generateSuccessMessage(transaction, userContext),
      };

    } catch (error) {
      this.logger.error('Error creating transaction:', error);
      return {
        success: false,
        message: this.generateErrorMessage(error),
      };
    }
  }

  /**
   * Update an existing transaction
   */
  public async updateTransaction(
    transactionId: string,
    updates: Partial<TransactionCreateData>,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    transaction?: Transaction;
    message: string;
  }> {
    try {
      this.apiClient.setToken(userContext.authToken);

      const transaction = await this.apiClient.updateTransaction(transactionId, updates);

      this.logger.info(`Transaction updated successfully: ${transactionId}`);

      return {
        success: true,
        transaction,
        message: `✅ **Transaction Updated**\n\n` +
                `Updated your transaction successfully!\n\n` +
                `**New Details:**\n` +
                `• Amount: ${this.formatCurrency(transaction.amount, userContext.preferences.currency)}\n` +
                `• Category: ${transaction.category}\n` +
                `• Date: ${new Date(transaction.date).toLocaleDateString()}\n` +
                `• Note: ${transaction.note || 'None'}\n\n` +
                `Transaction ID: ${transaction.id}`,
      };

    } catch (error) {
      this.logger.error('Error updating transaction:', error);
      return {
        success: false,
        message: this.generateErrorMessage(error),
      };
    }
  }

  /**
   * Delete a transaction
   */
  public async deleteTransaction(
    transactionId: string,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.apiClient.setToken(userContext.authToken);

      await this.apiClient.deleteTransaction(transactionId);

      this.logger.info(`Transaction deleted successfully: ${transactionId}`);

      return {
        success: true,
        message: `🗑️ **Transaction Deleted**\n\n` +
                `Transaction ${transactionId} has been deleted successfully.\n\n` +
                `The transaction has been removed from your records.`,
      };

    } catch (error) {
      this.logger.error('Error deleting transaction:', error);
      return {
        success: false,
        message: this.generateErrorMessage(error),
      };
    }
  }

  /**
   * Get a specific transaction
   */
  public async getTransaction(
    transactionId: string,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    transaction?: Transaction;
    message: string;
  }> {
    try {
      this.apiClient.setToken(userContext.authToken);

      const transaction = await this.apiClient.getTransaction(transactionId);

      return {
        success: true,
        transaction,
        message: this.formatSingleTransaction(transaction, userContext),
      };

    } catch (error) {
      this.logger.error('Error fetching transaction:', error);
      return {
        success: false,
        message: this.generateErrorMessage(error),
      };
    }
  }

  /**
   * Process a transaction confirmation from user
   */
  public async processTransactionConfirmation(
    parsedTransaction: ParsedTransaction,
    userConfirmation: string,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    transaction?: Transaction;
    message: string;
    needsMoreInfo?: boolean;
  }> {
    const confirmation = userConfirmation.toLowerCase().trim();

    // Handle different confirmation responses
    if (confirmation.includes('yes') || confirmation.includes('confirm') || confirmation.includes('ok')) {
      // User confirmed - create the transaction
      return await this.createTransactionFromParsed(
        { ...parsedTransaction, needsConfirmation: false, confidence: 0.9 },
        userContext
      );
    }

    if (confirmation.includes('no') || confirmation.includes('cancel')) {
      return {
        success: false,
        message: `❌ **Transaction Cancelled**\n\n` +
                `No worries! The transaction was not saved.\n\n` +
                `Feel free to try again with different details.`,
      };
    }

    // Check if user is providing additional information
    if (confirmation.includes('amount') || /\d+/.test(confirmation)) {
      // User might be providing missing amount or corrections
      return {
        success: false,
        message: `🔄 **Processing Updates**\n\n` +
                `I see you're providing additional information. Let me re-process your transaction with these details.\n\n` +
                `Please provide the complete transaction details again.`,
        needsMoreInfo: true,
      };
    }

    // Unclear response
    return {
      success: false,
      message: `🤔 **Need Clarification**\n\n` +
              `I didn't understand your response. Please reply with:\n\n` +
              `• "Yes" or "Confirm" to save the transaction\n` +
              `• "No" or "Cancel" to cancel\n` +
              `• Or provide the missing/corrected information\n\n` +
              `**Current transaction:**\n` +
              `• Amount: ${parsedTransaction.amount ? this.formatCurrency(parsedTransaction.amount, userContext.preferences.currency) : 'Missing'}\n` +
              `• Category: ${parsedTransaction.category || 'Missing'}\n` +
              `• Date: ${parsedTransaction.date ? new Date(parsedTransaction.date).toLocaleDateString() : 'Today'}`,
    };
  }

  /**
   * Generate confirmation message for uncertain transactions
   */
  private generateConfirmationMessage(parsedTransaction: ParsedTransaction, userContext: UserContext): string {
    const currency = userContext.preferences.currency;
    
    let message = `💸 **Transaction Confirmation Needed**\n\n`;
    message += `I extracted these details from your message:\n\n`;
    
    if (parsedTransaction.amount) {
      message += `✅ **Amount:** ${this.formatCurrency(parsedTransaction.amount, currency)}\n`;
    } else {
      message += `❓ **Amount:** Not specified\n`;
    }
    
    if (parsedTransaction.category) {
      message += `✅ **Category:** ${parsedTransaction.category}\n`;
    } else {
      message += `❓ **Category:** Not specified\n`;
    }
    
    message += `📅 **Date:** ${parsedTransaction.date ? new Date(parsedTransaction.date).toLocaleDateString() : 'Today'}\n`;
    message += `📝 **Note:** ${parsedTransaction.note || 'None'}\n\n`;
    
    message += `**Confidence:** ${Math.round(parsedTransaction.confidence * 100)}%\n\n`;
    
    if (parsedTransaction.validationErrors && parsedTransaction.validationErrors.length > 0) {
      message += `⚠️ **Issues found:**\n`;
      parsedTransaction.validationErrors.forEach(error => {
        message += `• ${error}\n`;
      });
      message += `\n`;
    }
    
    message += `**Please confirm:**\n`;
    message += `• Reply "Yes" to save this transaction\n`;
    message += `• Reply "No" to cancel\n`;
    message += `• Or provide the missing/corrected information`;
    
    return message;
  }

  /**
   * Generate success message for created transaction
   */
  private generateSuccessMessage(transaction: Transaction, userContext: UserContext): string {
    const currency = userContext.preferences.currency;
    
    return `✅ **Transaction Saved Successfully!**\n\n` +
           `Your expense has been recorded:\n\n` +
           `💰 **Amount:** ${this.formatCurrency(transaction.amount, currency)}\n` +
           `📂 **Category:** ${transaction.category}\n` +
           `📅 **Date:** ${new Date(transaction.date).toLocaleDateString()}\n` +
           `📝 **Note:** ${transaction.note || 'None'}\n\n` +
           `**Transaction ID:** ${transaction.id}\n\n` +
           `🎉 Keep tracking your expenses to stay on top of your finances!`;
  }

  /**
   * Generate error message
   */
  private generateErrorMessage(error: any): string {
    const errorMessage = error?.message || 'Unknown error occurred';
    
    return `❌ **Transaction Failed**\n\n` +
           `Sorry, I couldn't save your transaction right now.\n\n` +
           `**Error:** ${errorMessage}\n\n` +
           `**What you can try:**\n` +
           `• Check your internet connection\n` +
           `• Try again in a few moments\n` +
           `• Make sure your account is properly linked\n\n` +
           `If the problem persists, please contact support.`;
  }

  /**
   * Format a single transaction for display
   */
  private formatSingleTransaction(transaction: Transaction, userContext: UserContext): string {
    const currency = userContext.preferences.currency;
    const date = new Date(transaction.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `📝 **Transaction Details**\n\n` +
           `💰 **Amount:** ${this.formatCurrency(transaction.amount, currency)}\n` +
           `📂 **Category:** ${this.getCategoryEmoji(transaction.category)} ${transaction.category}\n` +
           `📅 **Date:** ${date}\n` +
           `📝 **Note:** ${transaction.note || 'None'}\n\n` +
           `**Transaction ID:** ${transaction.id}`;
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

  /**
   * Get emoji for category
   */
  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'Food': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Housing': '🏠',
      'Utilities': '⚡',
      'Health': '🏥',
      'Education': '📚',
      'Travel': '✈️',
      'Insurance': '🛡️',
      'Investment': '📈',
      'Other': '📦',
    };
    
    return emojiMap[category] || '📦';
  }
}