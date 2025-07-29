import { Transaction } from '@/services/transaction-ai-service';
import { Subscription, SubscriptionSummary } from '@/services/subscription-ai-service';
import { DashboardSummary } from '@/services/dashboard-ai-service';
import { UserContext } from '@/types/auth';
import { Logger } from '@/utils/logger';

// Telegram message constraints
const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
const TELEGRAM_MAX_CAPTION_LENGTH = 1024;
const TELEGRAM_SAFE_MESSAGE_LENGTH = 3800; // Leave buffer for formatting

export interface MessageFormatterOptions {
  maxLength?: number;
  includeEmojis?: boolean;
  compactMode?: boolean;
  currency?: string;
  language?: 'en' | 'id';
}

export class MessageFormatter {
  private logger = new Logger('MessageFormatter');

  constructor() {
    this.logger.info('Message Formatter initialized');
  }

  /**
   * Format a single transaction for display
   */
  public formatTransaction(
    transaction: Transaction, 
    options: MessageFormatterOptions = {}
  ): string {
    const { includeEmojis = true, currency = 'IDR', compactMode = false } = options;
    
    const amount = this.formatCurrency(transaction.amount, currency);
    const date = this.formatDate(transaction.date);
    const categoryEmoji = includeEmojis ? this.getCategoryEmoji(transaction.category) : '';
    
    if (compactMode) {
      return `${categoryEmoji} ${amount} - ${transaction.category} (${date})`;
    }
    
    let formatted = `${categoryEmoji} **${transaction.category}**\n`;
    formatted += `💰 ${amount}\n`;
    formatted += `📅 ${date}\n`;
    
    if (transaction.note) {
      formatted += `📝 ${transaction.note}\n`;
    }
    
    formatted += `🆔 ${transaction.id}`;
    
    return formatted;
  }

  /**
   * Format a list of transactions with pagination support
   */
  public formatTransactionList(
    transactions: Transaction[],
    options: MessageFormatterOptions = {}
  ): string {
    const { maxLength = TELEGRAM_SAFE_MESSAGE_LENGTH, currency = 'IDR', compactMode = false } = options;
    
    if (transactions.length === 0) {
      return this.formatEmptyTransactionList();
    }

    let message = `📝 **Recent Transactions** (${transactions.length})\n\n`;
    let currentLength = message.length;
    let includedTransactions = 0;
    
    for (const transaction of transactions) {
      const formattedTransaction = this.formatTransaction(transaction, { 
        ...options, 
        compactMode: true 
      });
      
      const transactionBlock = `${includedTransactions + 1}. ${formattedTransaction}\n\n`;
      
      if (currentLength + transactionBlock.length > maxLength) {
        break;
      }
      
      message += transactionBlock;
      currentLength += transactionBlock.length;
      includedTransactions++;
    }
    
    // Add summary
    const totalAmount = transactions.slice(0, includedTransactions)
      .reduce((sum, t) => sum + t.amount, 0);
    
    message += `📊 **Summary:**\n`;
    message += `• Showing ${includedTransactions} of ${transactions.length} transactions\n`;
    message += `• Total: ${this.formatCurrency(totalAmount, currency)}\n`;
    
    if (includedTransactions < transactions.length) {
      const remaining = transactions.length - includedTransactions;
      message += `• ${remaining} more transactions available\n`;
      message += `\n💡 Try: "show more transactions" or filter by category`;
    }
    
    return message.trim();
  }

