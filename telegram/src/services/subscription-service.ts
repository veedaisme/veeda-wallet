import { 
  Subscription, 
  SubscriptionCreateData, 
  SubscriptionSummary,
  ConsolidatedSubscriptionData 
} from './subscription-ai-service';
import { UserContext } from '@/types/auth';
import { Logger } from '@/utils/logger';

// API Client interface for subscriptions (matching the web API client)
interface SubscriptionAPIClient {
  setToken(token: string): void;
  clearToken(): void;
  createSubscription(data: SubscriptionCreateData): Promise<{ data: Subscription }>;
  updateSubscription(id: string, data: Partial<SubscriptionCreateData>): Promise<{ data: Subscription }>;
  deleteSubscription(id: string): Promise<{ message: string }>;
  getSubscriptions(sortDirection?: 'asc' | 'desc'): Promise<{ data: Subscription[] }>;
  getSubscriptionSummary(): Promise<{ data: SubscriptionSummary }>;
  getConsolidatedSubscriptionData(projectionEndDate?: string): Promise<{ data: ConsolidatedSubscriptionData }>;
}

// Mock API client for subscriptions
class MockSubscriptionAPIClient implements SubscriptionAPIClient {
  private token: string | null = null;
  private logger = new Logger('MockSubscriptionAPI');
  private mockSubscriptions: Subscription[] = [
    {
      id: 'sub_001',
      provider_name: 'Netflix',
      amount: 169000,
      currency: 'IDR',
      frequency: 'monthly',
      payment_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    },
    {
      id: 'sub_002',
      provider_name: 'Spotify',
      amount: 54990,
      currency: 'IDR',
      frequency: 'monthly',
      payment_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    },
    {
      id: 'sub_003',
      provider_name: 'YouTube Premium',
      amount: 79000,
      currency: 'IDR',
      frequency: 'monthly',
      payment_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    },
  ];

  setToken(token: string): void {
    this.token = token;
    this.logger.debug('Token set for subscription API client');
  }

  clearToken(): void {
    this.token = null;
    this.logger.debug('Token cleared from subscription API client');
  }

