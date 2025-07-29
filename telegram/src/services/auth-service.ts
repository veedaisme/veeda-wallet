import { 
  TelegramAuthService, 
  LinkResult, 
  UserContext, 
  TelegramUserLink,
  CreateTelegramUserLinkData,
  UpdateTelegramUserLinkData,
  UserPreferences 
} from '@/types/auth';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';
import crypto from 'crypto';

export class TelegramAuthServiceImpl implements TelegramAuthService {
  private logger = new Logger('TelegramAuth');
  private userLinks = new Map<string, TelegramUserLink>(); // In-memory cache for demo
  private authTokens = new Map<string, string>(); // telegram_id -> auth_token mapping

  constructor() {
    // In a real implementation, this would connect to the database
    this.logger.info('TelegramAuthService initialized');
  }

  public async linkAccount(telegramId: string, authToken: string): Promise<LinkResult> {
    try {
      this.logger.info(`Attempting to link account for Telegram ID: ${telegramId}`);

      // Validate the auth token (in real implementation, this would verify with Clair API)
      const isValidToken = await this.validateAuthToken(authToken);
      if (!isValidToken) {
        return {
          success: false,
          message: '❌ Invalid authentication token. Please check your credentials and try again.',
        };
      }

      // Extract user ID from token (mock implementation)
      const userId = await this.getUserIdFromToken(authToken);
      if (!userId) {
        return {
          success: false,
          message: '❌ Unable to extract user information from token.',
        };
      }

      // Check if this Telegram ID is already linked
      const existingLink = await this.getUserContext(telegramId);
      if (existingLink) {
        // Update existing link
        await this.updateUserLink(telegramId, { 
          auth_token: authToken,
          last_activity: new Date().toISOString(),
        });

        return {
          success: true,
          message: '✅ Account link updated successfully! You can now use all bot features.',
        };
      }

      // Create new user link
      const userLinkData: CreateTelegramUserLinkData = {
        telegram_id: telegramId,
        user_id: userId,
        auth_token: authToken,
        preferences: {
          notifications: true,
          language: 'en',
          timezone: 'UTC',
          currency: 'IDR',
        },
      };

      await this.createUserLink(userLinkData);

      this.logger.info(`Successfully linked account for Telegram ID: ${telegramId}`);

      return {
        success: true,
        message: '🎉 Account linked successfully!\n\n' +
                'You can now:\n' +
                '💸 Add transactions by describing them\n' +
                '📊 View your spending dashboard\n' +
                '📝 Check transaction history\n' +
                '🔄 Manage subscriptions\n' +
                '💡 Get personalized insights\n\n' +
                'Try saying: "I spent 50000 on food today"',
      };

    } catch (error) {
      this.logger.error('Error linking account:', error);
      return {
        success: false,
        message: '❌ An error occurred while linking your account. Please try again later.',
      };
    }
  }

  public async isUserLinked(telegramId: string): Promise<boolean> {
    try {
      const userContext = await this.getUserContext(telegramId);
      return userContext !== null;
    } catch (error) {
      this.logger.error('Error checking if user is linked:', error);
      return false;
    }
  }

  public async getUserContext(telegramId: string): Promise<UserContext | null> {
    try {
      // In real implementation, this would query the database
      const userLink = this.userLinks.get(telegramId);
      
      if (!userLink) {
        return null;
      }

      // Check if auth token is still valid
      const isTokenValid = await this.validateAuthToken(userLink.auth_token);
      if (!isTokenValid) {
        this.logger.warn(`Auth token expired for Telegram ID: ${telegramId}`);
        return null;
      }

      // Update last activity
      await this.updateLastActivity(telegramId);

      return {
        userId: userLink.user_id,
        telegramId: userLink.telegram_id,
        authToken: userLink.auth_token,
        preferences: userLink.preferences,
        linkedAt: userLink.created_at,
      };

    } catch (error) {
      this.logger.error('Error getting user context:', error);
      return null;
    }
  }

  public async generateAuthLink(telegramId: string): Promise<string> {
    try {
      // Generate a secure temporary token for the auth flow
      const tempToken = this.generateSecureToken();
      const timestamp = Date.now();
      
      // In real implementation, store this temp token in database with expiration
      const authUrl = `${config.api.clairUrl}/auth/telegram-link?token=${tempToken}&telegram_id=${telegramId}&ts=${timestamp}`;
      
      this.logger.info(`Generated auth link for Telegram ID: ${telegramId}`);
      
      return authUrl;
    } catch (error) {
      this.logger.error('Error generating auth link:', error);
      throw new Error('Failed to generate authentication link');
    }
  }

