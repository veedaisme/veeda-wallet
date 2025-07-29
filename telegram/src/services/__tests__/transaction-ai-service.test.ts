import { TransactionAIService } from '../transaction-ai-service';

interface ParsedTransaction {
  amount: number | null;
  category: string | null;
  date: string | null;
  note: string | null;
  confidence: number;
  needsConfirmation?: boolean;
}
import { generateText } from 'ai';

// Mock the AI SDK
jest.mock('ai');
jest.mock('@/config/ai-config');

describe('TransactionAIService', () => {
  let service: TransactionAIService;
  let mockGenerateText: jest.MockedFunction<typeof generateText>;

  beforeEach(() => {
    service = new TransactionAIService();
    mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
    jest.clearAllMocks();
  });

  describe('parseTransactionFromText', () => {
    it('should parse simple transaction text', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: 50000,
          category: 'Food',
          date: '2024-01-15',
          note: 'Lunch at restaurant',
          confidence: 0.9,
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.parseTransactionFromText('I spent 50000 on food today', 'IDR');

      expect(result).toEqual({
        amount: 50000,
        category: 'Food',
        date: '2024-01-15',
        note: 'Lunch at restaurant',
        confidence: 0.9,
      });

      expect(mockGenerateText).toHaveBeenCalledWith({
        model: expect.any(Object),
        prompt: expect.stringContaining('I spent 50000 on food today'),
        temperature: 0.1,
      });
    });

    it('should handle transaction with missing information', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: 25000,
          category: null,
          date: '2024-01-15',
          note: 'Transportation expense',
          confidence: 0.6,
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.parseTransactionFromText('I paid 25000 for transport', 'IDR');

      expect(result.amount).toBe(25000);
      expect(result.category).toBeNull();
      expect(result.confidence).toBe(0.6);
    });

    it('should handle different currencies', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: 100,
          category: 'Food',
          date: '2024-01-15',
          note: 'Coffee',
          confidence: 0.8,
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      await service.parseTransactionFromText('I bought coffee for $100', 'USD');

      expect(mockGenerateText).toHaveBeenCalledWith({
        model: expect.any(Object),
        prompt: expect.stringContaining('Currency: USD'),
        temperature: 0.1,
      });
    });

    it('should handle complex transaction descriptions', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: 150000,
          category: 'Shopping',
          date: '2024-01-14',
          note: 'Groceries at supermarket',
          confidence: 0.85,
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.parseTransactionFromText(
        'Yesterday I went shopping and bought groceries for 150000 at the supermarket',
        'IDR'
      );

      expect(result.amount).toBe(150000);
      expect(result.category).toBe('Shopping');
      expect(result.date).toBe('2024-01-14');
      expect(result.note).toBe('Groceries at supermarket');
    });

    it('should handle ambiguous transaction text', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: null,
          category: 'Food',
          date: '2024-01-15',
          note: 'Meal expense',
          confidence: 0.3,
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.parseTransactionFromText('I had a meal', 'IDR');

      expect(result.amount).toBeNull();
      expect(result.confidence).toBe(0.3);
    });

    it('should handle AI service errors', async () => {
      mockGenerateText.mockRejectedValue(new Error('AI service unavailable'));

      await expect(
        service.parseTransactionFromText('I spent money', 'IDR')
      ).rejects.toThrow('AI service unavailable');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        text: 'Invalid JSON response',
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      await expect(
        service.parseTransactionFromText('I spent 50000', 'IDR')
      ).rejects.toThrow();
    });

    it('should validate parsed transaction structure', async () => {
      const mockResponse = {
        text: JSON.stringify({
          // Missing required fields
          category: 'Food',
          note: 'Test',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.parseTransactionFromText('I spent money on food', 'IDR');

      // Should have default values for missing fields
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('date');
    });
  });

  describe('categorizeTransaction', () => {
    it('should categorize food-related transactions', async () => {
      const mockResponse = {
        text: JSON.stringify({
          category: 'Food',
          confidence: 0.9,
          reasoning: 'Transaction involves food purchase',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.categorizeTransaction('Lunch at McDonald\'s', 25000);

      expect(result.category).toBe('Food');
      expect(result.confidence).toBe(0.9);
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: expect.any(Object),
        prompt: expect.stringContaining('Lunch at McDonald\'s'),
        temperature: 0.1,
      });
    });

    it('should categorize transportation transactions', async () => {
      const mockResponse = {
        text: JSON.stringify({
          category: 'Transportation',
          confidence: 0.85,
          reasoning: 'Transaction involves transportation service',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.categorizeTransaction('Uber ride to office', 15000);

      expect(result.category).toBe('Transportation');
      expect(result.confidence).toBe(0.85);
    });

    it('should handle uncertain categorization', async () => {
      const mockResponse = {
        text: JSON.stringify({
          category: 'Other',
          confidence: 0.4,
          reasoning: 'Unable to determine specific category',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.categorizeTransaction('Payment', 100000);

      expect(result.category).toBe('Other');
      expect(result.confidence).toBe(0.4);
    });

    it('should include amount in categorization context', async () => {
      const mockResponse = {
        text: JSON.stringify({
          category: 'Entertainment',
          confidence: 0.8,
          reasoning: 'Movie ticket purchase',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      await service.categorizeTransaction('Movie ticket', 50000);

      expect(mockGenerateText).toHaveBeenCalledWith({
        model: expect.any(Object),
        prompt: expect.stringContaining('Amount: 50000'),
        temperature: 0.1,
      });
    });
  });

  describe('extractAmountFromText', () => {
    it('should extract simple amounts', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: 50000,
          confidence: 0.95,
          currency_detected: 'IDR',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.extractAmountFromText('I spent 50000 rupiah');

      expect(result.amount).toBe(50000);
      expect(result.confidence).toBe(0.95);
      expect(result.currency_detected).toBe('IDR');
    });

    it('should extract amounts with currency symbols', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: 25,
          confidence: 0.9,
          currency_detected: 'USD',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.extractAmountFromText('I paid $25 for lunch');

      expect(result.amount).toBe(25);
      expect(result.currency_detected).toBe('USD');
    });

    it('should handle written numbers', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: 15000,
          confidence: 0.8,
          currency_detected: 'IDR',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.extractAmountFromText('I spent fifteen thousand rupiah');

      expect(result.amount).toBe(15000);
      expect(result.confidence).toBe(0.8);
    });

    it('should handle multiple amounts', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: 75000,
          confidence: 0.7,
          currency_detected: 'IDR',
          note: 'Total of multiple amounts',
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.extractAmountFromText('I spent 25000 and 50000, total 75000');

      expect(result.amount).toBe(75000);
      expect(result.confidence).toBe(0.7);
    });

    it('should handle no amount found', async () => {
      const mockResponse = {
        text: JSON.stringify({
          amount: null,
          confidence: 0.1,
          currency_detected: null,
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await service.extractAmountFromText('I went shopping');

      expect(result.amount).toBeNull();
      expect(result.confidence).toBe(0.1);
    });
  });

  describe('validateTransactionData', () => {
    it('should validate complete transaction data', () => {
      const validTransaction: ParsedTransaction = {
        amount: 50000,
        category: 'Food',
        date: '2024-01-15',
        note: 'Lunch',
        confidence: 0.9,
      };

      const result = service.validateTransactionData(validTransaction);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing amount', () => {
      const invalidTransaction: ParsedTransaction = {
        amount: null,
        category: 'Food',
        date: '2024-01-15',
        note: 'Lunch',
        confidence: 0.9,
      };

      const result = service.validateTransactionData(invalidTransaction);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount is required');
    });

    it('should detect invalid amount', () => {
      const invalidTransaction: ParsedTransaction = {
        amount: -100,
        category: 'Food',
        date: '2024-01-15',
        note: 'Lunch',
        confidence: 0.9,
      };

      const result = service.validateTransactionData(invalidTransaction);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be positive');
    });

    it('should detect missing category', () => {
      const invalidTransaction: ParsedTransaction = {
        amount: 50000,
        category: null,
        date: '2024-01-15',
        note: 'Lunch',
        confidence: 0.9,
      };

      const result = service.validateTransactionData(invalidTransaction);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Category is required');
    });

    it('should detect invalid date format', () => {
      const invalidTransaction: ParsedTransaction = {
        amount: 50000,
        category: 'Food',
        date: 'invalid-date',
        note: 'Lunch',
        confidence: 0.9,
      };

      const result = service.validateTransactionData(invalidTransaction);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });

    it('should detect low confidence', () => {
      const lowConfidenceTransaction: ParsedTransaction = {
        amount: 50000,
        category: 'Food',
        date: '2024-01-15',
        note: 'Lunch',
        confidence: 0.2,
      };

      const result = service.validateTransactionData(lowConfidenceTransaction);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Confidence too low (minimum 0.3 required)');
    });

    it('should handle multiple validation errors', () => {
      const invalidTransaction: ParsedTransaction = {
        amount: null,
        category: null,
        date: 'invalid',
        note: 'Test',
        confidence: 0.1,
      };

      const result = service.validateTransactionData(invalidTransaction);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Amount is required');
      expect(result.errors).toContain('Category is required');
      expect(result.errors).toContain('Invalid date format');
      expect(result.errors).toContain('Confidence too low (minimum 0.3 required)');
    });
  });

  describe('formatTransactionForConfirmation', () => {
    it('should format complete transaction for confirmation', () => {
      const transaction: ParsedTransaction = {
        amount: 50000,
        category: 'Food',
        date: '2024-01-15',
        note: 'Lunch at restaurant',
        confidence: 0.9,
      };

      const result = service.formatTransactionForConfirmation(transaction, 'IDR');

      expect(result).toContain('💸 **Transaction Confirmation**');
      expect(result).toContain('💰 Amount: Rp 50,000');
      expect(result).toContain('🏷️ Category: Food');
      expect(result).toContain('📅 Date: Jan 15, 2024');
      expect(result).toContain('📝 Note: Lunch at restaurant');
      expect(result).toContain('🎯 Confidence: 90%');
    });

    it('should format transaction without note', () => {
      const transaction: ParsedTransaction = {
        amount: 25000,
        category: 'Transportation',
        date: '2024-01-15',
        note: null,
        confidence: 0.8,
      };

      const result = service.formatTransactionForConfirmation(transaction, 'IDR');

      expect(result).toContain('💰 Amount: Rp 25,000');
      expect(result).toContain('🏷️ Category: Transportation');
      expect(result).not.toContain('📝 Note:');
    });

    it('should format with different currency', () => {
      const transaction: ParsedTransaction = {
        amount: 100,
        category: 'Food',
        date: '2024-01-15',
        note: 'Coffee',
        confidence: 0.85,
      };

      const result = service.formatTransactionForConfirmation(transaction, 'USD');

      expect(result).toContain('💰 Amount: USD 100');
    });

    it('should show low confidence warning', () => {
      const transaction: ParsedTransaction = {
        amount: 50000,
        category: 'Other',
        date: '2024-01-15',
        note: 'Payment',
        confidence: 0.4,
      };

      const result = service.formatTransactionForConfirmation(transaction, 'IDR');

      expect(result).toContain('🎯 Confidence: 40%');
      expect(result).toContain('⚠️ **Low Confidence**');
      expect(result).toContain('Please verify the details above');
    });
  });
});