import { ErrorHandler, ErrorCategory, AppError } from '../error-handler';
import { 
  AuthenticationError, 
  ValidationError, 
  NetworkError, 
  TelegramError,
  AIError,
  RateLimitError 
} from '../custom-errors';
import { Logger } from '../logger';

// Mock the logger
jest.mock('../logger');

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockResponseService: any;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    mockResponseService = {
      sendResponse: jest.fn().mockResolvedValue(true),
    };
    errorHandler.setResponseService(mockResponseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeError', () => {
    it('should return AppError as-is', () => {
      const appError = new AppError({
        message: 'Test error',
        category: ErrorCategory.VALIDATION,
      });

      const result = errorHandler.normalizeError(appError);
      expect(result).toBe(appError);
    });

    it('should convert Error to AppError', () => {
      const error = new Error('Network connection failed');
      const result = errorHandler.normalizeError(error);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Network connection failed');
      expect(result.category).toBe(ErrorCategory.NETWORK);
    });

    it('should handle string errors', () => {
      const result = errorHandler.normalizeError('Something went wrong');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Something went wrong');
      expect(result.category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should handle non-Error objects', () => {
      const result = errorHandler.normalizeError({ code: 500 });

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown error occurred');
      expect(result.category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('error categorization', () => {
    it('should categorize authentication errors', () => {
      const error = new Error('Authentication failed');
      const result = errorHandler.normalizeError(error);
      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('should categorize authorization errors', () => {
      const error = new Error('Access denied - insufficient permissions');
      const result = errorHandler.normalizeError(error);
      expect(result.category).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should categorize validation errors', () => {
      const error = new Error('Invalid input - required field missing');
      const result = errorHandler.normalizeError(error);
      expect(result.category).toBe(ErrorCategory.VALIDATION);
    });

    it('should categorize network errors', () => {
      const error = new Error('Network connection timeout');
      const result = errorHandler.normalizeError(error);
      expect(result.category).toBe(ErrorCategory.NETWORK);
    });

    it('should categorize rate limit errors', () => {
      const error = new Error('Rate limit exceeded - too many requests');
      const result = errorHandler.normalizeError(error);
      expect(result.category).toBe(ErrorCategory.RATE_LIMIT);
    });

    it('should categorize Telegram errors', () => {
      const error = new Error('Telegram bot API error');
      const result = errorHandler.normalizeError(error);
      expect(result.category).toBe(ErrorCategory.TELEGRAM);
    });

    it('should categorize AI errors', () => {
      const error = new Error('OpenAI model completion failed');
      const result = errorHandler.normalizeError(error);
      expect(result.category).toBe(ErrorCategory.AI);
    });
  });

  describe('handleError', () => {
    it('should handle error without chat ID', async () => {
      const error = new Error('Test error');
      
      await errorHandler.handleError(error);
      
      expect(mockResponseService.sendResponse).not.toHaveBeenCalled();
    });

    it('should send user feedback when chat ID is provided', async () => {
      const error = new ValidationError('Invalid input');
      const chatId = 123456;
      const userContext = {
        userId: 'user1',
        telegramId: '123456',
        preferences: { currency: 'IDR', language: 'en' as const, notifications: true },
      };

      await errorHandler.handleError(error, chatId, userContext);

      expect(mockResponseService.sendResponse).toHaveBeenCalledWith(
        chatId,
        expect.stringContaining('Something went wrong'),
        userContext,
        { priority: 'high', showTyping: false }
      );
    });

    it('should handle errors in error handler gracefully', async () => {
      mockResponseService.sendResponse.mockRejectedValue(new Error('Response service failed'));
      
      const error = new Error('Test error');
      
      // Should not throw
      await expect(errorHandler.handleError(error, 123456)).resolves.toBeUndefined();
    });
  });

  describe('createError', () => {
    it('should create AppError with specified options', () => {
      const error = errorHandler.createError({
        message: 'Custom error',
        category: ErrorCategory.API,
        context: { service: 'test' },
        userMessage: 'Service unavailable',
      });

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Custom error');
      expect(error.category).toBe(ErrorCategory.API);
      expect(error.context).toEqual({ service: 'test' });
      expect(error.getUserFriendlyMessage()).toBe('Service unavailable');
    });
  });
});

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new AppError({
        message: 'Test error',
        category: ErrorCategory.NETWORK,
        context: { url: 'https://api.example.com' },
        originalError: new Error('Original'),
        isRetryable: true,
        userMessage: 'Network issue',
        errorCode: 'NET001',
      });

      expect(error.message).toBe('Test error');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.context).toEqual({ url: 'https://api.example.com' });
      expect(error.originalError?.message).toBe('Original');
      expect(error.isRetryable).toBe(true);
      expect(error.userMessage).toBe('Network issue');
      expect(error.errorCode).toBe('NET001');
    });

    it('should determine retryability automatically', () => {
      const networkError = new AppError({
        message: 'Network error',
        category: ErrorCategory.NETWORK,
      });

      const validationError = new AppError({
        message: 'Validation error',
        category: ErrorCategory.VALIDATION,
      });

      expect(networkError.isRetryable).toBe(true);
      expect(validationError.isRetryable).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return custom user message if provided', () => {
      const error = new AppError({
        message: 'Technical error',
        category: ErrorCategory.API,
        userMessage: 'Custom user message',
      });

      expect(error.getUserFriendlyMessage()).toBe('Custom user message');
    });

    it('should return default message for category', () => {
      const error = new AppError({
        message: 'Technical error',
        category: ErrorCategory.NETWORK,
      });

      expect(error.getUserFriendlyMessage()).toContain('Network connection issue');
    });
  });

  describe('getRecoverySuggestions', () => {
    it('should return appropriate suggestions for authentication errors', () => {
      const error = new AppError({
        message: 'Auth failed',
        category: ErrorCategory.AUTHENTICATION,
      });

      const suggestions = error.getRecoverySuggestions();
      expect(suggestions).toContain('Try linking your account again');
      expect(suggestions).toContain('Check if your session has expired');
    });

    it('should return appropriate suggestions for network errors', () => {
      const error = new AppError({
        message: 'Network failed',
        category: ErrorCategory.NETWORK,
      });

      const suggestions = error.getRecoverySuggestions();
      expect(suggestions).toContain('Check your internet connection');
      expect(suggestions).toContain('Try again in a few moments');
    });

    it('should return appropriate suggestions for AI errors', () => {
      const error = new AppError({
        message: 'AI failed',
        category: ErrorCategory.AI,
      });

      const suggestions = error.getRecoverySuggestions();
      expect(suggestions).toContain('Try rephrasing your request');
      expect(suggestions).toContain('Use simpler language');
    });
  });

  describe('toDetailedString', () => {
    it('should include all error details', () => {
      const originalError = new Error('Original error');
      originalError.stack = 'Original stack trace';

      const error = new AppError({
        message: 'Test error',
        category: ErrorCategory.API,
        context: { service: 'test' },
        originalError,
        errorCode: 'API001',
      });

      const detailed = error.toDetailedString();

      expect(detailed).toContain('[API] Test error');
      expect(detailed).toContain('Code: API001');
      expect(detailed).toContain('Context: {"service":"test"}');
      expect(detailed).toContain('Original Error: Original error');
      expect(detailed).toContain('Original Stack: Original stack trace');
    });
  });
});

