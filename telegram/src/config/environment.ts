import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Telegram Bot Configuration
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'Telegram bot token is required'),
  
  // AI Configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  
  // Clair API Configuration
  CLAIR_API_URL: z.string().url().default('http://localhost:3000'),
  CLAIR_API_KEY: z.string().optional(),
  
  // Supabase Configuration
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Bot Configuration
  POLLING_INTERVAL: z.string().transform(Number).default('1000'),
  RATE_LIMIT_PER_USER: z.string().transform(Number).default('30'),
  SESSION_TIMEOUT: z.string().transform(Number).default('3600000'), // 1 hour
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Webhook Configuration
  WEBHOOK_URL: z.string().url().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  PORT: z.string().transform(Number).default('3000'),
  
  // Redis Configuration
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // Monitoring Configuration
  SENTRY_DSN: z.string().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_CIRCUIT_BREAKER: z.string().transform(val => val === 'true').default('true'),
  
  // Health Check Configuration
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default('30000'),
  HEALTH_CHECK_TIMEOUT: z.string().transform(Number).default('5000'),
  
  // Graceful Shutdown
  SHUTDOWN_TIMEOUT: z.string().transform(Number).default('10000'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Bot configuration interface
export interface TelegramBotConfig {
  telegram: {
    botToken: string;
    pollingInterval: number;
    rateLimitPerUser: number;
    webhookUrl?: string;
    webhookSecret?: string;
  };
  ai: {
    apiKey: string;
    model: string;
  };
  api: {
    clairUrl: string;
    clairApiKey?: string;
  };
  supabase: {
    url?: string;
    serviceRoleKey?: string;
  };
  redis: {
    url?: string;
    password?: string;
  };
  monitoring: {
    sentryDsn?: string;
    datadogApiKey?: string;
  };
  features: {
    analytics: boolean;
    notifications: boolean;
    rateLimiting: boolean;
    circuitBreaker: boolean;
  };
  health: {
    checkInterval: number;
    checkTimeout: number;
  };
  app: {
    port: number;
    sessionTimeout: number;
    logLevel: string;
    nodeEnv: string;
    shutdownTimeout: number;
  };
}

// Export typed configuration
export const config: TelegramBotConfig = {
  telegram: {
    botToken: env.TELEGRAM_BOT_TOKEN,
    pollingInterval: env.POLLING_INTERVAL,
    rateLimitPerUser: env.RATE_LIMIT_PER_USER,
    webhookUrl: env.WEBHOOK_URL,
    webhookSecret: env.WEBHOOK_SECRET,
  },
  ai: {
    apiKey: env.OPENAI_API_KEY,
    model: env.AI_MODEL,
  },
  api: {
    clairUrl: env.CLAIR_API_URL,
    clairApiKey: env.CLAIR_API_KEY,
  },
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
  },
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    datadogApiKey: env.DATADOG_API_KEY,
  },
  features: {
    analytics: env.ENABLE_ANALYTICS,
    notifications: env.ENABLE_NOTIFICATIONS,
    rateLimiting: env.ENABLE_RATE_LIMITING,
    circuitBreaker: env.ENABLE_CIRCUIT_BREAKER,
  },
  health: {
    checkInterval: env.HEALTH_CHECK_INTERVAL,
    checkTimeout: env.HEALTH_CHECK_TIMEOUT,
  },
  app: {
    port: env.PORT,
    sessionTimeout: env.SESSION_TIMEOUT,
    logLevel: env.LOG_LEVEL,
    nodeEnv: env.NODE_ENV,
    shutdownTimeout: env.SHUTDOWN_TIMEOUT,
  },
};