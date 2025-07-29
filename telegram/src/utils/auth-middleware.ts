import { TelegramMessage, TelegramUpdate } from '@/types/telegram';
import { UserContext } from '@/types/auth';
import { TelegramAuthServiceImpl } from '@/services/auth-service';
import { Logger } from '@/utils/logger';

export interface AuthenticatedUpdate extends TelegramUpdate {
  userContext?: UserContext;
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowCommands?: string[]; // Commands that don't require authentication
}

export class AuthMiddleware {
  private authService: TelegramAuthServiceImpl;
  private logger = new Logger('AuthMiddleware');

  constructor(authService: TelegramAuthServiceImpl) {
    this.authService = authService;
  }

  /**
   * Middleware to check authentication and inject user context
   */
  public async processUpdate(
    update: TelegramUpdate, 
    options: AuthMiddlewareOptions = {}
  ): Promise<AuthenticatedUpdate> {
    const { requireAuth = true, allowCommands = ['/start', '/help', 'help', 'link'] } = options;

    try {
      const authenticatedUpdate: AuthenticatedUpdate = { ...update };

      // Extract Telegram ID from the update
      const telegramId = this.extractTelegramId(update);
      if (!telegramId) {
        this.logger.warn('Could not extract Telegram ID from update');
        return authenticatedUpdate;
      }

      // Check if this is an allowed command that doesn't require auth
      const messageText = update.message?.text?.toLowerCase().trim();
      const isAllowedCommand = messageText && allowCommands.some(cmd => 
        messageText.startsWith(cmd.toLowerCase())
      );

      if (isAllowedCommand && !requireAuth) {
        this.logger.debug(`Allowing unauthenticated command: ${messageText}`);
        return authenticatedUpdate;
      }

      // Try to get user context
      const userContext = await this.authService.getUserContext(telegramId);
      
      if (userContext) {
        authenticatedUpdate.userContext = userContext;
        this.logger.debug(`User authenticated: ${telegramId}`);
      } else if (requireAuth) {
        this.logger.info(`User not authenticated: ${telegramId}`);
      }

      return authenticatedUpdate;

    } catch (error) {
      this.logger.error('Error in auth middleware:', error);
      return update as AuthenticatedUpdate;
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(update: AuthenticatedUpdate): boolean {
    return !!update.userContext;
  }

  /**
   * Get authentication status and user context
   */
  public getAuthStatus(update: AuthenticatedUpdate): {
    isAuthenticated: boolean;
    userContext?: UserContext;
    telegramId?: string;
  } {
    const telegramId = this.extractTelegramId(update);
    
    return {
      isAuthenticated: !!update.userContext,
      userContext: update.userContext,
      telegramId,
    };
  }

  /**
   * Generate authentication required message
   */
  public getAuthRequiredMessage(telegramId?: string): string {
    return `🔐 **Authentication Required**\n\n` +
           `To use this feature, you need to link your Clair account first.\n\n` +
           `**How to link your account:**\n` +
           `1. Type "link account" to start the process\n` +
           `2. Follow the secure authentication flow\n` +
           `3. Once linked, you can use all bot features!\n\n` +
           `**What you can do after linking:**\n` +
           `💸 Add transactions naturally\n` +
           `📊 View spending insights\n` +
           `📝 Check transaction history\n` +
           `🔄 Manage subscriptions\n\n` +
           `Type "link account" to get started! 🚀`;
  }

  /**
   * Extract Telegram ID from update
   */
  private extractTelegramId(update: TelegramUpdate): string | undefined {
    if (update.message?.from?.id) {
      return update.message.from.id.toString();
    }
    
    if (update.callback_query?.from?.id) {
      return update.callback_query.from.id.toString();
    }

    return undefined;
  }
}

/**
 * Authentication guard decorator for message handlers
 */
export function RequireAuth(allowCommands: string[] = []) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [update] = args;
      
      if (!update.userContext) {
        const telegramId = extractTelegramIdFromUpdate(update);
        const messageText = update.message?.text?.toLowerCase().trim();
        
        // Check if this is an allowed command
        const isAllowedCommand = messageText && allowCommands.some(cmd => 
          messageText.startsWith(cmd.toLowerCase())
        );

        if (!isAllowedCommand) {
          // Send authentication required message
          const authMiddleware = new AuthMiddleware(new TelegramAuthServiceImpl());
          const authMessage = authMiddleware.getAuthRequiredMessage(telegramId);
          
          // This would need to be handled by the calling service
          throw new AuthenticationRequiredError(authMessage, telegramId);
        }
      }

      return method.apply(this, args);
    };
  };
}

/**
 * Custom error for authentication required scenarios
 */
export class AuthenticationRequiredError extends Error {
  public readonly telegramId?: string;
  public readonly authMessage: string;

  constructor(message: string, telegramId?: string) {
    super(message);
    this.name = 'AuthenticationRequiredError';
    this.authMessage = message;
    this.telegramId = telegramId;
  }
}

/**
 * Helper function to extract Telegram ID from update
 */
function extractTelegramIdFromUpdate(update: TelegramUpdate): string | undefined {
  if (update.message?.from?.id) {
    return update.message.from.id.toString();
  }
  
  if (update.callback_query?.from?.id) {
    return update.callback_query.from.id.toString();
  }

  return undefined;
}

/**
 * Rate limiting middleware
 */
export class RateLimitMiddleware {
  private userRequests = new Map<string, number[]>();
  private logger = new Logger('RateLimit');

  constructor(private maxRequestsPerMinute: number = 30) {}

  public checkRateLimit(telegramId: string): boolean {
    const now = Date.now();
    const userRequests = this.userRequests.get(telegramId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(timestamp => now - timestamp < 60000);
    
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      this.logger.warn(`Rate limit exceeded for user: ${telegramId}`);
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.userRequests.set(telegramId, recentRequests);
    
    return true;
  }

  public getRateLimitMessage(): string {
    return `⚠️ **Rate Limit Exceeded**\n\n` +
           `You're sending messages too quickly. Please wait a moment before trying again.\n\n` +
           `**Rate Limit:** ${this.maxRequestsPerMinute} messages per minute\n\n` +
           `This helps ensure the bot stays responsive for everyone! 😊`;
  }

  // Clean up old entries periodically
  public cleanup(): void {
    const now = Date.now();
    for (const [telegramId, requests] of this.userRequests.entries()) {
      const recentRequests = requests.filter(timestamp => now - timestamp < 60000);
      if (recentRequests.length === 0) {
        this.userRequests.delete(telegramId);
      } else {
        this.userRequests.set(telegramId, recentRequests);
      }
    }
  }
}