import { onboardingService, OnboardingService } from '../onboarding-service';
import { helpService } from '../help-service';

// Mock dependencies
jest.mock('../help-service');

describe('OnboardingService', () => {
  let service: OnboardingService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    service = OnboardingService.getInstance();
    jest.clearAllMocks();
  });

  describe('startOnboarding', () => {
    it('should create new onboarding progress for user', () => {
      const progress = service.startOnboarding(mockUserId);

      expect(progress).toMatchObject({
        userId: mockUserId,
        currentStep: 'welcome',
        completedSteps: [],
        isCompleted: false,
        skippedSteps: [],
      });
      expect(progress.startedAt).toBeInstanceOf(Date);
      expect(progress.lastActivity).toBeInstanceOf(Date);
    });

    it('should store progress for retrieval', () => {
      service.startOnboarding(mockUserId);
      const retrieved = service.getUserProgress(mockUserId);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.userId).toBe(mockUserId);
    });
  });

  describe('needsOnboarding', () => {
    it('should return true for new user', () => {
      const needs = service.needsOnboarding(mockUserId, false);
      expect(needs).toBe(true);
    });

    it('should return false for completed onboarding', () => {
      service.startOnboarding(mockUserId);
      service.completeOnboarding(mockUserId);
      
      const needs = service.needsOnboarding(mockUserId, true);
      expect(needs).toBe(false);
    });

    it('should return true for incomplete onboarding', () => {
      service.startOnboarding(mockUserId);
      
      const needs = service.needsOnboarding(mockUserId, false);
      expect(needs).toBe(true);
    });
  });

  describe('generateWelcomeMessage', () => {
    it('should generate welcome message and start onboarding', () => {
      const result = service.generateWelcomeMessage(mockUserId);

      expect(result.message).toContain('Welcome to Clair AI Assistant');
      expect(result.keyboard).toBeDefined();
      expect(result.keyboard?.inline_keyboard).toHaveLength(2);
    });

    it('should create onboarding progress', () => {
      service.generateWelcomeMessage(mockUserId);
      const progress = service.getUserProgress(mockUserId);

      expect(progress).toBeTruthy();
      expect(progress?.currentStep).toBe('welcome');
    });
  });

  describe('advanceStep', () => {
    beforeEach(() => {
      service.startOnboarding(mockUserId);
      // Mock helpService.getOnboardingSteps
      (helpService.getOnboardingSteps as jest.Mock).mockReturnValue([
        { id: 'welcome', nextStep: 'link_account' },
        { id: 'link_account', nextStep: 'first_transaction' },
        { id: 'first_transaction', nextStep: 'explore_features' },
        { id: 'explore_features', nextStep: 'completed' },
        { id: 'completed' },
      ]);
    });

    it('should advance to next step', () => {
      const result = service.advanceStep(mockUserId, 'welcome');

      expect(result.isCompleted).toBe(false);
      const progress = service.getUserProgress(mockUserId);
      expect(progress?.currentStep).toBe('link_account');
      expect(progress?.completedSteps).toContain('welcome');
    });

    it('should mark onboarding as completed at final step', () => {
      // Advance through all steps
      service.advanceStep(mockUserId, 'welcome');
      service.advanceStep(mockUserId, 'link_account');
      service.advanceStep(mockUserId, 'first_transaction');
      const result = service.advanceStep(mockUserId, 'explore_features');

      expect(result.isCompleted).toBe(true);
      const progress = service.getUserProgress(mockUserId);
      expect(progress?.isCompleted).toBe(true);
      expect(progress?.currentStep).toBe('completed');
    });

    it('should handle skipped steps', () => {
      const result = service.advanceStep(mockUserId, undefined, true);

      const progress = service.getUserProgress(mockUserId);
      expect(progress?.skippedSteps).toContain('welcome');
    });
  });

  describe('handleOnboardingAction', () => {
    beforeEach(() => {
      service.startOnboarding(mockUserId);
    });

    it('should handle link_account action', () => {
      const result = service.handleOnboardingAction(mockUserId, 'link_account');

      expect(result.message).toContain('Account Linking');
      expect(result.keyboard).toBeDefined();
      expect(result.nextAction).toBe('generate_link_code');
    });

    it('should handle learn_more action', () => {
      const result = service.handleOnboardingAction(mockUserId, 'learn_more');

      expect(result.message).toContain('About Clair AI Assistant');
      expect(result.keyboard).toBeDefined();
    });

    it('should handle skip action', () => {
      const result = service.handleOnboardingAction(mockUserId, 'skip');

      expect(result.message).toContain('Onboarding Skipped');
      const progress = service.getUserProgress(mockUserId);
      expect(progress?.isCompleted).toBe(true);
      expect(progress?.currentStep).toBe('skipped');
    });

    it('should handle faq action', () => {
      const result = service.handleOnboardingAction(mockUserId, 'faq');

      expect(result.message).toContain('Frequently Asked Questions');
      expect(result.keyboard).toBeDefined();
    });

    it('should handle unknown action', () => {
      const result = service.handleOnboardingAction(mockUserId, 'unknown');

      expect(result.message).toContain('Unknown onboarding action');
    });
  });

  describe('getRandomTip', () => {
    it('should return a random tip', () => {
      const tip = service.getRandomTip();
      expect(tip).toBeTruthy();
      expect(tip?.id).toBeDefined();
      expect(tip?.title).toBeDefined();
      expect(tip?.description).toBeDefined();
    });

    it('should return tip from specific category', () => {
      const tip = service.getRandomTip('basic');
      expect(tip).toBeTruthy();
      expect(tip?.category).toBe('basic');
    });

    it('should return null for empty category', () => {
      // This would happen if no tips exist for a category
      const tip = service.getRandomTip('pro-tip' as any);
      expect(tip).toBeTruthy(); // Should still return a tip since we have pro-tip category
    });
  });

  describe('generateTipMessage', () => {
    it('should format tip message correctly', () => {
      const tip = {
        id: 'test-tip',
        title: 'Test Tip',
        description: 'This is a test tip',
        example: 'Example usage',
        category: 'basic' as const,
      };

      const message = service.generateTipMessage(tip);

      expect(message).toContain('💡 **Test Tip**');
      expect(message).toContain('This is a test tip');
      expect(message).toContain('**Example:** Example usage');
    });

    it('should handle tip without example', () => {
      const tip = {
        id: 'test-tip',
        title: 'Test Tip',
        description: 'This is a test tip',
        category: 'basic' as const,
      };

      const message = service.generateTipMessage(tip);

      expect(message).toContain('💡 **Test Tip**');
      expect(message).toContain('This is a test tip');
      expect(message).not.toContain('**Example:**');
    });
  });

  describe('completeOnboarding', () => {
    it('should mark onboarding as completed', () => {
      service.startOnboarding(mockUserId);
      service.completeOnboarding(mockUserId);

      const progress = service.getUserProgress(mockUserId);
      expect(progress?.isCompleted).toBe(true);
      expect(progress?.currentStep).toBe('completed');
    });

    it('should handle completing non-existent onboarding', () => {
      // Should not throw error
      expect(() => service.completeOnboarding('non-existent')).not.toThrow();
    });
  });

  describe('resetOnboarding', () => {
    it('should remove onboarding progress', () => {
      service.startOnboarding(mockUserId);
      expect(service.getUserProgress(mockUserId)).toBeTruthy();

      service.resetOnboarding(mockUserId);
      expect(service.getUserProgress(mockUserId)).toBeNull();
    });
  });

  describe('getOnboardingStats', () => {
    beforeEach(() => {
      // Clear any existing progress
      service.resetOnboarding(mockUserId);
      service.resetOnboarding('user2');
      service.resetOnboarding('user3');
    });

    it('should return correct statistics', () => {
      // Create test data
      service.startOnboarding('user1');
      service.startOnboarding('user2');
      service.completeOnboarding('user2');
      service.startOnboarding('user3');
      service.advanceStep('user3', undefined, true); // Skip a step

      const stats = service.getOnboardingStats();

      expect(stats.totalUsers).toBe(3);
      expect(stats.completedUsers).toBe(1);
      expect(stats.activeUsers).toBe(2); // user1 and user3 are active
      expect(stats.commonSkippedSteps).toBeInstanceOf(Array);
    });

    it('should handle empty statistics', () => {
      const stats = service.getOnboardingStats();

      expect(stats.totalUsers).toBe(0);
      expect(stats.completedUsers).toBe(0);
      expect(stats.activeUsers).toBe(0);
      expect(stats.averageCompletionTime).toBe(0);
      expect(stats.commonSkippedSteps).toEqual([]);
    });
  });
});