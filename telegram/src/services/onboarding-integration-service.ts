import { Logger } from '@/utils/logger';
import { onboardingHandler, OnboardingResponse } from '@/handlers/onboarding-handler';
import { onboardingService } from '@/services/onboarding-service';
import { helpService } from '@/services/help-service';
import { TelegramMessage, InlineKeyboardMarkup } from '@/types/telegram';
import { UserContext } from '@/types/auth';
import { ResponseDeliveryService } from '@/services/response-delivery-service';

const logger = new Logger('OnboardingIntegrationService');

export interface OnboardingCheckResult {
  needsOnboarding: boolean;
  currentStep?: string;
  progress?: number;
  message?: string;
  keyboard?: InlineKeyboardMarkup;
}

/**
 * Service to integrate onboarding with the main bot flow
 */
export class OnboardingIntegrationService {
  private static instance: OnboardingIntegrationService;
  private responseService: ResponseDeliveryService;

  private constructor() {
    this.responseService = ResponseDeliveryService.getInstance();
    onboardingHandler.setResponseService(this.responseService);
    logger.info('Onboarding integration service initialized');
  }

  public static getInstance(): OnboardingIntegrationService {
    if (!OnboardingIntegrationService.instance) {
      OnboardingIntegrationService.instance = new OnboardingIntegrationService();
    }
    return OnboardingIntegrationService.instance;
  }

  /**
   * Check if user needs onboarding and return appropriate response
   */
  public async checkOnboardingStatus(
    telegramId: string,
    chatId: number,
    isAuthenticated: boolean,
    messageCount: number = 0,
    userName?: string
  ): Promise<OnboardingCheckResult> {
    logger.debug(`Checking onboarding status for user ${telegramId}`);

    // Check if user should see onboarding
    if (!onboardingHandler.shouldShowOnboarding(telegramId, isAuthenticated, messageCount)) {
      return {
        needsOnboarding: false,
      };
    }

    // Get current progress
    const progress = onboardingService.getUserProgress(telegramId);
    
    if (!progress) {
      // New user - start onboarding
      const welcomeResponse = await onboardingHandler.handleNewUser(telegramId, chatId, userName);
      
      return {
        needsOnboarding: true,
        currentStep: 'welcome',
        progress: 0,
        message: welcomeResponse.message,
        keyboard: welcomeResponse.keyboard,
      };
    }

    if (progress.isCompleted) {
      return {
        needsOnboarding: false,
      };
    }

    // User has incomplete onboarding - resume
    const resumeMessage = this.generateResumeMessage(progress);
    
    return {
      needsOnboarding: true,
      currentStep: progress.currentStep,
      progress: this.calculateProgress(progress),
      message: resumeMessage.message,
      keyboard: resumeMessage.keyboard,
    };
  }

  /**
   * Handle onboarding-related messages
   */
  public async handleOnboardingMessage(
    message: TelegramMessage,
    userContext?: UserContext
  ): Promise<OnboardingResponse | null> {
    const telegramId = message.from?.id.toString();
    if (!telegramId) {
      return null;
    }

    // Check if user is in onboarding
    const progress = onboardingService.getUserProgress(telegramId);
    if (!progress || progress.isCompleted) {
      return null;
    }

    logger.debug(`Handling onboarding message for user ${telegramId} in step ${progress.currentStep}`);

    return await onboardingHandler.handleOnboardingMessage(message, userContext);
  }

  /**
   * Handle onboarding callback queries
   */
  public async handleOnboardingCallback(
    telegramId: string,
    chatId: number,
    callbackData: string,
    userContext?: UserContext
  ): Promise<OnboardingResponse> {
    logger.debug(`Handling onboarding callback: ${callbackData} for user ${telegramId}`);

    return await onboardingHandler.handleOnboardingCallback(
      telegramId,
      chatId,
      callbackData,
      userContext
    );
  }

