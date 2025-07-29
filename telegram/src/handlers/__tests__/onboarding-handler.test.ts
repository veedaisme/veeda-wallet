import { onboardingHandler, OnboardingHandler } from '../onboarding-handler';
import { onboardingService } from '../../services/onboarding-service';
import { helpService } from '../../services/help-service';
import { TelegramMessage } from '../../types/telegram';
import { UserContext } from '../../types/auth';

// Mock dependencies
jest.mock('../../services/onboarding-service');
jest.mock('../../services/help-service');

describe('OnboardingHandler', () => {
  let handler: OnboardingHandler;
  const mockTelegramId = 'test-user-123';
  const mockChatId = 12345;
  const mockUserName = 'TestUser';

  beforeEach(() => {
    handler = OnboardingHandler.getInstance();
    jest.clearAllMocks();
  });

  describe('handleNewUser', () => {
    it('should handle new user onboarding', async () => {
      (onboardingService.needsOnboarding as jest.Mock).mockReturnValue(true);
      (onboardingService.generateWelcomeMessage as jest.Mock).mockReturnValue({
        message: 'Welcome to Clair AI Assistant!',
        keyboard: { inline_keyboard: [] },
      });

      const result = await handler.handleNewUser(mockTelegramId, mockChatId, mockUserName);

      expect(result.shouldContinue).toBe(true);
      expect(result.nextStep).toBe('link_account');
      expect(result.message).toContain('Welcome to Clair AI Assistant, TestUser!');
      expect(onboardingService.generateWelcomeMessage).toHaveBeenCalledWith(mockTelegramId);
    });

    it('should handle returning user', async () => {
      (onboardingService.needsOnboarding as jest.Mock).mockReturnValue(false);

      const result = await handler.handleNewUser(mockTelegramId, mockChatId, mockUserName);

      expect(result.shouldContinue).toBe(false);
      expect(result.message).toContain('Welcome back');
    });

    it('should handle user without name', async () => {
      (onboardingService.needsOnboarding as jest.Mock).mockReturnValue(true);
      (onboardingService.generateWelcomeMessage as jest.Mock).mockReturnValue({
        message: 'Welcome to Clair AI Assistant!',
        keyboard: { inline_keyboard: [] },
      });

      const result = await handler.handleNewUser(mockTelegramId, mockChatId);

      expect(result.message).toBe('Welcome to Clair AI Assistant!');
    });
  });

  describe('handleOnboardingCallback', () => {
    it('should handle welcome callback', async () => {
      (onboardingService.generateWelcomeMessage as jest.Mock).mockReturnValue({
        message: 'Welcome message',
        keyboard: { inline_keyboard: [] },
      });

      const result = await handler.handleOnboardingCallback(
        mockTelegramId,
        mockChatId,
        'onboarding_welcome'
      );

      expect(result.shouldContinue).toBe(true);
      expect(result.nextStep).toBe('link_account');
    });

    it('should handle link account callback', async () => {
      (onboardingService.handleOnboardingAction as jest.Mock).mockReturnValue({
        message: 'Link account message',
        keyboard: { inline_keyboard: [] },
      });

      const result = await handler.handleOnboardingCallback(
        mockTelegramId,
        mockChatId,
        'onboarding_link_account'
      );

      expect(result.shouldContinue).toBe(true);
      expect(result.nextStep).toBe('first_transaction');
      expect(onboardingService.handleOnboardingAction).toHaveBeenCalledWith(
        mockTelegramId,
        'link_account'
      );
    });

    it('should handle skip callback', async () => {
      (onboardingService.handleOnboardingAction as jest.Mock).mockReturnValue({
        message: 'Onboarding skipped',
        keyboard: { inline_keyboard: [] },
      });

      const result = await handler.handleOnboardingCallback(
        mockTelegramId,
        mockChatId,
        'onboarding_skip'
      );

      expect(result.shouldContinue).toBe(false);
      expect(onboardingService.handleOnboardingAction).toHaveBeenCalledWith(
        mockTelegramId,
        'skip'
      );
    });

    it('should handle completion callback', async () => {
      const result = await handler.handleOnboardingCallback(
        mockTelegramId,
        mockChatId,
        'onboarding_completed'
      );

      expect(result.shouldContinue).toBe(false);
      expect(result.message).toContain('Welcome to Clair AI Assistant!');
      expect(onboardingService.completeOnboarding).toHaveBeenCalledWith(mockTelegramId);
    });

    it('should handle tip request callback', async () => {
      const mockTip = {
        id: 'test-tip',
        title: 'Test Tip',
        description: 'Test description',
        category: 'basic' as const,
      };

      (onboardingService.getRandomTip as jest.Mock).mockReturnValue(mockTip);
      (onboardingService.generateTipMessage as jest.Mock).mockReturnValue('Tip message');

      const result = await handler.handleOnboardingCallback(
        mockTelegramId,
        mockChatId,
        'onboarding_tip_basic'
      );

      expect(result.shouldContinue).toBe(true);
      expect(result.tip).toBe('Tip message');
      expect(onboardingService.getRandomTip).toHaveBeenCalledWith('basic');
    });
  });

  describe('handleOnboardingMessage', () => {
    const mockMessage: TelegramMessage = {
      message_id: 1,
      date: Date.now(),
      chat: { id: mockChatId, type: 'private' },
      from: { id: parseInt(mockTelegramId), is_bot: false, first_name: 'Test' },
      text: 'test message',
    };

    it('should return null for completed onboarding', async () => {
      (onboardingService.getUserProgress as jest.Mock).mockReturnValue({
        isCompleted: true,
      });

      const result = await handler.handleOnboardingMessage(mockMessage);

      expect(result).toBeNull();
    });

    it('should return null for no progress', async () => {
      (onboardingService.getUserProgress as jest.Mock).mockReturnValue(null);

      const result = await handler.handleOnboardingMessage(mockMessage);

      expect(result).toBeNull();
    });

    it('should handle positive response', async () => {
      const mockProgress = {
        currentStep: 'welcome',
        isCompleted: false,
      };

      (onboardingService.getUserProgress as jest.Mock).mockReturnValue(mockProgress);
      (onboardingService.advanceStep as jest.Mock).mockReturnValue({
        message: 'Next step message',
        keyboard: { inline_keyboard: [] },
        isCompleted: false,
      });

      const positiveMessage = { ...mockMessage, text: 'yes, continue' };
      const result = await handler.handleOnboardingMessage(positiveMessage);

      expect(result?.shouldContinue).toBe(true);
      expect(onboardingService.advanceStep).toHaveBeenCalledWith(mockTelegramId, 'welcome');
    });

    it('should handle negative response', async () => {
      const mockProgress = {
        currentStep: 'welcome',
        isCompleted: false,
      };

      (onboardingService.getUserProgress as jest.Mock).mockReturnValue(mockProgress);

      const negativeMessage = { ...mockMessage, text: 'no, not now' };
      const result = await handler.handleOnboardingMessage(negativeMessage);

      expect(result?.shouldContinue).toBe(true);
      expect(result?.message).toContain('No problem!');
    });

    it('should handle help request', async () => {
      const mockProgress = {
        currentStep: 'link_account',
        isCompleted: false,
      };

      (onboardingService.getUserProgress as jest.Mock).mockReturnValue(mockProgress);

      const helpMessage = { ...mockMessage, text: 'help me understand' };
      const result = await handler.handleOnboardingMessage(helpMessage);

      expect(result?.shouldContinue).toBe(true);
      expect(result?.message).toContain('Help for Current Step');
    });

    it('should handle skip request', async () => {
      const mockProgress = {
        currentStep: 'welcome',
        isCompleted: false,
      };

      (onboardingService.getUserProgress as jest.Mock).mockReturnValue(mockProgress);
      (onboardingService.advanceStep as jest.Mock).mockReturnValue({
        message: 'Step skipped',
        keyboard: { inline_keyboard: [] },
        isCompleted: false,
      });

      const skipMessage = { ...mockMessage, text: 'skip this step' };
      const result = await handler.handleOnboardingMessage(skipMessage);

      expect(result?.message).toContain('Step skipped!');
      expect(onboardingService.advanceStep).toHaveBeenCalledWith(mockTelegramId, undefined, true);
    });

    it('should handle transaction-like message in first_transaction step', async () => {
      const mockProgress = {
        currentStep: 'first_transaction',
        isCompleted: false,
      };

      (onboardingService.getUserProgress as jest.Mock).mockReturnValue(mockProgress);

      const transactionMessage = { ...mockMessage, text: 'I spent 50000 on coffee' };
      const result = await handler.handleOnboardingMessage(transactionMessage);

      expect(result?.message).toContain('Great! That looks like a transaction');
      expect(result?.shouldContinue).toBe(true);
    });
  });

  describe('shouldShowOnboarding', () => {
    it('should show onboarding for new users with few messages', () => {
      (onboardingService.needsOnboarding as jest.Mock).mockReturnValue(true);

      const result = handler.shouldShowOnboarding(mockTelegramId, false, 1);

      expect(result).toBe(true);
      expect(onboardingService.needsOnboarding).toHaveBeenCalledWith(mockTelegramId, false);
    });

    it('should not show onboarding for users with many messages', () => {
      const result = handler.shouldShowOnboarding(mockTelegramId, true, 10);

      expect(result).toBe(false);
    });

    it('should show onboarding for users with 2 or fewer messages', () => {
      (onboardingService.needsOnboarding as jest.Mock).mockReturnValue(true);

      const result = handler.shouldShowOnboarding(mockTelegramId, false, 2);

      expect(result).toBe(true);
    });
  });

  describe('generateContextualHelp', () => {
    it('should generate help for welcome step', () => {
      const result = handler.generateContextualHelp(mockTelegramId, 'welcome');

      expect(result.message).toContain('Help for Current Step');
      expect(result.message).toContain('beginning of your journey');
      expect(result.shouldContinue).toBe(true);
      expect(result.keyboard).toBeDefined();
    });

    it('should generate help for link_account step', () => {
      const result = handler.generateContextualHelp(mockTelegramId, 'link_account');

      expect(result.message).toContain('Account linking allows me');
      expect(result.shouldContinue).toBe(true);
    });

    it('should generate help for first_transaction step', () => {
      const result = handler.generateContextualHelp(mockTelegramId, 'first_transaction');

      expect(result.message).toContain('Adding transactions is easy');
      expect(result.shouldContinue).toBe(true);
    });

    it('should generate help for explore_features step', () => {
      const result = handler.generateContextualHelp(mockTelegramId, 'explore_features');

      expect(result.message).toContain('advanced features');
      expect(result.shouldContinue).toBe(true);
    });

    it('should generate generic help for unknown step', () => {
      const result = handler.generateContextualHelp(mockTelegramId, 'unknown_step');

      expect(result.message).toContain('I\'m here to help you');
      expect(result.shouldContinue).toBe(true);
    });
  });

  describe('private helper methods', () => {
    it('should identify positive responses', () => {
      const positiveTexts = ['yes', 'yeah', 'sure', 'ok', 'continue', 'proceed'];
      
      positiveTexts.forEach(text => {
        // Access private method through any cast for testing
        const result = (handler as any).isPositiveResponse(text);
        expect(result).toBe(true);
      });
    });

    it('should identify negative responses', () => {
      const negativeTexts = ['no', 'nope', 'not now', 'later', 'cancel'];
      
      negativeTexts.forEach(text => {
        const result = (handler as any).isNegativeResponse(text);
        expect(result).toBe(true);
      });
    });

    it('should identify help requests', () => {
      const helpTexts = ['help', 'what is this', 'how does this work', 'explain', 'confused'];
      
      helpTexts.forEach(text => {
        const result = (handler as any).isHelpRequest(text);
        expect(result).toBe(true);
      });
    });

    it('should identify skip requests', () => {
      const skipTexts = ['skip', 'pass', 'next', 'later'];
      
      skipTexts.forEach(text => {
        const result = (handler as any).isSkipRequest(text);
        expect(result).toBe(true);
      });
    });

    it('should identify transaction-like text', () => {
      const transactionTexts = [
        'I spent 50000 on coffee',
        'bought lunch for 25000',
        'paid 15000 for transport',
        'coffee cost 10000',
      ];
      
      transactionTexts.forEach(text => {
        const result = (handler as any).looksLikeTransaction(text);
        expect(result).toBe(true);
      });
    });

    it('should not identify non-transaction text', () => {
      const nonTransactionTexts = [
        'hello there',
        'how are you',
        'what can you do',
        'help me',
      ];
      
      nonTransactionTexts.forEach(text => {
        const result = (handler as any).looksLikeTransaction(text);
        expect(result).toBe(false);
      });
    });
  });
});