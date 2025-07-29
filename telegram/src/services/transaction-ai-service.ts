import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';

// Import transaction types from web models (we'll create local copies)
export interface Transaction {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  date: string;
  user_id: string;
}

export interface TransactionCreateData {
  amount: number;
  category: string;
  note?: string;
  date: string;
}

export interface ParsedTransaction {
  amount: number;
  category: string;
  note?: string;
  date: string;
  confidence: number;
  needsConfirmation: boolean;
  validationErrors?: string[];
}

// Zod schema for AI transaction parsing
const ParsedTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  note: z.string().optional(),
  date: z.string().optional(),
  confidence: z.number().min(0).max(1),
  needsConfirmation: z.boolean(),
  extractedCurrency: z.string().optional(),
  ambiguities: z.array(z.string()).optional(),
});

// Common transaction categories
const TRANSACTION_CATEGORIES = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Housing',
  'Utilities',
  'Health',
  'Education',
  'Travel',
  'Insurance',
  'Investment',
  'Other'
];

export class TransactionAIService {
  private logger = new Logger('TransactionAI');
  private model = openai(config.ai.model);

  constructor() {
    this.logger.info('Transaction AI Service initialized');
  }

  /**
   * Parse transaction details from natural language text
   */
  public async parseTransactionFromText(text: string, userCurrency: string = 'IDR'): Promise<ParsedTransaction> {
    try {
      this.logger.debug(`Parsing transaction from text: ${text}`);

      const result = await generateObject({
        model: this.model,
        schema: ParsedTransactionSchema,
        prompt: this.buildTransactionParsingPrompt(text, userCurrency),
        temperature: 0.1, // Low temperature for consistent parsing
      });

      const parsed = result.object;

      // Validate and enhance the parsed result
      const validatedTransaction = await this.validateAndEnhanceParsedTransaction(parsed, text, userCurrency);

      this.logger.debug(`Parsed transaction - Amount: ${validatedTransaction.amount}, Category: ${validatedTransaction.category}, Confidence: ${validatedTransaction.confidence}`);

      return validatedTransaction;

    } catch (error) {
      this.logger.error('Error parsing transaction with AI:', error);
      return this.fallbackTransactionParsing(text);
    }
  }