  /**
   * Handle /start command with onboarding context
   */
  public async handleStartCommand(
    telegramId: string,
    chatId: number,
    isAuthenticated: boolean,
    userName?: string
  ): Promise<OnboardingResponse> {
    logger.info(`Handling start command for user ${telegramId} (authenticated: ${isAuthenticated})`);

    // Always show welcome for /start command
    if (!isAuthenticated) {
      return await onboardingHandler.handleNewUser(telegramId, chatId, userName);
    }

    // Authenticated user - show quick start or main menu
    const quickStartMessage = helpService.generateQuickStartGuide(true);
    
    return {
      message: `👋 Welcome back${userName ? `, ${userName}` : ''}!\n\n${quickStartMessage}`,
      keyboard: {
        inline_keyboard: [
          [
            {
              text: '💸 Add Expense',
              callback_data: 'add_expense_guide',
            },
            {
              text: '📊 Dashboard',
              callback_data: 'show_dashboard',
            },
          ],
          [
            {
              text: '📚 Help',
              callback_data: 'help_main',
            },
            {
              text: '⚙️ Settings',
              callback_data: 'show_settings',
            },
          ],
        ],
      },
      shouldContinue: false,
    };
  }

  /**
   * Handle help command with onboarding context
   */
  public async handleHelpCommand(
    telegramId: string,
    isAuthenticated: boolean,
    userContext?: UserContext,
    category?: string
  ): Promise<OnboardingResponse> {
    logger.debug(`Handling help command for user ${telegramId}`);

    // Check if user is in onboarding
    const progress = onboardingService.getUserProgress(telegramId);
    if (progress && !progress.isCompleted) {
      // User is in onboarding - provide contextual help
      const contextualHelp = onboardingHandler.generateContextualHelp(telegramId, progress.currentStep);
      
      return {
        message: `${contextualHelp.message}\n\n---\n\n📚 **Full Help Available**\nYou can also access the complete help system anytime.`,
        keyboard: {
          inline_keyboard: [
            ...(contextualHelp.keyboard?.inline_keyboard || []),
            [
              {
                text: '📚 Full Help System',
                callback_data: 'help_main_full',
              },
            ],
          ],
        },
        shouldContinue: true,
      };
    }

    // Regular help for non-onboarding users
    const helpMessage = helpService.generateHelpMessage(isAuthenticated, userContext, category);
    
    return {
      message: helpMessage.message,
      keyboard: helpMessage.keyboard,
      shouldContinue: false,
    };
  }

  /**
   * Check if message should be handled by onboarding
   */
  public shouldHandleMessage(telegramId: string, messageText: string): boolean {
    const progress = onboardingService.getUserProgress(telegramId);
    
    // Handle if user is in active onboarding
    if (progress && !progress.isCompleted) {
      return true;
    }

    // Handle specific onboarding-related commands
    const onboardingCommands = ['/start', '/help', 'help', 'link account', 'connect account'];
    const normalizedText = messageText.toLowerCase().trim();
    
    return onboardingCommands.some(cmd => normalizedText.includes(cmd));
  }

  /**
   * Get onboarding statistics for monitoring
   */
  public getOnboardingStatistics(): {
    totalUsers: number;
    completedUsers: number;
    activeUsers: number;
    averageCompletionTime: number;
    commonSkippedSteps: string[];
    completionRate: number;
  } {
    const stats = onboardingService.getOnboardingStats();
    
    return {
      ...stats,
      completionRate: stats.totalUsers > 0 ? (stats.completedUsers / stats.totalUsers) * 100 : 0,
    };
  }

  /**
   * Force complete onboarding for a user (admin function)
   */
  public forceCompleteOnboarding(telegramId: string): void {
    logger.info(`Force completing onboarding for user ${telegramId}`);
    onboardingService.completeOnboarding(telegramId);
  }

  /**
   * Reset onboarding for a user (admin function)
   */
  public resetUserOnboarding(telegramId: string): void {
    logger.info(`Resetting onboarding for user ${telegramId}`);
    onboardingService.resetOnboarding(telegramId);
  }