  /**
   * Format dashboard summary with visual indicators
   */
  public formatDashboard(
    summary: DashboardSummary, 
    options: MessageFormatterOptions = {}
  ): string {
    const { currency = 'IDR', includeEmojis = true } = options;
    
    const todayChange = this.calculatePercentageChange(summary.spent_today, summary.spent_yesterday);
    const weekChange = this.calculatePercentageChange(summary.spent_this_week, summary.spent_last_week);
    const monthChange = this.calculatePercentageChange(summary.spent_this_month, summary.spent_last_month);

    let message = `📊 **Your Spending Dashboard**\n\n`;

    // Today vs Yesterday with visual indicator
    message += `**📅 Today vs Yesterday**\n`;
    message += `${this.createProgressBar(summary.spent_today, summary.spent_yesterday, 10)}\n`;
    message += `• Today: ${this.formatCurrency(summary.spent_today, currency)}\n`;
    message += `• Yesterday: ${this.formatCurrency(summary.spent_yesterday, currency)}\n`;
    message += `• Change: ${this.formatChangeIndicator(todayChange, includeEmojis)}\n\n`;

    // This Week vs Last Week
    message += `**📈 This Week vs Last Week**\n`;
    message += `${this.createProgressBar(summary.spent_this_week, summary.spent_last_week, 10)}\n`;
    message += `• This week: ${this.formatCurrency(summary.spent_this_week, currency)}\n`;
    message += `• Last week: ${this.formatCurrency(summary.spent_last_week, currency)}\n`;
    message += `• Change: ${this.formatChangeIndicator(weekChange, includeEmojis)}\n\n`;

    // This Month vs Last Month
    message += `**📆 This Month vs Last Month**\n`;
    message += `${this.createProgressBar(summary.spent_this_month, summary.spent_last_month, 10)}\n`;
    message += `• This month: ${this.formatCurrency(summary.spent_this_month, currency)}\n`;
    message += `• Last month: ${this.formatCurrency(summary.spent_last_month, currency)}\n`;
    message += `• Change: ${this.formatChangeIndicator(monthChange, includeEmojis)}\n\n`;

    // Quick insights with emojis
    message += `**💡 Quick Insights**\n`;
    if (Math.abs(todayChange) > 20) {
      const emoji = todayChange > 0 ? '📈' : '📉';
      message += `${emoji} Daily spending ${todayChange > 0 ? 'increased' : 'decreased'} significantly\n`;
    }
    
    if (Math.abs(weekChange) > 15) {
      const emoji = weekChange > 0 ? '⚠️' : '✅';
      message += `${emoji} Weekly spending trend ${weekChange > 0 ? 'up' : 'down'}\n`;
    }
    
    if (Math.abs(monthChange) > 10) {
      const emoji = monthChange > 0 ? '📊' : '🎯';
      message += `${emoji} Monthly spending ${monthChange > 0 ? 'growth' : 'optimization'}\n`;
    }

    message += `\n💬 Ask me for "spending insights" for personalized advice!`;

    return message;
  }

  /**
   * Format subscription list with organization and emojis
   */
  public formatSubscriptions(
    subscriptions: Subscription[], 
    summary?: SubscriptionSummary,
    options: MessageFormatterOptions = {}
  ): string {
    const { currency = 'IDR', maxLength = TELEGRAM_SAFE_MESSAGE_LENGTH } = options;
    
    if (subscriptions.length === 0) {
      return this.formatEmptySubscriptionList();
    }

    let message = `🔄 **Your Active Subscriptions** (${subscriptions.length})\n\n`;
    
    // Group by frequency for better organization
    const grouped = this.groupSubscriptionsByFrequency(subscriptions);
    let currentLength = message.length;
    
    const frequencies: Array<'monthly' | 'quarterly' | 'annually'> = ['monthly', 'quarterly', 'annually'];
    
    for (const freq of frequencies) {
      if (grouped[freq] && grouped[freq].length > 0) {
        const sectionHeader = `**${freq.charAt(0).toUpperCase() + freq.slice(1)} Subscriptions:**\n`;
        
        if (currentLength + sectionHeader.length > maxLength) break;
        
        message += sectionHeader;
        currentLength += sectionHeader.length;
        
        for (const subscription of grouped[freq]) {
          const subBlock = this.formatSingleSubscription(subscription, currency);
          
          if (currentLength + subBlock.length > maxLength) break;
          
          message += subBlock;
          currentLength += subBlock.length;
        }
        
        message += '\n';
        currentLength += 1;
      }
    }
    
    // Add summary if provided
    if (summary) {
      const summaryBlock = this.formatSubscriptionSummary(summary, currency);
      if (currentLength + summaryBlock.length <= maxLength) {
        message += summaryBlock;
      }
    }

    return message.trim();
  }

