import { Logger } from '@/utils/logger';
import { onboardingService, OnboardingProgress } from '@/services/onboarding-service';
import { helpService } from '@/services/help-service';
import { TelegramMessage, InlineKeyboardMarkup } from '@/types/telegram';
import { UserContext } from '@/types/auth';
import { MessageFormatter } from '@/utils/message-formatter';
import { ResponseDeliveryService } from '@/services/response-delivery-service';

const logger = new Logger('OnboardingHandler');

export interface OnboardingResponse {
  message: string;
  keyboard?: InlineKeyboardMarkup;
  shouldContinue: boolean;
  nextStep?: string;
  tip?: string;
}

/**
 * Handler for onboarding flow and user guidance
 */
export class OnboardingHandler {
  private static instance: OnboardingHandler;
  private messageFormatter: MessageFormatter;
  private responseService?: ResponseDeliveryService;

  private constructor() {
    this.messageFormatter = new MessageFormatter();
    logger.info('Onboarding handler initialized');
  }

  public static getInstance(): OnboardingHandler {
    if (!OnboardingHandler.instance) {
      OnboardingHandler.instance = new OnboardingHandler();
    }
    return OnboardingHandler.instance;
  }

  /**
   * Set response delivery service
   */
  public setResponseService(service: ResponseDeliveryService): void {
    this.responseService = service;
  }

  /**
   * Handle new user first interaction
   */
  public async handleNewUser(
    telegramId: string,
    chatId: number,
    userName?: string
  ): Promise<OnboardingResponse> {
    logger.info(`Handling new user: ${telegramId} (${userName})`);

    // Check if user needs onboarding
    if (!onboardingService.needsOnboarding(telegramId, false)) {
      return {
        message: this.generateReturningUserMessage(userName),
        shouldContinue: false,
      };
    }

    // Start onboarding
    const welcomeMessage = onboardingService.generateWelcomeMessage(telegramId);
    
    // Send welcome message with personalization
    let personalizedMessage = welcomeMessage.message;
    if (userName) {
      personalizedMessage = personalizedMessage.replace(
        'Welcome to Clair AI Assistant!',
        `Welcome to Clair AI Assistant, ${userName}!`
      );
    }

    return {
      message: personalizedMessage,
      keyboard: welcomeMessage.keyboard,
      shouldContinue: true,
      nextStep: 'link_account',
    };
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

    const parts = callbackData.split('_');
    const action = parts[1]; // onboarding_[action]
    const parameter = parts.slice(2).join('_');

    switch (action) {
      case 'welcome':
        return this.handleWelcomeStep(telegramId);
      
      case 'link':
      case 'account':
        return this.handleLinkAccountStep(telegramId, parameter);
      
      case 'action':
        return this.handleOnboardingAction(telegramId, parameter);
      
      case 'skip':
        return this.handleSkipOnboarding(telegramId);
      
      case 'completed':
        return this.handleOnboardingCompletion(telegramId);
      
      case 'tip':
        return this.handleTipRequest(telegramId, parameter);
      
      default:
        return this.handleGenericOnboardingStep(telegramId, action);
    }
  }

  /**
   * Handle text messages during onboarding
   */
  public async handleOnboardingMessage(
    message: TelegramMessage,
    userContext?: UserContext
  ): Promise<OnboardingResponse | null> {
    const telegramId = message.from?.id.toString();
    if (!telegramId || !message.text) {
      return null;
    }

    const progress = onboardingService.getUserProgress(telegramId);
    if (!progress || progress.isCompleted) {
      return null; // Not in onboarding
    }

    const text = message.text.toLowerCase().trim();
    
    // Handle common onboarding responses
    if (this.isPositiveResponse(text)) {
      return this.handlePositiveResponse(telegramId, progress);
    }
    
    if (this.isNegativeResponse(text)) {
      return this.handleNegativeResponse(telegramId, progress);
    }
    
    if (this.isHelpRequest(text)) {
      return this.handleOnboardingHelp(telegramId, progress);
    }
    
    if (this.isSkipRequest(text)) {
      return this.handleSkipCurrentStep(telegramId, progress);
    }

    // Handle step-specific responses
    return this.handleStepSpecificMessage(telegramId, progress, text);
  }

  /**
   * Check if user should see onboarding
   */
  public shouldShowOnboarding(
    telegramId: string,
    isAuthenticated: boolean,
    messageCount: number = 0
  ): boolean {
    // Show onboarding for new users or users with very few interactions
    if (messageCount <= 2) {
      return onboardingService.needsOnboarding(telegramId, isAuthenticated);
    }
    
    return false;
  }

