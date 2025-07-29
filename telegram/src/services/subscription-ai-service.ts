import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { UserContext } from '@/types/auth';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';

// Subscription types (matching web models)
export interface Subscription {
  id: string;
  provider_name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  payment_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionCreateData {
  provider_name: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  payment_date: string;
}

export interface SubscriptionSummary {
  upcoming_this_month: number;
  total_monthly_recurring: number;
  subscription_count: number;
}

export interface ProjectedSubscription {
  id: string;
  provider_name: string;
  original_amount: number;
  original_currency: string;
  amount_in_idr: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  original_payment_date: string;
  projected_payment_date: string;
  user_id: string;
}

export interface ConsolidatedSubscriptionData {
  subscriptions: Subscription[];
  projected_subscriptions: ProjectedSubscription[];
  subscription_summary: SubscriptionSummary;
}

// Zod schema for AI subscription parsing
const ParsedSubscriptionSchema = z.object({
  provider_name: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('IDR'),
  frequency: z.enum(['monthly', 'quarterly', 'annually']),
  payment_date: z.string(),
  confidence: z.number().min(0).max(1),
  needsConfirmation: z.boolean(),
  extractedInfo: z.object({
    recognizedProvider: z.boolean(),
    dateSpecified: z.boolean(),
    amountClear: z.boolean(),
  }),
});

// Common subscription providers
const COMMON_PROVIDERS = [
  'Netflix', 'Spotify', 'YouTube Premium', 'Disney+', 'Amazon Prime',
  'Adobe Creative Cloud', 'Microsoft 365', 'iCloud+', 'Google One',
  'Canva Pro', 'Figma', 'Notion', 'Slack', 'Zoom',
  'GoFood+', 'GrabUnlimited', 'Vidio Premier', 'Viu Premium',
  'JOOX VIP', 'Langit Musik', 'Tinder Plus', 'Bumble Premium'
];

export class SubscriptionAIService {
  private model = openai(config.ai.model);
  private logger = new Logger('SubscriptionAI');

  constructor() {
    this.logger.info('Subscription AI Service initialized');
  }

  /**
   * Parse subscription details from natural language
   */
  public async parseSubscriptionFromText(text: string, userCurrency: string = 'IDR'): Promise<{
    provider_name: string;
    amount: number;
    currency: string;
    frequency: 'monthly' | 'quarterly' | 'annually';
    payment_date: string;
    confidence: number;
    needsConfirmation: boolean;
    validationErrors?: string[];
  }> {
    try {
      this.logger.debug(`Parsing subscription from text: ${text}`);

      const result = await generateObject({
        model: this.model,
        schema: ParsedSubscriptionSchema,
        prompt: this.buildSubscriptionParsingPrompt(text, userCurrency),
        temperature: 0.1,
      });

      const parsed = result.object;

      // Validate and enhance the parsed result
      const validatedSubscription = this.validateAndEnhanceParsedSubscription(parsed, text, userCurrency);

      this.logger.debug(`Parsed subscription - Provider: ${validatedSubscription.provider_name}, Amount: ${validatedSubscription.amount}`);

      return validatedSubscription;

    } catch (error) {
      this.logger.error('Error parsing subscription with AI:', error);
      return this.fallbackSubscriptionParsing(text, userCurrency);
    }
  }