  /**
   * Format a list of transactions for Telegram display
   */
  public formatTransactionList(transactions: Transaction[], currency: string = 'IDR'): string {
    if (transactions.length === 0) {
      return '📝 No transactions found.';
    }

    let formatted = `📝 **Recent Transactions** (${transactions.length})\n\n`;

    transactions.forEach((transaction, index) => {
      const date = new Date(transaction.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      const amount = this.formatCurrency(transaction.amount, currency);
      const category = this.getCategoryEmoji(transaction.category) + ' ' + transaction.category;
      const note = transaction.note ? ` - ${transaction.note}` : '';

      formatted += `${index + 1}. **${amount}** ${category}\n`;
      formatted += `   📅 ${date}${note}\n\n`;
    });

    return formatted.trim();
  }

  /**
   * Generate transaction insights from a list of transactions
   */
  public async generateTransactionInsights(transactions: Transaction[]): Promise<string> {
    try {
      if (transactions.length === 0) {
        return '💡 No transactions available for insights. Start adding some expenses to get personalized advice!';
      }

      // Prepare transaction summary for AI analysis
      const summary = this.prepareTransactionSummary(transactions);
      
      const prompt = `Analyze these transaction patterns and provide helpful financial insights:

${summary}

Provide insights about:
1. Spending patterns and trends
2. Top spending categories
3. Potential areas for optimization
4. Actionable recommendations

Keep the response conversational, helpful, and under 300 words. Use emojis appropriately.`;

      const result = await this.model.generateText({
        prompt,
        temperature: 0.7,
        maxTokens: 400,
      });

      return result.text;

    } catch (error) {
      this.logger.error('Error generating transaction insights:', error);
      return this.generateBasicInsights(transactions);
    }
  }

  /**
   * Validate transaction data before creation
   */
  public validateTransactionData(data: Partial<TransactionCreateData>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validate amount
    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be a positive number');
      suggestions.push('Try: "I spent 50000 on food"');
    } else if (data.amount > 100000000) { // 100 million IDR
      suggestions.push('That\'s a large amount! Double-check if it\'s correct.');
    }

    // Validate category
    if (!data.category) {
      errors.push('Category is required');
      suggestions.push('Common categories: Food, Transportation, Entertainment, Shopping');
    } else if (!TRANSACTION_CATEGORIES.includes(data.category)) {
      suggestions.push(`Did you mean one of these categories? ${TRANSACTION_CATEGORIES.slice(0, 4).join(', ')}`);
    }

    // Validate date
    if (!data.date) {
      errors.push('Date is required');
      suggestions.push('If not specified, I\'ll use today\'s date');
    } else {
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        errors.push('Invalid date format');
        suggestions.push('Try: "today", "yesterday", or "2024-01-15"');
      } else if (parsedDate > new Date()) {
        suggestions.push('Future date detected. Is this correct?');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  /**
   * Build the AI prompt for transaction parsing
   */
  private buildTransactionParsingPrompt(text: string, userCurrency: string): string {
    return `Parse transaction details from this natural language text: "${text}"

User's currency: ${userCurrency}
Available categories: ${TRANSACTION_CATEGORIES.join(', ')}

Guidelines for parsing:
1. **Amount**: Look for numbers representing money
   - For IDR: typically large numbers (25000, 50000, 150000)
   - Accept "k" suffix (25k = 25000)
   - Accept decimal points for other currencies
   
2. **Category**: Map to one of the available categories
   - "food", "makan", "lunch", "dinner" → Food
   - "transport", "grab", "taxi", "bus" → Transportation
   - "movie", "cinema", "game" → Entertainment
   - "shop", "buy", "purchase" → Shopping
   - "rent", "house" → Housing
   - "electric", "water", "internet" → Utilities
   - "doctor", "medicine", "vitamin" → Health
   
3. **Date**: Extract or infer date
   - "today" → current date
   - "yesterday" → previous day
   - "last week" → 7 days ago
   - Specific dates in various formats
   
4. **Note**: Descriptive text about the transaction
   - Extract context clues (restaurant names, locations, etc.)

5. **Confidence scoring**:
   - 0.9+: All details clear and unambiguous
   - 0.7-0.9: Most details clear, minor assumptions made
   - 0.5-0.7: Some details unclear or assumed
   - <0.5: Very ambiguous, needs clarification

6. **Confirmation needed**: Set to true if:
   - Confidence < 0.8
   - Critical details missing (amount or category)
   - Ambiguous amounts or categories

Examples:
- "I spent 50000 on food today" → amount: 50000, category: "Food", date: today, confidence: 0.95
- "25k for grab ride" → amount: 25000, category: "Transportation", note: "grab ride", confidence: 0.9
- "lunch 35000" → amount: 35000, category: "Food", note: "lunch", confidence: 0.85

Return the parsed details with confidence assessment.`;
  }

  /**
   * Validate and enhance parsed transaction
   */
  private async validateAndEnhanceParsedTransaction(
    parsed: any, 
    originalText: string, 
    userCurrency: string
  ): Promise<ParsedTransaction> {
    const validationErrors: string[] = [];
    
    // Enhance date parsing
    let enhancedDate = parsed.date;
    if (!enhancedDate || enhancedDate.toLowerCase().includes('today')) {
      enhancedDate = new Date().toISOString();
    } else if (enhancedDate.toLowerCase().includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      enhancedDate = yesterday.toISOString();
    } else if (enhancedDate.toLowerCase().includes('last week')) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      enhancedDate = lastWeek.toISOString();
    }

    // Enhance category mapping
    let enhancedCategory = parsed.category;
    if (enhancedCategory && !TRANSACTION_CATEGORIES.includes(enhancedCategory)) {
      enhancedCategory = this.mapToStandardCategory(enhancedCategory);
    }

    // Calculate final confidence
    let finalConfidence = parsed.confidence || 0.5;
    
    if (!parsed.amount) finalConfidence *= 0.5;
    if (!enhancedCategory) finalConfidence *= 0.7;
    if (!enhancedDate) finalConfidence *= 0.9;

    return {
      amount: parsed.amount || 0,
      category: enhancedCategory || 'Other',
      note: parsed.note || originalText.substring(0, 100),
      date: enhancedDate || new Date().toISOString(),
      confidence: Math.min(finalConfidence, 1),
      needsConfirmation: finalConfidence < 0.8 || !parsed.amount || !enhancedCategory,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    };
  }

  /**
   * Map category variations to standard categories
   */
  private mapToStandardCategory(category: string): string {
    const lowerCategory = category.toLowerCase();
    
    const categoryMappings: Record<string, string> = {
      'makan': 'Food',
      'makanan': 'Food',
      'lunch': 'Food',
      'dinner': 'Food',
      'breakfast': 'Food',
      'snack': 'Food',
      'transport': 'Transportation',
      'transportasi': 'Transportation',
      'grab': 'Transportation',
      'taxi': 'Transportation',
      'bus': 'Transportation',
      'movie': 'Entertainment',
      'cinema': 'Entertainment',
      'game': 'Entertainment',
      'hiburan': 'Entertainment',
      'shop': 'Shopping',
      'shopping': 'Shopping',
      'belanja': 'Shopping',
      'buy': 'Shopping',
      'rent': 'Housing',
      'house': 'Housing',
      'rumah': 'Housing',
      'electric': 'Utilities',
      'electricity': 'Utilities',
      'listrik': 'Utilities',
      'water': 'Utilities',
      'air': 'Utilities',
      'internet': 'Utilities',
      'doctor': 'Health',
      'medicine': 'Health',
      'vitamin': 'Health',
      'kesehatan': 'Health',
    };

    return categoryMappings[lowerCategory] || 'Other';
  }

  /**
   * Fallback transaction parsing when AI fails
   */
  private fallbackTransactionParsing(text: string): ParsedTransaction {
    const lowerText = text.toLowerCase();
    
    // Simple regex patterns for fallback
    const amountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0;
    
    let category = 'Other';
    if (lowerText.includes('food') || lowerText.includes('makan') || lowerText.includes('lunch')) {
      category = 'Food';
    } else if (lowerText.includes('transport') || lowerText.includes('grab') || lowerText.includes('taxi')) {
      category = 'Transportation';
    } else if (lowerText.includes('shop') || lowerText.includes('buy')) {
      category = 'Shopping';
    }

    return {
      amount,
      category,
      note: text.substring(0, 100),
      date: new Date().toISOString(),
      confidence: 0.4, // Low confidence for fallback
      needsConfirmation: true,
    };
  }

  /**
   * Prepare transaction summary for AI analysis
   */
  private prepareTransactionSummary(transactions: Transaction[]): string {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return `Transaction Summary:
- Total transactions: ${transactions.length}
- Total amount: ${totalAmount.toLocaleString()}
- Date range: ${new Date(transactions[transactions.length - 1].date).toDateString()} to ${new Date(transactions[0].date).toDateString()}
- Top categories: ${topCategories.map(([cat, amt]) => `${cat}: ${amt.toLocaleString()}`).join(', ')}`;
  }

  /**
   * Generate basic insights when AI fails
   */
  private generateBasicInsights(transactions: Transaction[]): string {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / transactions.length;
    
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    return `💡 **Basic Insights**\n\n` +
           `📊 **Summary:**\n` +
           `• Total spent: ${this.formatCurrency(totalAmount)}\n` +
           `• Average per transaction: ${this.formatCurrency(avgAmount)}\n` +
           `• Number of transactions: ${transactions.length}\n\n` +
           `🏆 **Top category:** ${topCategory[0]} (${this.formatCurrency(topCategory[1])})\n\n` +
           `💡 **Tip:** Track your expenses regularly to identify spending patterns!`;
  }

  /**
   * Format currency based on type
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