  /**
   * Format error messages with helpful guidance
   */
  public formatError(
    error: Error | string, 
    context?: string,
    options: MessageFormatterOptions = {}
  ): string {
    const { includeEmojis = true } = options;
    const emoji = includeEmojis ? '❌' : '';
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    let message = `${emoji} **Something went wrong**\n\n`;
    
    if (context) {
      message += `**Context:** ${context}\n`;
    }
    
    message += `**Error:** ${errorMessage}\n\n`;
    
    // Add helpful suggestions based on error type
    message += `**What you can try:**\n`;
    
    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
      message += `• Check your internet connection\n`;
      message += `• Try again in a few moments\n`;
    } else if (errorMessage.toLowerCase().includes('auth') || errorMessage.toLowerCase().includes('token')) {
      message += `• Check if your account is properly linked\n`;
      message += `• Try "account status" to verify connection\n`;
    } else if (errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit')) {
      message += `• Wait a moment before trying again\n`;
      message += `• You may be sending messages too quickly\n`;
    } else {
      message += `• Try rephrasing your request\n`;
      message += `• Use "help" to see available commands\n`;
    }
    
    message += `• Contact support if the problem persists\n\n`;
    message += `💡 **Tip:** Try using simpler commands or check "help" for guidance.`;
    
    return message;
  }

  /**
   * Format error with recovery suggestions
   */
  public formatErrorWithSuggestions(
    errorMessage: string,
    suggestions: string[],
    context?: string,
    options: MessageFormatterOptions = {}
  ): string {
    const { includeEmojis = true } = options;
    
    let formattedMessage = this.formatError(errorMessage, context, options);
    
    if (suggestions.length > 0) {
      formattedMessage += '\n\n**💡 Try this:**\n';
      suggestions.forEach((suggestion, index) => {
        const emoji = includeEmojis ? '• ' : `${index + 1}. `;
        formattedMessage += `${emoji}${suggestion}\n`;
      });
    }
    
    return this.ensureMessageLength(formattedMessage);
  }

  /**
   * Format retry notification
   */
  public formatRetryNotification(
    operation: string,
    attempt: number,
    maxAttempts: number,
    options: MessageFormatterOptions = {}
  ): string {
    const { includeEmojis = true } = options;
    const emoji = includeEmojis ? '🔄 ' : '';
    
    return `${emoji}Retrying ${operation}... (${attempt}/${maxAttempts})`;
  }

  /**
   * Format service unavailable message
   */
  public formatServiceUnavailable(
    serviceName: string,
    options: MessageFormatterOptions = {}
  ): string {
    const { includeEmojis = true } = options;
    const emoji = includeEmojis ? '🚫 ' : '';
    
    return `${emoji}**Service Temporarily Unavailable**\n\n` +
           `The ${serviceName} service is currently experiencing issues. ` +
           `Please try again in a few minutes.\n\n` +
           `If the problem persists, our team has been notified and is working on a fix.`;
  }

  /**
   * Format fallback response message
   */
  public formatFallbackResponse(
    originalOperation: string,
    fallbackMessage: string,
    options: MessageFormatterOptions = {}
  ): string {
    const { includeEmojis = true } = options;
    const emoji = includeEmojis ? '⚠️ ' : '';
    
    return `${emoji}**Limited Functionality**\n\n` +
           `Unable to complete ${originalOperation} normally, but here's what I can tell you:\n\n` +
           fallbackMessage;
  }

  /**
   * Ensure message length is within limits
   */
  private ensureMessageLength(message: string): string {
    if (message.length <= TELEGRAM_SAFE_MESSAGE_LENGTH) {
      return message;
    }
    
    // Truncate and add indicator
    const truncated = message.substring(0, TELEGRAM_SAFE_MESSAGE_LENGTH - 50);
    return truncated + '\n\n... (message truncated)';
  }

  /**
   * Split long messages into multiple parts
   */
  public splitLongMessage(
    message: string, 
    maxLength: number = TELEGRAM_SAFE_MESSAGE_LENGTH
  ): string[] {
    if (message.length <= maxLength) {
      return [message];
    }

    const parts: string[] = [];
    const lines = message.split('\n');
    let currentPart = '';
    
    for (const line of lines) {
      // If adding this line would exceed the limit
      if (currentPart.length + line.length + 1 > maxLength) {
        if (currentPart.trim()) {
          parts.push(currentPart.trim());
          currentPart = '';
        }
        
        // If a single line is too long, split it by sentences
        if (line.length > maxLength) {
          const sentences = line.split('. ');
          let currentSentence = '';
          
          for (const sentence of sentences) {
            if (currentSentence.length + sentence.length + 2 > maxLength) {
              if (currentSentence.trim()) {
                parts.push(currentSentence.trim() + '.');
                currentSentence = '';
              }
            }
            currentSentence += (currentSentence ? '. ' : '') + sentence;
          }
          
          if (currentSentence.trim()) {
            currentPart = currentSentence;
          }
        } else {
          currentPart = line;
        }
      } else {
        currentPart += (currentPart ? '\n' : '') + line;
      }
    }
    
    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }
    
    // Add continuation indicators
    return parts.map((part, index) => {
      if (parts.length > 1) {
        if (index === 0) {
          return part + '\n\n📄 *Continued...*';
        } else if (index === parts.length - 1) {
          return `📄 *...continued from previous message*\n\n` + part;
        } else {
          return `📄 *...continued (${index + 1}/${parts.length})*\n\n` + part + '\n\n📄 *Continued...*';
        }
      }
      return part;
    });
  }

  /**
   * Format help message with proper structure
   */
  public formatHelpMessage(
    isAuthenticated: boolean, 
    userContext?: UserContext,
    options: MessageFormatterOptions = {}
  ): string {
    const { includeEmojis = true, language = 'en' } = options;
    
    let message = `${includeEmojis ? '🤖' : ''} **Clair AI Assistant Help**\n\n`;
    
    if (isAuthenticated) {
      message += `**💸 Transaction Management:**\n`;
      message += `• "I spent 50000 on food today"\n`;
      message += `• "Add 25000 transportation expense"\n`;
      message += `• "Show my recent transactions"\n`;
      message += `• "Food expenses last week"\n\n`;
      
      message += `**📊 Dashboard & Insights:**\n`;
      message += `• "Show my spending summary"\n`;
      message += `• "How much did I spend this week?"\n`;
      message += `• "Give me spending insights"\n`;
      message += `• "Comprehensive analysis"\n\n`;
      
      message += `**🔄 Subscriptions:**\n`;
      message += `• "Show my subscriptions"\n`;
      message += `• "Add Netflix subscription 169000 monthly"\n`;
      message += `• "Subscription summary"\n`;
      message += `• "Upcoming payments"\n\n`;
      
      message += `**⚙️ Account Management:**\n`;
      message += `• "account status" - Check your link status\n`;
      message += `• "unlink account" - Remove account link\n\n`;
      
      message += `${includeEmojis ? '💬' : ''} **Natural Language:** Just talk naturally - I understand context and follow-up questions!\n\n`;
      
      if (userContext) {
        message += `**Your Settings:**\n`;
        message += `• Language: ${userContext.preferences.language}\n`;
        message += `• Currency: ${userContext.preferences.currency}\n`;
        message += `• Notifications: ${userContext.preferences.notifications ? 'On' : 'Off'}\n\n`;
      }
    } else {
      message += `**🔗 Getting Started:**\n`;
      message += `• "link account" - Connect your Clair account\n`;
      message += `• "demo link" - Try with demo data\n\n`;
      
      message += `**📚 What you can do after linking:**\n`;
      message += `• Add transactions by describing them naturally\n`;
      message += `• View spending summaries and insights\n`;
      message += `• Manage subscriptions conversationally\n`;
      message += `• Get personalized financial advice\n\n`;
      
      message += `**❓ Need help?**\n`;
      message += `• "help" - Show this message\n`;
      message += `• "account status" - Check link status\n\n`;
      
      message += `${includeEmojis ? '🚀' : ''} Ready to get started? Type "link account"!`;
    }
    
    return message;
  }

  // Private helper methods

  private formatEmptyTransactionList(): string {
    return `📝 **No Transactions Found**\n\n` +
           `You haven't recorded any transactions yet.\n\n` +
           `💡 **Get started by saying:**\n` +
           `• "I spent 50000 on food today"\n` +
           `• "Add 25000 transportation expense"\n` +
           `• "Bought coffee for 15000"\n\n` +
           `I'll help you track your spending! 💰`;
  }

  private formatEmptySubscriptionList(): string {
    return `🔄 **No Active Subscriptions**\n\n` +
           `You haven't added any subscriptions yet.\n\n` +
           `💡 **Add one by saying:**\n` +
           `• "Add Netflix subscription 169000 monthly"\n` +
           `• "I have Spotify premium 55000 per month"\n` +
           `• "Subscribe to YouTube Premium 79000 monthly"\n\n` +
           `I'll help you track recurring expenses! 📅`;
  }

  private formatSingleSubscription(subscription: Subscription, currency: string): string {
    const amount = this.formatCurrency(subscription.amount, subscription.currency);
    const nextPayment = this.formatDate(subscription.payment_date);
    const providerEmoji = this.getProviderEmoji(subscription.provider_name);
    
    return `${providerEmoji} **${subscription.provider_name}**\n` +
           `   💰 ${amount} • 📅 Next: ${nextPayment}\n\n`;
  }

  private formatSubscriptionSummary(summary: SubscriptionSummary, currency: string): string {
    const monthlyTotal = this.formatCurrency(summary.total_monthly_recurring, currency);
    const yearlyTotal = this.formatCurrency(summary.total_monthly_recurring * 12, currency);
    
    return `📊 **Summary:**\n` +
           `• ${summary.subscription_count} active subscriptions\n` +
           `• ${monthlyTotal}/month • ${yearlyTotal}/year\n` +
           `• Next month: ${this.formatCurrency(summary.upcoming_this_month, currency)}`;
  }

  private groupSubscriptionsByFrequency(subscriptions: Subscription[]): Record<string, Subscription[]> {
    return subscriptions.reduce((acc, sub) => {
      if (!acc[sub.frequency]) acc[sub.frequency] = [];
      acc[sub.frequency].push(sub);
      return acc;
    }, {} as Record<string, Subscription[]>);
  }

  private createProgressBar(current: number, previous: number, length: number = 10): string {
    const max = Math.max(current, previous);
    if (max === 0) return '░'.repeat(length);
    
    const currentBar = Math.round((current / max) * length);
    const previousBar = Math.round((previous / max) * length);
    
    let bar = '';
    for (let i = 0; i < length; i++) {
      if (i < Math.min(currentBar, previousBar)) {
        bar += '█';
      } else if (i < Math.max(currentBar, previousBar)) {
        bar += current > previous ? '▓' : '▒';
      } else {
        bar += '░';
      }
    }
    
    return bar;
  }

  private formatChangeIndicator(change: number, includeEmojis: boolean = true): string {
    const absChange = Math.abs(change);
    const emoji = includeEmojis ? (change > 0 ? '📈' : change < 0 ? '📉' : '➡️') : '';
    const direction = change > 0 ? '+' : '';
    
    return `${emoji} ${direction}${change.toFixed(1)}%`;
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private formatCurrency(amount: number, currency: string = 'IDR'): string {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'Food': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Housing': '🏠',
      'Utilities': '⚡',
      'Health': '🏥',
      'Education': '📚',
      'Travel': '✈️',
      'Insurance': '🛡️',
      'Investment': '📈',
      'Other': '📦',
    };
    
    return emojiMap[category] || '📦';
  }

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
}