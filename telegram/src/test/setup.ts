// Test setup file
import { jest } from '@jest/globals';

// Mock environment variables
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-supabase-key';
process.env.API_BASE_URL = 'https://test-api.example.com';
process.env.NODE_ENV = 'test';

// Mock external modules that might not be available
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(),
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock service resilience
jest.mock('../utils/service-resilience', () => ({
  serviceResilience: {
    executeWithResilience: jest.fn(),
    executeWithErrorFallback: jest.fn(),
    executeWithAutoFallback: jest.fn(),
  },
}));

// Global test utilities
global.mockUserContext = {
  userId: 'test-user-123',
  telegramId: '123456789',
  preferences: {
    currency: 'IDR',
    language: 'en' as const,
    notifications: true,
  },
};

global.mockTelegramMessage = {
  message_id: 1,
  from: {
    id: 123456789,
    is_bot: false,
    first_name: 'Test',
    username: 'testuser',
  },
  chat: {
    id: 123456789,
    type: 'private' as const,
  },
  date: Math.floor(Date.now() / 1000),
  text: 'Test message',
};

// Setup fake timers for tests that need them
beforeEach(() => {
  jest.clearAllMocks();
});