  /**
   * Format subscription list for Telegram display
   */
  public formatSubscriptionList(subscriptions: Subscription[], currency: string = 'IDR'): string {
    if (subscriptions.length === 0) {
      return '🔄 **No Active Subscriptions**\n\n' +
             'You haven\'t added any subscriptions yet.\n\n' +
             '💡 **Add one by saying:**\n' +
             '• "Add Netflix subscription 169000 monthly"\n' +
             '• "I have Spotify premium 55000 per month"\n' +
             '• "Subscribe to YouTube Premium 79000 monthly"';
    }

    let formatted = `🔄 **Your Active Subscriptions** (${subscriptions.length})\n\n`;

    // Group by frequency for better organization
    const grouped = subscriptions.reduce((acc, sub) => {
      if (!acc[sub.frequency]) acc[sub.frequency] = [];
      acc[sub.frequency].push(sub);
      return acc;
    }, {} as Record<string, Subscription[]>);

    // Display monthly subscriptions first
    const frequencies: Array<'monthly' | 'quarterly' | 'annually'> = ['monthly', 'quarterly', 'annually'];
    
    frequencies.forEach(freq => {
      if (grouped[freq] && grouped[freq].length > 0) {
        formatted += `**${freq.charAt(0).toUpperCase() + freq.slice(1)} Subscriptions:**\n`;
        
        grouped[freq].forEach((subscription, index) => {
          const amount = this.formatCurrency(subscription.amount, subscription.currency);
          const nextPayment = new Date(subscription.payment_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          
          const providerEmoji = this.getProviderEmoji(subscription.provider_name);
          
          formatted += `${providerEmoji} **${subscription.provider_name}**\n`;
          formatted += `   💰 ${amount} • 📅 Next: ${nextPayment}\n\n`;
        });
      }
    });

    return formatted.trim();
  }

  /**
   * Format subscription summary
   */
  public formatSubscriptionSummary(
    summary: SubscriptionSummary, 
    subscriptions: Subscription[],
    currency: string = 'IDR'
  ): string {
    let message = `📊 **Subscription Summary**\n\n`;

    message += `📈 **Overview:**\n`;
    message += `• Active subscriptions: ${summary.subscription_count}\n`;
    message += `• Monthly recurring: ${this.formatCurrency(summary.total_monthly_recurring, currency)}\n`;
    message += `• Upcoming this month: ${this.formatCurrency(summary.upcoming_this_month, currency)}\n\n`;

    // Calculate yearly total
    const yearlyTotal = summary.total_monthly_recurring * 12;
    message += `📅 **Yearly Impact:**\n`;
    message += `• Total per year: ${this.formatCurrency(yearlyTotal, currency)}\n`;
    message += `• Average per day: ${this.formatCurrency(yearlyTotal / 365, currency)}\n\n`;

    // Top subscriptions by cost
    if (subscriptions.length > 0) {
      const sortedSubs = [...subscriptions]
        .sort((a, b) => this.getMonthlyEquivalent(b) - this.getMonthlyEquivalent(a))
        .slice(0, 3);

      message += `💸 **Most Expensive:**\n`;
      sortedSubs.forEach((sub, index) => {
        const monthlyAmount = this.getMonthlyEquivalent(sub);
        message += `${index + 1}. ${sub.provider_name}: ${this.formatCurrency(monthlyAmount, currency)}/month\n`;
      });
    }

    return message;
  }

  /**
   * Generate subscription insights and recommendations
   */
  public async generateSubscriptionInsights(
    subscriptions: Subscription[],
    summary: SubscriptionSummary,
    userContext: UserContext
  ): Promise<string> {
    try {
      if (subscriptions.length === 0) {
        return this.getNoSubscriptionsMessage();
      }

      const analysisData = this.prepareSubscriptionAnalysisData(subscriptions, summary);
      
      const prompt = `Analyze these subscription data and provide helpful insights:

${analysisData}

User Context:
- Currency: ${userContext.preferences.currency}
- Language: ${userContext.preferences.language}

Provide insights about:
1. Subscription spending patterns
2. Potential cost optimizations
3. Unused or underutilized subscriptions
4. Bundling opportunities
5. Seasonal subscription recommendations

Keep the response:
- Conversational and helpful
- Under 300 words
- Focused on actionable advice
- Appropriate for Indonesian context
- Use emojis for better readability`;

      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 400,
      });

      return `💡 **Subscription Insights**\n\n${result.text}`;

    } catch (error) {
      this.logger.error('Error generating subscription insights:', error);
      return this.generateBasicSubscriptionInsights(subscriptions, summary, userContext);
    }
  }