  /**
   * Generate resume message for incomplete onboarding
   */
  private generateResumeMessage(progress: any): {
    message: string;
    keyboard?: InlineKeyboardMarkup;
  } {
    const stepNames: Record<string, string> = {
      welcome: 'Welcome',
      link_account: 'Account Linking',
      first_transaction: 'First Transaction',
      explore_features: 'Feature Exploration',
    };

    const currentStepName = stepNames[progress.currentStep] || 'Setup';
    const progressPercent = this.calculateProgress(progress);

    let message = `👋 **Welcome back!**\n\n`;
    message += `You were in the middle of setting up your account. `;
    message += `We're currently on: **${currentStepName}** (${progressPercent}% complete)\n\n`;
    message += `Would you like to continue where you left off?`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          {
            text: '▶️ Continue Setup',
            callback_data: `onboarding_${progress.currentStep}`,
          },
        ],
        [
          {
            text: '🔄 Restart Onboarding',
            callback_data: 'onboarding_welcome',
          },
          {
            text: '⏭️ Skip Setup',
            callback_data: 'onboarding_skip',
          },
        ],
      ],
    };

    return { message, keyboard };
  }

  /**
   * Calculate onboarding progress percentage
   */
  private calculateProgress(progress: any): number {
    const totalSteps = 4; // welcome, link_account, first_transaction, explore_features
    const stepOrder = ['welcome', 'link_account', 'first_transaction', 'explore_features'];
    
    const currentStepIndex = stepOrder.indexOf(progress.currentStep);
    const completedSteps = progress.completedSteps.length;
    
    // Calculate based on completed steps and current position
    const progressValue = Math.max(completedSteps, currentStepIndex + 1);
    
    return Math.round((progressValue / totalSteps) * 100);
  }

  /**
   * Send onboarding tip to user
   */
  public async sendOnboardingTip(
    telegramId: string,
    chatId: number,
    category?: 'basic' | 'advanced' | 'pro-tip'
  ): Promise<void> {
    const tip = onboardingService.getRandomTip(category);
    if (!tip) {
      return;
    }

    const tipMessage = onboardingService.generateTipMessage(tip);
    
    await this.responseService.sendMessage(chatId, {
      text: `💡 **Daily Tip**\n\n${tipMessage}`,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '💡 Another Tip',
              callback_data: `tip_${tip.category}`,
            },
            {
              text: '📚 Help',
              callback_data: 'help_main',
            },
          ],
        ],
      },
    });
  }

  /**
   * Check if user completed onboarding recently (for follow-up)
   */
  public shouldSendFollowUp(telegramId: string): boolean {
    const progress = onboardingService.getUserProgress(telegramId);
    
    if (!progress || !progress.isCompleted) {
      return false;
    }

    // Send follow-up if completed within last 24 hours
    const completedRecently = Date.now() - progress.lastActivity.getTime() < 24 * 60 * 60 * 1000;
    
    return completedRecently;
  }

  /**
   * Generate follow-up message for recently completed onboarding
   */
  public generateFollowUpMessage(): {
    message: string;
    keyboard?: InlineKeyboardMarkup;
  } {
    const message = `🎉 **How's it going?**\n\n` +
      `You completed the setup yesterday. Have you tried any of these features yet?\n\n` +
      `💸 **Track an expense** - Just tell me naturally about your spending\n` +
      `📊 **View your dashboard** - See your spending summary\n` +
      `🔄 **Add a subscription** - Track recurring payments\n\n` +
      `Need help with anything?`;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          {
            text: '💸 Add Expense',
            callback_data: 'add_expense_guide',
          },
          {
            text: '📊 Dashboard',
            callback_data: 'show_dashboard',
          },
        ],
        [
          {
            text: '❓ I need help',
            callback_data: 'help_main',
          },
          {
            text: '✅ I\'m good',
            callback_data: 'dismiss_followup',
          },
        ],
      ],
    };

    return { message, keyboard };
  }
}

// Export singleton instance
export const onboardingIntegrationService = OnboardingIntegrationService.getInstance();