  async createSubscription(data: SubscriptionCreateData): Promise<{ data: Subscription }> {
    this.logger.info('Creating subscription:', data);
    
    await this.sleep(300);
    
    const subscription: Subscription = {
      id: `sub_${Date.now()}`,
      provider_name: data.provider_name,
      amount: data.amount,
      currency: data.currency,
      frequency: data.frequency,
      payment_date: data.payment_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    this.mockSubscriptions.push(subscription);
    this.logger.info('Subscription created successfully:', subscription.id);
    
    return { data: subscription };
  }

  async updateSubscription(id: string, data: Partial<SubscriptionCreateData>): Promise<{ data: Subscription }> {
    this.logger.info(`Updating subscription ${id}:`, data);
    
    await this.sleep(200);
    
    const index = this.mockSubscriptions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }
    
    const updated: Subscription = {
      ...this.mockSubscriptions[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    this.mockSubscriptions[index] = updated;
    this.logger.info('Subscription updated successfully:', id);
    
    return { data: updated };
  }

  async deleteSubscription(id: string): Promise<{ message: string }> {
    this.logger.info(`Deleting subscription ${id}`);
    
    await this.sleep(200);
    
    const index = this.mockSubscriptions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }
    
    this.mockSubscriptions.splice(index, 1);
    this.logger.info('Subscription deleted successfully:', id);
    
    return { message: 'Subscription deleted successfully' };
  }

  async getSubscriptions(sortDirection: 'asc' | 'desc' = 'asc'): Promise<{ data: Subscription[] }> {
    this.logger.info('Fetching subscriptions');
    
    await this.sleep(150);
    
    const sorted = [...this.mockSubscriptions].sort((a, b) => {
      const comparison = a.provider_name.localeCompare(b.provider_name);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return { data: sorted };
  }

  async getSubscriptionSummary(): Promise<{ data: SubscriptionSummary }> {
    this.logger.info('Fetching subscription summary');
    
    await this.sleep(100);
    
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const upcomingThisMonth = this.mockSubscriptions
      .filter(sub => {
        const paymentDate = new Date(sub.payment_date);
        return paymentDate >= now && paymentDate <= endOfMonth;
      })
      .reduce((sum, sub) => sum + sub.amount, 0);
    
    const totalMonthlyRecurring = this.mockSubscriptions
      .reduce((sum, sub) => {
        switch (sub.frequency) {
          case 'monthly':
            return sum + sub.amount;
          case 'quarterly':
            return sum + (sub.amount / 3);
          case 'annually':
            return sum + (sub.amount / 12);
          default:
            return sum;
        }
      }, 0);
    
    const summary: SubscriptionSummary = {
      upcoming_this_month: upcomingThisMonth,
      total_monthly_recurring: totalMonthlyRecurring,
      subscription_count: this.mockSubscriptions.length,
    };
    
    return { data: summary };
  }

  async getConsolidatedSubscriptionData(projectionEndDate?: string): Promise<{ data: ConsolidatedSubscriptionData }> {
    this.logger.info('Fetching consolidated subscription data');
    
    await this.sleep(200);
    
    const subscriptionsResult = await this.getSubscriptions();
    const summaryResult = await this.getSubscriptionSummary();
    
    // Mock projected subscriptions (in real implementation, this would be calculated)
    const projectedSubscriptions = subscriptionsResult.data.map(sub => ({
      id: sub.id,
      provider_name: sub.provider_name,
      original_amount: sub.amount,
      original_currency: sub.currency,
      amount_in_idr: sub.currency === 'IDR' ? sub.amount : sub.amount * 15000, // Mock exchange rate
      frequency: sub.frequency,
      original_payment_date: sub.payment_date,
      projected_payment_date: sub.payment_date,
      user_id: 'mock_user_id',
    }));
    
    const consolidated: ConsolidatedSubscriptionData = {
      subscriptions: subscriptionsResult.data,
      projected_subscriptions: projectedSubscriptions,
      subscription_summary: summaryResult.data,
    };
    
    return { data: consolidated };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class SubscriptionService {
  private apiClient: SubscriptionAPIClient;
  private logger = new Logger('SubscriptionService');

  constructor() {
    // For now, use mock API client
    // In production, this would be the actual API client from web/lib/apiClient.ts
    this.apiClient = new MockSubscriptionAPIClient();
    this.logger.info('Subscription Service initialized with mock API client');
  }

  /**
   * Create a subscription from parsed AI data
   */
  public async createSubscriptionFromParsed(
    parsedSubscription: any,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    subscription?: Subscription;
    message: string;
    needsConfirmation?: boolean;
  }> {
    try {
      // Set user token for API authentication
      this.apiClient.setToken(userContext.authToken);

      // Validate the parsed subscription
      if (parsedSubscription.needsConfirmation || parsedSubscription.confidence < 0.8) {
        return {
          success: false,
          message: this.generateConfirmationMessage(parsedSubscription, userContext),
          needsConfirmation: true,
        };
      }

      // Prepare subscription data
      const subscriptionData: SubscriptionCreateData = {
        provider_name: parsedSubscription.provider_name,
        amount: parsedSubscription.amount,
        currency: parsedSubscription.currency,
        frequency: parsedSubscription.frequency,
        payment_date: parsedSubscription.payment_date,
      };

      // Create subscription via API
      const result = await this.apiClient.createSubscription(subscriptionData);

      this.logger.info(`Subscription created successfully for user ${userContext.userId}: ${result.data.id}`);

      return {
        success: true,
        subscription: result.data,
        message: this.generateSuccessMessage(result.data, userContext),
      };

    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      return {
        success: false,
        message: this.generateErrorMessage(error),
      };
    }
  }

  /**
   * Get all subscriptions for a user
   */
  public async getUserSubscriptions(userContext: UserContext): Promise<{
    success: boolean;
    subscriptions?: Subscription[];
    message: string;
  }> {
    try {
      this.apiClient.setToken(userContext.authToken);

      const result = await this.apiClient.getSubscriptions('asc');

      if (result.data.length === 0) {
        return {
          success: true,
          subscriptions: [],
          message: '🔄 **No Active Subscriptions**\n\n' +
                  'You haven\'t added any subscriptions yet.\n\n' +
                  '💡 **Add one by saying:**\n' +
                  '• "Add Netflix subscription 169000 monthly"\n' +
                  '• "I have Spotify premium 55000 per month"\n' +
                  '• "Subscribe to YouTube Premium 79000 monthly"',
        };
      }

      return {
        success: true,
        subscriptions: result.data,
        message: `Found ${result.data.length} active subscription${result.data.length > 1 ? 's' : ''}`,
      };

    } catch (error) {
      this.logger.error('Error fetching subscriptions:', error);
      return {
        success: false,
        message: '❌ Sorry, I couldn\'t fetch your subscriptions right now. Please try again later.',
      };
    }
  }

  /**
   * Get subscription summary
   */
  public async getSubscriptionSummary(userContext: UserContext): Promise<{
    success: boolean;
    summary?: SubscriptionSummary;
    subscriptions?: Subscription[];
    message: string;
  }> {
    try {
      this.apiClient.setToken(userContext.authToken);

      const [summaryResult, subscriptionsResult] = await Promise.all([
        this.apiClient.getSubscriptionSummary(),
        this.apiClient.getSubscriptions('asc')
      ]);

      return {
        success: true,
        summary: summaryResult.data,
        subscriptions: subscriptionsResult.data,
        message: 'Subscription summary retrieved successfully',
      };

    } catch (error) {
      this.logger.error('Error fetching subscription summary:', error);
      return {
        success: false,
        message: '❌ Sorry, I couldn\'t fetch your subscription summary right now. Please try again later.',
      };
    }
  }

  /**
   * Update a subscription
   */
  public async updateSubscription(
    subscriptionId: string,
    updates: Partial<SubscriptionCreateData>,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    subscription?: Subscription;
    message: string;
  }> {
    try {
      this.apiClient.setToken(userContext.authToken);

      const result = await this.apiClient.updateSubscription(subscriptionId, updates);

      this.logger.info(`Subscription updated successfully: ${subscriptionId}`);

      return {
        success: true,
        subscription: result.data,
        message: `✅ **Subscription Updated**\n\n` +
                `Updated ${result.data.provider_name} successfully!\n\n` +
                `**New Details:**\n` +
                `• Amount: ${this.formatCurrency(result.data.amount, result.data.currency)}\n` +
                `• Frequency: ${result.data.frequency}\n` +
                `• Next payment: ${new Date(result.data.payment_date).toLocaleDateString()}\n\n` +
                `Subscription ID: ${result.data.id}`,
      };

    } catch (error) {
      this.logger.error('Error updating subscription:', error);
      return {
        success: false,
        message: this.generateErrorMessage(error),
      };
    }
  }

  /**
   * Delete a subscription
   */
  public async deleteSubscription(
    subscriptionId: string,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.apiClient.setToken(userContext.authToken);

      await this.apiClient.deleteSubscription(subscriptionId);

      this.logger.info(`Subscription deleted successfully: ${subscriptionId}`);

      return {
        success: true,
        message: `🗑️ **Subscription Cancelled**\n\n` +
                `Subscription ${subscriptionId} has been cancelled successfully.\n\n` +
                `You won't be charged for future billing cycles.`,
      };

    } catch (error) {
      this.logger.error('Error deleting subscription:', error);
      return {
        success: false,
        message: this.generateErrorMessage(error),
      };
    }
  }

  /**
   * Process subscription confirmation from user
   */
  public async processSubscriptionConfirmation(
    parsedSubscription: any,
    userConfirmation: string,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    subscription?: Subscription;
    message: string;
    needsMoreInfo?: boolean;
  }> {
    const confirmation = userConfirmation.toLowerCase().trim();

    // Handle different confirmation responses
    if (confirmation.includes('yes') || confirmation.includes('confirm') || confirmation.includes('ok')) {
      // User confirmed - create the subscription
      return await this.createSubscriptionFromParsed(
        { ...parsedSubscription, needsConfirmation: false, confidence: 0.9 },
        userContext
      );
    }

    if (confirmation.includes('no') || confirmation.includes('cancel')) {
      return {
        success: false,
        message: `❌ **Subscription Cancelled**\n\n` +
                `No worries! The subscription was not added.\n\n` +
                `Feel free to try again with different details.`,
      };
    }

    // Check if user is providing additional information
    if (confirmation.includes('amount') || /\d+/.test(confirmation)) {
      return {
        success: false,
        message: `🔄 **Processing Updates**\n\n` +
                `I see you're providing additional information. Let me re-process your subscription with these details.\n\n` +
                `Please provide the complete subscription details again.`,
        needsMoreInfo: true,
      };
    }

    // Unclear response
    return {
      success: false,
      message: `🤔 **Need Clarification**\n\n` +
              `I didn't understand your response. Please reply with:\n\n` +
              `• "Yes" or "Confirm" to add the subscription\n` +
              `• "No" or "Cancel" to cancel\n` +
              `• Or provide the missing/corrected information\n\n` +
              `**Current subscription:**\n` +
              `• Provider: ${parsedSubscription.provider_name || 'Missing'}\n` +
              `• Amount: ${parsedSubscription.amount ? this.formatCurrency(parsedSubscription.amount, parsedSubscription.currency) : 'Missing'}\n` +
              `• Frequency: ${parsedSubscription.frequency || 'Missing'}`,
    };
  }

  /**
   * Generate confirmation message for uncertain subscriptions
   */
  private generateConfirmationMessage(parsedSubscription: any, userContext: UserContext): string {
    let message = `🔄 **Subscription Confirmation Needed**\n\n`;
    message += `I extracted these details from your message:\n\n`;
    
    if (parsedSubscription.provider_name) {
      message += `✅ **Provider:** ${parsedSubscription.provider_name}\n`;
    } else {
      message += `❓ **Provider:** Not specified\n`;
    }
    
    if (parsedSubscription.amount) {
      message += `✅ **Amount:** ${this.formatCurrency(parsedSubscription.amount, parsedSubscription.currency)}\n`;
    } else {
      message += `❓ **Amount:** Not specified\n`;
    }
    
    message += `📅 **Frequency:** ${parsedSubscription.frequency || 'monthly'}\n`;
    message += `💳 **Currency:** ${parsedSubscription.currency || userContext.preferences.currency}\n`;
    message += `📆 **Next payment:** ${parsedSubscription.payment_date ? new Date(parsedSubscription.payment_date).toLocaleDateString() : 'Next month'}\n\n`;
    
    message += `**Confidence:** ${Math.round(parsedSubscription.confidence * 100)}%\n\n`;
    
    if (parsedSubscription.validationErrors && parsedSubscription.validationErrors.length > 0) {
      message += `⚠️ **Issues found:**\n`;
      parsedSubscription.validationErrors.forEach((error: string) => {
        message += `• ${error}\n`;
      });
      message += `\n`;
    }
    
    message += `**Please confirm:**\n`;
    message += `• Reply "Yes" to add this subscription\n`;
    message += `• Reply "No" to cancel\n`;
    message += `• Or provide the missing/corrected information`;
    
    return message;
  }

  /**
   * Generate success message for created subscription
   */
  private generateSuccessMessage(subscription: Subscription, userContext: UserContext): string {
    const nextPayment = new Date(subscription.payment_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `✅ **Subscription Added Successfully!**\n\n` +
           `Your ${subscription.provider_name} subscription has been added:\n\n` +
           `🔄 **Provider:** ${subscription.provider_name}\n` +
           `💰 **Amount:** ${this.formatCurrency(subscription.amount, subscription.currency)}\n` +
           `📅 **Frequency:** ${subscription.frequency}\n` +
           `📆 **Next payment:** ${nextPayment}\n\n` +
           `**Subscription ID:** ${subscription.id}\n\n` +
           `🔔 I'll help you track this recurring expense and remind you about upcoming payments!`;
  }

  /**
   * Generate error message
   */
  private generateErrorMessage(error: any): string {
    const errorMessage = error?.message || 'Unknown error occurred';
    
    return `❌ **Subscription Failed**\n\n` +
           `Sorry, I couldn't save your subscription right now.\n\n` +
           `**Error:** ${errorMessage}\n\n` +
           `**What you can try:**\n` +
           `• Check your internet connection\n` +
           `• Try again in a few moments\n` +
           `• Make sure your account is properly linked\n\n` +
           `If the problem persists, please contact support.`;
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string = 'IDR'): string {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }
}