  /**
   * Get upcoming subscription payments
   */
  public getUpcomingPayments(subscriptions: Subscription[], days: number = 30): {
    upcoming: Array<{
      subscription: Subscription;
      daysUntil: number;
      amount: number;
    }>;
    message: string;
  } {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const upcoming = subscriptions
      .map(sub => {
        const paymentDate = new Date(sub.payment_date);
        const daysUntil = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          subscription: sub,
          daysUntil,
          amount: sub.amount,
        };
      })
      .filter(item => item.daysUntil >= 0 && item.daysUntil <= days)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    let message = `📅 **Upcoming Payments** (Next ${days} days)\n\n`;

    if (upcoming.length === 0) {
      message += `✅ No subscription payments due in the next ${days} days.\n\n`;
      message += `💡 **Tip:** Set reminders for your subscription renewals to avoid surprises!`;
    } else {
      upcoming.forEach(item => {
        const { subscription, daysUntil, amount } = item;
        const urgencyEmoji = daysUntil <= 3 ? '🔴' : daysUntil <= 7 ? '🟡' : '🟢';
        const dayText = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`;
        
        message += `${urgencyEmoji} **${subscription.provider_name}**\n`;
        message += `   💰 ${this.formatCurrency(amount, subscription.currency)} • ⏰ ${dayText}\n\n`;
      });

      const totalUpcoming = upcoming.reduce((sum, item) => sum + item.amount, 0);
      message += `📊 **Total upcoming:** ${this.formatCurrency(totalUpcoming, 'IDR')}`;
    }

    return { upcoming, message };
  }

  /**
   * Build subscription parsing prompt
   */
  private buildSubscriptionParsingPrompt(text: string, userCurrency: string): string {
    return `Parse subscription details from this natural language text: "${text}"

User's currency: ${userCurrency}
Common providers: ${COMMON_PROVIDERS.slice(0, 10).join(', ')}

Guidelines for parsing:
1. **Provider Name**: Extract service/app name
   - Recognize common providers: Netflix, Spotify, YouTube Premium, etc.
   - Handle variations: "YT Premium" → "YouTube Premium"
   - Indonesian services: GoFood+, GrabUnlimited, Vidio Premier
   
2. **Amount**: Extract subscription cost
   - For IDR: typically large numbers (50000, 169000, etc.)
   - Accept "k" suffix (55k = 55000)
   - Handle other currencies (USD, EUR, etc.)
   
3. **Frequency**: Determine billing cycle
   - "monthly", "per month", "bulanan" → monthly
   - "quarterly", "3 months" → quarterly  
   - "yearly", "annual", "tahunan" → annually
   - Default to monthly if unclear
   
4. **Payment Date**: Extract or estimate next payment
   - If specific date given, use it
   - If "today", use current date
   - If unclear, use current date + 1 month for monthly
   
5. **Currency**: Determine currency
   - Default to user's currency (${userCurrency})
   - Detect explicit currency mentions (USD, EUR, etc.)

6. **Confidence scoring**:
   - 0.9+: All details clear and recognized provider
   - 0.7-0.9: Most details clear, minor assumptions
   - 0.5-0.7: Some details unclear or unknown provider
   - <0.5: Very ambiguous, needs clarification

7. **Confirmation needed**: Set to true if:
   - Confidence < 0.8
   - Unknown provider
   - Unclear amount or frequency

Examples:
- "Netflix 169000 monthly" → provider: "Netflix", amount: 169000, frequency: "monthly", confidence: 0.95
- "Add Spotify premium 55k per month" → provider: "Spotify", amount: 55000, frequency: "monthly", confidence: 0.9
- "YouTube Premium subscription" → provider: "YouTube Premium", needs confirmation for amount/frequency

Return the parsed details with confidence assessment.`;
  }

  /**
   * Validate and enhance parsed subscription
   */
  private validateAndEnhanceParsedSubscription(
    parsed: any,
    originalText: string,
    userCurrency: string
  ): any {
    // Enhance provider name recognition
    let enhancedProvider = parsed.provider_name;
    const lowerProvider = enhancedProvider.toLowerCase();
    
    // Map common variations
    const providerMappings: Record<string, string> = {
      'yt premium': 'YouTube Premium',
      'youtube': 'YouTube Premium',
      'netflix': 'Netflix',
      'spotify': 'Spotify',
      'disney plus': 'Disney+',
      'disney+': 'Disney+',
      'amazon prime': 'Amazon Prime',
      'adobe': 'Adobe Creative Cloud',
      'microsoft': 'Microsoft 365',
      'office 365': 'Microsoft 365',
      'icloud': 'iCloud+',
      'google one': 'Google One',
      'canva': 'Canva Pro',
      'gofood': 'GoFood+',
      'grab unlimited': 'GrabUnlimited',
      'vidio': 'Vidio Premier',
    };

    if (providerMappings[lowerProvider]) {
      enhancedProvider = providerMappings[lowerProvider];
    }

    // Enhance payment date
    let enhancedPaymentDate = parsed.payment_date;
    if (!enhancedPaymentDate || enhancedPaymentDate.toLowerCase().includes('today')) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      enhancedPaymentDate = nextMonth.toISOString();
    }

    // Calculate final confidence
    let finalConfidence = parsed.confidence || 0.5;
    
    if (COMMON_PROVIDERS.includes(enhancedProvider)) {
      finalConfidence = Math.min(finalConfidence + 0.1, 1);
    }
    
    if (!parsed.amount || parsed.amount <= 0) {
      finalConfidence *= 0.5;
    }

    return {
      provider_name: enhancedProvider,
      amount: parsed.amount || 0,
      currency: parsed.currency || userCurrency,
      frequency: parsed.frequency || 'monthly',
      payment_date: enhancedPaymentDate,
      confidence: finalConfidence,
      needsConfirmation: finalConfidence < 0.8 || !parsed.amount || parsed.amount <= 0,
      validationErrors: [],
    };
  }

  /**
   * Fallback subscription parsing
   */
  private fallbackSubscriptionParsing(text: string, userCurrency: string): any {
    const lowerText = text.toLowerCase();
    
    // Simple regex patterns for fallback
    const amountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0;
    
    let provider = 'Unknown Service';
    for (const commonProvider of COMMON_PROVIDERS) {
      if (lowerText.includes(commonProvider.toLowerCase())) {
        provider = commonProvider;
        break;
      }
    }

    let frequency: 'monthly' | 'quarterly' | 'annually' = 'monthly';
    if (lowerText.includes('annual') || lowerText.includes('yearly') || lowerText.includes('tahunan')) {
      frequency = 'annually';
    } else if (lowerText.includes('quarter') || lowerText.includes('3 month')) {
      frequency = 'quarterly';
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      provider_name: provider,
      amount,
      currency: userCurrency,
      frequency,
      payment_date: nextMonth.toISOString(),
      confidence: 0.4,
      needsConfirmation: true,
    };
  }

  /**
   * Prepare subscription analysis data
   */
  private prepareSubscriptionAnalysisData(subscriptions: Subscription[], summary: SubscriptionSummary): string {
    const totalMonthly = summary.total_monthly_recurring;
    const totalYearly = totalMonthly * 12;
    
    const categoryBreakdown = subscriptions.reduce((acc, sub) => {
      const category = this.categorizeProvider(sub.provider_name);
      acc[category] = (acc[category] || 0) + this.getMonthlyEquivalent(sub);
      return acc;
    }, {} as Record<string, number>);

    return `Subscription Summary:
- Total subscriptions: ${summary.subscription_count}
- Monthly recurring: ${totalMonthly}
- Yearly total: ${totalYearly}
- Upcoming this month: ${summary.upcoming_this_month}

Subscriptions by category:
${Object.entries(categoryBreakdown)
  .sort(([,a], [,b]) => b - a)
  .map(([cat, amt]) => `- ${cat}: ${amt}`)
  .join('\n')}

Individual subscriptions:
${subscriptions.map(sub => 
  `- ${sub.provider_name}: ${sub.amount} ${sub.currency} (${sub.frequency})`
).join('\n')}`;
  }

  /**
   * Generate basic subscription insights
   */
  private generateBasicSubscriptionInsights(
    subscriptions: Subscription[],
    summary: SubscriptionSummary,
    userContext: UserContext
  ): string {
    const currency = userContext.preferences.currency;
    const totalYearly = summary.total_monthly_recurring * 12;
    
    const mostExpensive = subscriptions
      .sort((a, b) => this.getMonthlyEquivalent(b) - this.getMonthlyEquivalent(a))[0];

    let message = `💡 **Subscription Insights**\n\n`;
    
    message += `📊 **Key Numbers:**\n`;
    message += `• ${summary.subscription_count} active subscriptions\n`;
    message += `• ${this.formatCurrency(summary.total_monthly_recurring, currency)}/month\n`;
    message += `• ${this.formatCurrency(totalYearly, currency)}/year\n\n`;
    
    if (mostExpensive) {
      const monthlyEquiv = this.getMonthlyEquivalent(mostExpensive);
      message += `💸 **Highest cost:** ${mostExpensive.provider_name} (${this.formatCurrency(monthlyEquiv, currency)}/month)\n\n`;
    }
    
    message += `💡 **Tips:**\n`;
    if (summary.subscription_count > 5) {
      message += `• Consider reviewing all ${summary.subscription_count} subscriptions\n`;
    }
    if (totalYearly > 2000000) { // 2M IDR per year
      message += `• Look for bundling opportunities to save money\n`;
    }
    message += `• Set calendar reminders for renewal dates\n`;
    message += `• Cancel unused subscriptions to optimize spending`;

    return message;
  }

  /**
   * Get no subscriptions message
   */
  private getNoSubscriptionsMessage(): string {
    return `🔄 **No Subscriptions to Analyze**\n\n` +
           `You haven't added any subscriptions yet.\n\n` +
           `💡 **Get started by adding subscriptions:**\n` +
           `• "Add Netflix subscription 169000 monthly"\n` +
           `• "I have Spotify premium 55000 per month"\n` +
           `• "Subscribe to YouTube Premium 79000 monthly"\n\n` +
           `Once you add subscriptions, I can provide insights about:\n` +
           `• Cost optimization opportunities\n` +
           `• Spending patterns and trends\n` +
           `• Bundling recommendations\n` +
           `• Payment reminders and alerts`;
  }

  /**
   * Get monthly equivalent amount
   */
  private getMonthlyEquivalent(subscription: Subscription): number {
    switch (subscription.frequency) {
      case 'monthly':
        return subscription.amount;
      case 'quarterly':
        return subscription.amount / 3;
      case 'annually':
        return subscription.amount / 12;
      default:
        return subscription.amount;
    }
  }

  /**
   * Categorize provider for analysis
   */
  private categorizeProvider(providerName: string): string {
    const lower = providerName.toLowerCase();
    
    if (lower.includes('netflix') || lower.includes('disney') || lower.includes('youtube') || lower.includes('vidio')) {
      return 'Entertainment';
    }
    if (lower.includes('spotify') || lower.includes('joox') || lower.includes('langit')) {
      return 'Music';
    }
    if (lower.includes('adobe') || lower.includes('canva') || lower.includes('figma')) {
      return 'Creative Tools';
    }
    if (lower.includes('microsoft') || lower.includes('google') || lower.includes('icloud')) {
      return 'Productivity';
    }
    if (lower.includes('gofood') || lower.includes('grab')) {
      return 'Food & Transport';
    }
    
    return 'Other';
  }

  /**
   * Get provider emoji
   */
  private getProviderEmoji(providerName: string): string {
    const lower = providerName.toLowerCase();
    
    const emojiMap: Record<string, string> = {
      'netflix': '🎬',
      'spotify': '🎵',
      'youtube': '📺',
      'disney': '🏰',
      'amazon': '📦',
      'adobe': '🎨',
      'microsoft': '💼',
      'google': '☁️',
      'icloud': '☁️',
      'canva': '🎨',
      'gofood': '🍔',
      'grab': '🚗',
      'vidio': '📺',
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (lower.includes(key)) {
        return emoji;
      }
    }
    
    return '🔄';
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