describe('Custom Error Classes', () => {
  describe('AuthenticationError', () => {
    it('should create authentication error with correct properties', () => {
      const error = new AuthenticationError('Auth failed', { token: 'invalid' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.message).toBe('Auth failed');
      expect(error.context).toEqual({ token: 'invalid' });
      expect(error.getUserFriendlyMessage()).toContain('Authentication failed');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.message).toBe('Invalid input');
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('NetworkError', () => {
    it('should create network error with correct properties', () => {
      const error = new NetworkError('Connection failed', { url: 'https://api.example.com' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.message).toBe('Connection failed');
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('TelegramError', () => {
    it('should create Telegram error with correct properties', () => {
      const error = new TelegramError('Bot API failed', { chatId: 123 });

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.TELEGRAM);
      expect(error.message).toBe('Bot API failed');
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('AIError', () => {
    it('should create AI error with correct properties', () => {
      const error = new AIError('Model completion failed', { model: 'gpt-4' });

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.AI);
      expect(error.message).toBe('Model completion failed');
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with correct properties', () => {
      const error = new RateLimitError('Too many requests', { limit: 100 });

      expect(error).toBeInstanceOf(AppError);
      expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(error.message).toBe('Too many requests');
      expect(error.isRetryable).toBe(true);
    });
  });
});