  public async unlinkAccount(telegramId: string): Promise<void> {
    try {
      this.logger.info(`Unlinking account for Telegram ID: ${telegramId}`);
      
      // Remove from in-memory cache (in real implementation, delete from database)
      this.userLinks.delete(telegramId);
      this.authTokens.delete(telegramId);
      
      this.logger.info(`Successfully unlinked account for Telegram ID: ${telegramId}`);
    } catch (error) {
      this.logger.error('Error unlinking account:', error);
      throw error;
    }
  }

  // Helper methods for database operations (mock implementations)
  private async createUserLink(data: CreateTelegramUserLinkData): Promise<TelegramUserLink> {
    const now = new Date().toISOString();
    const userLink: TelegramUserLink = {
      id: crypto.randomUUID(),
      telegram_id: data.telegram_id,
      user_id: data.user_id,
      auth_token: data.auth_token,
      preferences: {
        notifications: true,
        language: 'en',
        timezone: 'UTC',
        currency: 'IDR',
        ...data.preferences,
      },
      created_at: now,
      updated_at: now,
      last_activity: now,
    };

    // Store in memory (in real implementation, insert into database)
    this.userLinks.set(data.telegram_id, userLink);
    this.authTokens.set(data.telegram_id, data.auth_token);

    return userLink;
  }

  private async updateUserLink(telegramId: string, data: UpdateTelegramUserLinkData): Promise<void> {
    const existingLink = this.userLinks.get(telegramId);
    if (!existingLink) {
      throw new Error('User link not found');
    }

    const updatedLink: TelegramUserLink = {
      ...existingLink,
      ...data,
      updated_at: new Date().toISOString(),
    };

    this.userLinks.set(telegramId, updatedLink);
    
    if (data.auth_token) {
      this.authTokens.set(telegramId, data.auth_token);
    }
  }

  private async updateLastActivity(telegramId: string): Promise<void> {
    const userLink = this.userLinks.get(telegramId);
    if (userLink) {
      userLink.last_activity = new Date().toISOString();
      this.userLinks.set(telegramId, userLink);
    }
  }

  private async validateAuthToken(authToken: string): Promise<boolean> {
    try {
      // Mock validation - in real implementation, this would call Clair API
      // For now, accept any token that looks like a valid format
      if (!authToken || authToken.length < 10) {
        return false;
      }

      // Simulate API call to validate token
      await this.sleep(100); // Simulate network delay
      
      // For demo purposes, accept tokens that start with 'clair_' or 'demo_'
      return authToken.startsWith('clair_') || authToken.startsWith('demo_');
      
    } catch (error) {
      this.logger.error('Error validating auth token:', error);
      return false;
    }
  }

  private async getUserIdFromToken(authToken: string): Promise<string | null> {
    try {
      // Mock implementation - extract user ID from token
      // In real implementation, this would decode JWT or call API
      
      if (authToken.startsWith('demo_')) {
        // For demo tokens, generate a consistent user ID
        const hash = crypto.createHash('sha256').update(authToken).digest('hex');
        return hash.substring(0, 32); // Use first 32 chars as user ID
      }
      
      if (authToken.startsWith('clair_')) {
        // For real tokens, this would decode the JWT
        return crypto.randomUUID(); // Mock user ID
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error extracting user ID from token:', error);
      return null;
    }
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public method for testing/demo purposes
  public async createDemoLink(telegramId: string): Promise<LinkResult> {
    const demoToken = `demo_${crypto.randomBytes(16).toString('hex')}`;
    return this.linkAccount(telegramId, demoToken);
  }

  // Method to get user preferences
  public async getUserPreferences(telegramId: string): Promise<UserPreferences | null> {
    const userContext = await this.getUserContext(telegramId);
    return userContext?.preferences || null;
  }

  // Method to update user preferences
  public async updateUserPreferences(telegramId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const existingLink = this.userLinks.get(telegramId);
      if (!existingLink) {
        return false;
      }

      const updatedPreferences = {
        ...existingLink.preferences,
        ...preferences,
      };

      await this.updateUserLink(telegramId, {
        preferences: updatedPreferences,
      });

      return true;
    } catch (error) {
      this.logger.error('Error updating user preferences:', error);
      return false;
    }
  }
}