  /**
   * Generate contextual help during onboarding
   */
  public generateContextualHelp(
    telegramId: string,
    currentStep: string
  ): OnboardingResponse {
    const stepHelp: Record<string, string> = {
      welcome: 'This is the beginning of your journey with Clair AI Assistant. I\'ll guide you through the setup process.',
      link_account: 'Account linking allows me to securely access your financial data to provide personalized insights and track your expenses.',
      first_transaction: 'Adding transactions is easy! Just tell me naturally about your expenses, like "I spent 25000 on coffee this morning".',
      explore_features: 'Now you can explore advanced features like viewing your dashboard, managing subscriptions, and getting AI-powered insights.',
    };

    const helpText = stepHelp[currentStep] || 'I\'m here to help you get the most out of Clair AI Assistant.';
    
    return {
      message: `💡 **Help for Current Step**\n\n${helpText}\n\nNeed more help? Just ask me anything!`,
      keyboard: {
        inline_keyboard: [
          [
            {
              text: '▶️ Continue',
              callback_data: `onboarding_continue_${currentStep}`,
            },
            {
              text: '⏭️ Skip Step',
              callback_data: `onboarding_skip_${currentStep}`,
            },
          ],
          [
            {
              text: '📚 Full Help',
              callback_data: 'help_main',
            },
          ],
        ],
      },
      shouldContinue: true,
    };
  }

  /**
   * Generate returning user message
   */
  private generateReturningUserMessage(userName?: string): string {
    const greeting = userName ? `Welcome back, ${userName}!` : 'Welcome back!';
    return `${greeting} 👋\n\nI'm ready to help you manage your finances. What would you like to do today?\n\n💸 Track expenses\n📊 View dashboard\n🔄 Manage subscriptions\n💡 Get insights\n\nJust tell me naturally what you need!`;
  }

  /**
   * Handle welcome step
   */
  private handleWelcomeStep(telegramId: string): OnboardingResponse {
    const welcomeMessage = onboardingService.generateWelcomeMessage(telegramId);
    
    return {
      message: welcomeMessage.message,
      keyboard: welcomeMessage.keyboard,
      shouldContinue: true,
      nextStep: 'link_account',
    };
  }

  /**
   * Handle link account step
   */
  private handleLinkAccountStep(telegramId: string, parameter?: string): OnboardingResponse {
    const actionResult = onboardingService.handleOnboardingAction(telegramId, 'link_account');
    
    return {
      message: actionResult.message,
      keyboard: actionResult.keyboard,
      shouldContinue: true,
      nextStep: 'first_transaction',
    };
  }

  /**
   * Handle specific onboarding actions
   */
  private handleOnboardingAction(telegramId: string, action: string): OnboardingResponse {
    const actionResult = onboardingService.handleOnboardingAction(telegramId, action);
    
    return {
      message: actionResult.message,
      keyboard: actionResult.keyboard,
      shouldContinue: true,
    };
  }

  /**
   * Handle skip onboarding
   */
  private handleSkipOnboarding(telegramId: string): OnboardingResponse {
    const skipResult = onboardingService.handleOnboardingAction(telegramId, 'skip');
    
    return {
      message: skipResult.message,
      keyboard: skipResult.keyboard,
      shouldContinue: false,
    };
  }

  /**
   * Handle onboarding completion
   */
  private handleOnboardingCompletion(telegramId: string): OnboardingResponse {
    onboardingService.completeOnboarding(telegramId);
    
    const completionMessage = '🎉 **Welcome to Clair AI Assistant!**\n\n' +
      'You\'re all set up and ready to go! Here are some things you can try:\n\n' +
      '💸 **Track Expenses:** "I spent 25000 on coffee"\n' +
      '📊 **View Dashboard:** "show my dashboard"\n' +
      '🔄 **Manage Subscriptions:** "add Netflix subscription"\n' +
      '💡 **Get Insights:** "give me insights"\n\n' +
      'Just talk naturally - I understand context and can help with complex requests!';
    
    return {
      message: completionMessage,
      keyboard: {
        inline_keyboard: [
          [
            {
              text: '💸 Add First Expense',
              callback_data: 'add_expense_guide',
            },
            {
              text: '📊 View Dashboard',
              callback_data: 'show_dashboard',
            },
          ],
          [
            {
              text: '📚 Show All Commands',
              callback_data: 'help_main',
            },
          ],
        ],
      },
      shouldContinue: false,
    };
  }

  /**
   * Handle tip requests
   */
  private handleTipRequest(telegramId: string, tipCategory?: string): OnboardingResponse {
    const category = tipCategory as 'basic' | 'advanced' | 'pro-tip' | undefined;
    const tip = onboardingService.getRandomTip(category);
    
    if (!tip) {
      return {
        message: '💡 No tips available right now. Continue with your onboarding!',
        shouldContinue: true,
      };
    }
    
    const tipMessage = onboardingService.generateTipMessage(tip);
    
    return {
      message: tipMessage,
      keyboard: {
        inline_keyboard: [
          [
            {
              text: '💡 Another Tip',
              callback_data: `onboarding_tip_${tip.category}`,
            },
            {
              text: '▶️ Continue',
              callback_data: 'onboarding_continue',
            },
          ],
        ],
      },
      shouldContinue: true,
      tip: tipMessage,
    };
  }

  /**
   * Handle generic onboarding steps
   */
  private handleGenericOnboardingStep(telegramId: string, stepId: string): OnboardingResponse {
    const stepResult = onboardingService.advanceStep(telegramId, undefined, false);
    
    let response: OnboardingResponse = {
      message: stepResult.message,
      keyboard: stepResult.keyboard,
      shouldContinue: !stepResult.isCompleted,
    };
    
    if (stepResult.tip) {
      response.tip = onboardingService.generateTipMessage(stepResult.tip);
    }
    
    return response;
  }

  /**
   * Handle positive responses
   */
  private handlePositiveResponse(telegramId: string, progress: OnboardingProgress): OnboardingResponse {
    const stepResult = onboardingService.advanceStep(telegramId, progress.currentStep);
    
    return {
      message: stepResult.message,
      keyboard: stepResult.keyboard,
      shouldContinue: !stepResult.isCompleted,
    };
  }

  /**
   * Handle negative responses
   */
  private handleNegativeResponse(telegramId: string, progress: OnboardingProgress): OnboardingResponse {
    return {
      message: 'No problem! Let me know if you change your mind or need help with anything else.\n\nYou can always type "help" to see what I can do for you.',
      keyboard: {
        inline_keyboard: [
          [
            {
              text: '📚 Show Help',
              callback_data: 'help_main',
            },
            {
              text: '▶️ Continue Onboarding',
              callback_data: `onboarding_${progress.currentStep}`,
            },
          ],
          [
            {
              text: '⏭️ Skip Onboarding',
              callback_data: 'onboarding_skip',
            },
          ],
        ],
      },
      shouldContinue: true,
    };
  }

  /**
   * Handle onboarding help requests
   */
  private handleOnboardingHelp(telegramId: string, progress: OnboardingProgress): OnboardingResponse {
    return this.generateContextualHelp(telegramId, progress.currentStep);
  }

  /**
   * Handle skip current step
   */
  private handleSkipCurrentStep(telegramId: string, progress: OnboardingProgress): OnboardingResponse {
    const stepResult = onboardingService.advanceStep(telegramId, undefined, true);
    
    return {
      message: `⏭️ Step skipped! ${stepResult.message}`,
      keyboard: stepResult.keyboard,
      shouldContinue: !stepResult.isCompleted,
    };
  }

  /**
   * Handle step-specific messages
   */
  private handleStepSpecificMessage(
    telegramId: string,
    progress: OnboardingProgress,
    text: string
  ): OnboardingResponse {
    switch (progress.currentStep) {
      case 'link_account':
        if (text.includes('link') || text.includes('connect')) {
          return this.handleLinkAccountStep(telegramId);
        }
        break;
      
      case 'first_transaction':
        // Check if user is trying to add a transaction
        if (this.looksLikeTransaction(text)) {
          return {
            message: '🎉 Great! That looks like a transaction. Once you link your account, I\'ll be able to process transactions like that automatically.\n\nFor now, let\'s continue with the setup.',
            keyboard: {
              inline_keyboard: [
                [
                  {
                    text: '🔗 Link Account Now',
                    callback_data: 'onboarding_action_link_account',
                  },
                  {
                    text: '▶️ Continue Tour',
                    callback_data: 'onboarding_explore_features',
                  },
                ],
              ],
            },
            shouldContinue: true,
          };
        }
        break;
    }

    // Default response for unrecognized input during onboarding
    return {
      message: 'I\'m not sure what you mean right now. Let me help you continue with the onboarding process.',
      keyboard: {
        inline_keyboard: [
          [
            {
              text: '▶️ Continue',
              callback_data: `onboarding_${progress.currentStep}`,
            },
            {
              text: '❓ Get Help',
              callback_data: `onboarding_help_${progress.currentStep}`,
            },
          ],
        ],
      },
      shouldContinue: true,
    };
  }

  /**
   * Check if text is a positive response
   */
  private isPositiveResponse(text: string): boolean {
    const positiveWords = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'continue', 'proceed', 'next', 'go ahead'];
    return positiveWords.some(word => text.includes(word));
  }

  /**
   * Check if text is a negative response
   */
  private isNegativeResponse(text: string): boolean {
    const negativeWords = ['no', 'nope', 'not now', 'later', 'maybe later', 'cancel'];
    return negativeWords.some(word => text.includes(word));
  }

  /**
   * Check if text is a help request
   */
  private isHelpRequest(text: string): boolean {
    const helpWords = ['help', 'what', 'how', 'explain', 'confused', 'don\'t understand'];
    return helpWords.some(word => text.includes(word));
  }

  /**
   * Check if text is a skip request
   */
  private isSkipRequest(text: string): boolean {
    const skipWords = ['skip', 'pass', 'next', 'later', 'not now'];
    return skipWords.some(word => text.includes(word));
  }

  /**
   * Check if text looks like a transaction
   */
  private looksLikeTransaction(text: string): boolean {
    // Simple heuristic to detect transaction-like text
    const transactionIndicators = [
      /spent.*\d+/i,
      /bought.*\d+/i,
      /paid.*\d+/i,
      /cost.*\d+/i,
      /\d+.*coffee/i,
      /\d+.*lunch/i,
      /\d+.*food/i,
      /\d+.*transport/i,
    ];
    
    return transactionIndicators.some(pattern => pattern.test(text));
  }
}

// Export singleton instance
export const onboardingHandler = OnboardingHandler.getInstance();