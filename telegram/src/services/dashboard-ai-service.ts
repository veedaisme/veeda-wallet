import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { UserContext } from '@/types/auth';
import { Transaction } from './transaction-ai-service';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';

// Dashboard types (matching web types)
export interface DashboardSummary {
  spent_today: number;
  spent_yesterday: number;
  spent_this_week: number;
  spent_last_week: number;
  spent_this_month: number;
  spent_last_month: number;
}

export interface ChartDataPoint {
  date: string;
  amount: number;
}

export interface SpendingInsight {
  type: 'trend' | 'category' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  actionable: boolean;
  suggestion?: string;
}

// Mock MCP client for dashboard data
class MockDashboardMCPClient {
  private logger = new Logger('MockDashboardMCP');

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    this.logger.info(`MCP: Fetching dashboard summary for user ${userId}`);

    // Simulate MCP call delay
    await this.sleep(200);

    // Mock dashboard data (in real implementation, this comes from Supabase via MCP)
    const mockSummary: DashboardSummary = {
      spent_today: 125000,
      spent_yesterday: 85000,
      spent_this_week: 750000,
      spent_last_week: 650000,
      spent_this_month: 2500000,
      spent_last_month: 2200000,
    };

    this.logger.info('MCP: Dashboard summary retrieved');
    return mockSummary;
  }

  async getWeeklyChart(userId: string, startDate: string, endDate: string): Promise<ChartDataPoint[]> {
    this.logger.info(`MCP: Fetching weekly chart data for user ${userId}`);

    await this.sleep(150);

    // Mock weekly chart data
    const mockChartData: ChartDataPoint[] = [
      { date: '2025-01-13', amount: 95000 },
      { date: '2025-01-14', amount: 120000 },
      { date: '2025-01-15', amount: 85000 },
      { date: '2025-01-16', amount: 150000 },
      { date: '2025-01-17', amount: 110000 },
      { date: '2025-01-18', amount: 125000 },
      { date: '2025-01-19', amount: 65000 },
    ];

    return mockChartData;
  }

  async getMonthlyChart(userId: string, startDate: string, endDate: string): Promise<ChartDataPoint[]> {
    this.logger.info(`MCP: Fetching monthly chart data for user ${userId}`);

    await this.sleep(150);

    // Mock monthly chart data
    const mockChartData: ChartDataPoint[] = [
      { date: '2024-12-01', amount: 2200000 },
      { date: '2025-01-01', amount: 2500000 },
    ];

    return mockChartData;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class DashboardAIService {
  private mcpClient: MockDashboardMCPClient;
  private model = openai(config.ai.model);
  private logger = new Logger('DashboardAI');

  constructor() {
    this.mcpClient = new MockDashboardMCPClient();
    this.logger.info('Dashboard AI Service initialized');
  }

  /**
   * Get and format dashboard summary
   */
  public async getDashboardSummary(userContext: UserContext): Promise<{
    success: boolean;
    summary?: DashboardSummary;
    message: string;
  }> {
    try {
      this.logger.info(`Fetching dashboard summary for user ${userContext.userId}`);

      const summary = await this.mcpClient.getDashboardSummary(userContext.userId);
      const formattedMessage = this.formatDashboardSummary(summary, userContext.preferences.currency);

      return {
        success: true,
        summary,
        message: formattedMessage,
      };

    } catch (error) {
      this.logger.error('Error fetching dashboard summary:', error);
      return {
        success: false,
        message: '❌ Sorry, I couldn\'t fetch your dashboard data right now. Please try again later.',
      };
    }
  }

  /**
   * Format dashboard summary for Telegram display
   */
  public formatDashboardSummary(summary: DashboardSummary, currency: string = 'IDR'): string {
    const todayChange = this.calculatePercentageChange(summary.spent_today, summary.spent_yesterday);
    const weekChange = this.calculatePercentageChange(summary.spent_this_week, summary.spent_last_week);
    const monthChange = this.calculatePercentageChange(summary.spent_this_month, summary.spent_last_month);

    let message = `📊 **Your Spending Dashboard**\n\n`;

    // Today vs Yesterday
    message += `**📅 Today vs Yesterday**\n`;
    message += `• Today: ${this.formatCurrency(summary.spent_today, currency)}\n`;
    message += `• Yesterday: ${this.formatCurrency(summary.spent_yesterday, currency)}\n`;
    message += `• Change: ${this.formatChangeIndicator(todayChange)}\n\n`;

    // This Week vs Last Week
    message += `**📈 This Week vs Last Week**\n`;
    message += `• This week: ${this.formatCurrency(summary.spent_this_week, currency)}\n`;
    message += `• Last week: ${this.formatCurrency(summary.spent_last_week, currency)}\n`;
    message += `• Change: ${this.formatChangeIndicator(weekChange)}\n\n`;

    // This Month vs Last Month
    message += `**📆 This Month vs Last Month**\n`;
    message += `• This month: ${this.formatCurrency(summary.spent_this_month, currency)}\n`;
    message += `• Last month: ${this.formatCurrency(summary.spent_last_month, currency)}\n`;
    message += `• Change: ${this.formatChangeIndicator(monthChange)}\n\n`;

    // Quick insights
    message += `**💡 Quick Insights**\n`;
    if (todayChange > 20) {
      message += `• 📈 You're spending more today than yesterday\n`;
    } else if (todayChange < -20) {
      message += `• 📉 You're spending less today than yesterday\n`;
    }

    if (weekChange > 15) {
      message += `• ⚠️ Weekly spending is up significantly\n`;
    } else if (weekChange < -15) {
      message += `• ✅ Great job reducing weekly spending!\n`;
    }

    if (monthChange > 10) {
      message += `• 📊 Monthly spending has increased\n`;
    }

    message += `\n💬 Ask me for "spending insights" to get personalized advice!`;

    return message;
  }

  /**
   * Generate AI-powered spending insights
   */
  public async generateSpendingInsights(
    summary: DashboardSummary,
    transactions: Transaction[],
    userContext: UserContext
  ): Promise<string> {
    try {
      this.logger.info(`Generating AI insights for user ${userContext.userId}`);

      // Prepare data for AI analysis
      const analysisData = this.prepareInsightData(summary, transactions);

      const prompt = this.buildInsightPrompt(analysisData, userContext);

      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 500,
      });

      return `💡 **AI-Powered Spending Insights**\n\n${result.text}\n\n` +
        `📊 Want more details? Ask me about specific categories or time periods!`;

    } catch (error) {
      this.logger.error('Error generating AI insights:', error);
      return this.generateBasicInsights(summary, transactions, userContext);
    }
  }

  /**
   * Generate personalized financial advice
   */
  public async generatePersonalizedAdvice(
    userContext: UserContext,
    summary: DashboardSummary,
    transactions: Transaction[]
  ): Promise<string> {
    try {
      const categoryAnalysis = this.analyzeCategorySpending(transactions);
      const trendAnalysis = this.analyzeTrends(summary);

      const prompt = `As a friendly financial advisor, provide personalized advice based on this user's spending data:

User Profile:
- Currency: ${userContext.preferences.currency}
- Language: ${userContext.preferences.language}

Spending Summary:
- Today: ${summary.spent_today}
- This week: ${summary.spent_this_week}  
- This month: ${summary.spent_this_month}

Category Breakdown:
${Object.entries(categoryAnalysis).map(([cat, amt]) => `- ${cat}: ${amt}`).join('\n')}

Trends:
${trendAnalysis.join('\n')}

Provide 3-4 actionable recommendations that are:
1. Specific and practical
2. Encouraging and supportive
3. Culturally appropriate for Indonesian context
4. Focused on sustainable habits

Keep the tone conversational and supportive. Use emojis appropriately.`;

      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.8,
        maxTokens: 400,
      });

      return `🎯 **Personalized Financial Advice**\n\n${result.text}`;

    } catch (error) {
      this.logger.error('Error generating personalized advice:', error);
      return this.generateBasicAdvice(summary, userContext);
    }
  }

  /**
   * Get spending visualization in text format
   */
  public async getSpendingVisualization(
    userContext: UserContext,
    period: 'weekly' | 'monthly' = 'weekly'
  ): Promise<string> {
    try {
      const endDate = new Date().toISOString();
      const startDate = period === 'weekly'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const chartData = period === 'weekly'
        ? await this.mcpClient.getWeeklyChart(userContext.userId, startDate, endDate)
        : await this.mcpClient.getMonthlyChart(userContext.userId, startDate, endDate);

      return this.formatChartData(chartData, period, userContext.preferences.currency);

    } catch (error) {
      this.logger.error('Error getting spending visualization:', error);
      return '❌ Sorry, I couldn\'t generate the spending visualization right now.';
    }
  }

  /**
   * Format chart data for text display
   */
  private formatChartData(data: ChartDataPoint[], period: 'weekly' | 'monthly', currency: string): string {
    if (data.length === 0) {
      return `📈 **${period.charAt(0).toUpperCase() + period.slice(1)} Spending Chart**\n\nNo data available for this period.`;
    }

    const maxAmount = Math.max(...data.map(d => d.amount));
    const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
    const avgAmount = totalAmount / data.length;

    let message = `📈 **${period.charAt(0).toUpperCase() + period.slice(1)} Spending Chart**\n\n`;

    data.forEach((point, index) => {
      const date = new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const amount = this.formatCurrency(point.amount, currency);
      const barLength = Math.round((point.amount / maxAmount) * 10);
      const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);

      message += `${date}: ${bar} ${amount}\n`;
    });

    message += `\n📊 **Summary:**\n`;
    message += `• Total: ${this.formatCurrency(totalAmount, currency)}\n`;
    message += `• Average: ${this.formatCurrency(avgAmount, currency)}\n`;
    message += `• Highest: ${this.formatCurrency(maxAmount, currency)}\n`;

    return message;
  }

  /**
   * Prepare data for AI insight analysis
   */
  private prepareInsightData(summary: DashboardSummary, transactions: Transaction[]): string {
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return `Spending Summary:
- Today: ${summary.spent_today} vs Yesterday: ${summary.spent_yesterday}
- This week: ${summary.spent_this_week} vs Last week: ${summary.spent_last_week}
- This month: ${summary.spent_this_month} vs Last month: ${summary.spent_last_month}
- Total transactions: ${transactions.length}
- Top categories: ${topCategories.map(([cat, amt]) => `${cat}: ${amt}`).join(', ')}`;
  }

  /**
   * Build AI prompt for insights
   */
  private buildInsightPrompt(analysisData: string, userContext: UserContext): string {
    return `Analyze this user's spending data and provide helpful financial insights:

${analysisData}

User Context:
- Currency: ${userContext.preferences.currency}
- Language: ${userContext.preferences.language}

Provide insights about:
1. Spending trends and patterns
2. Notable changes or anomalies
3. Category-specific observations
4. Actionable recommendations

Keep the response:
- Conversational and friendly
- Under 300 words
- Focused on actionable insights
- Appropriate for Indonesian financial context
- Use emojis for better readability

Focus on positive reinforcement and practical advice.`;
  }

  /**
   * Analyze category spending
   */
  private analyzeCategorySpending(transactions: Transaction[]): Record<string, number> {
    return transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Analyze spending trends
   */
  private analyzeTrends(summary: DashboardSummary): string[] {
    const trends: string[] = [];

    const todayChange = this.calculatePercentageChange(summary.spent_today, summary.spent_yesterday);
    const weekChange = this.calculatePercentageChange(summary.spent_this_week, summary.spent_last_week);
    const monthChange = this.calculatePercentageChange(summary.spent_this_month, summary.spent_last_month);

    if (Math.abs(todayChange) > 20) {
      trends.push(`Daily spending ${todayChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(todayChange).toFixed(1)}%`);
    }

    if (Math.abs(weekChange) > 15) {
      trends.push(`Weekly spending ${weekChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(weekChange).toFixed(1)}%`);
    }

    if (Math.abs(monthChange) > 10) {
      trends.push(`Monthly spending ${monthChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(monthChange).toFixed(1)}%`);
    }

    return trends;
  }

  /**
   * Generate basic insights when AI fails
   */
  private generateBasicInsights(summary: DashboardSummary, transactions: Transaction[], userContext: UserContext): string {
    const currency = userContext.preferences.currency;
    const todayChange = this.calculatePercentageChange(summary.spent_today, summary.spent_yesterday);
    const weekChange = this.calculatePercentageChange(summary.spent_this_week, summary.spent_last_week);

    const categoryTotals = this.analyzeCategorySpending(transactions);
    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];

    let message = `💡 **Spending Insights**\n\n`;

    message += `📊 **Key Observations:**\n`;
    message += `• Today you spent ${this.formatCurrency(summary.spent_today, currency)}\n`;
    message += `• That's ${Math.abs(todayChange).toFixed(1)}% ${todayChange > 0 ? 'more' : 'less'} than yesterday\n`;
    message += `• Weekly spending is ${Math.abs(weekChange).toFixed(1)}% ${weekChange > 0 ? 'higher' : 'lower'}\n\n`;

    if (topCategory) {
      message += `🏆 **Top category:** ${topCategory[0]} (${this.formatCurrency(topCategory[1], currency)})\n\n`;
    }

    message += `💡 **Tips:**\n`;
    if (todayChange > 20) {
      message += `• Consider reviewing today's expenses\n`;
    }
    if (weekChange > 15) {
      message += `• Weekly spending is trending up - good time to budget\n`;
    }
    message += `• Keep tracking to maintain awareness! 📈`;

    return message;
  }

  /**
   * Generate basic advice when AI fails
   */
  private generateBasicAdvice(summary: DashboardSummary, userContext: UserContext): string {
    const currency = userContext.preferences.currency;
    const monthlyAvg = summary.spent_this_month / new Date().getDate();

    return `🎯 **Financial Advice**\n\n` +
      `📊 **Your current pace:**\n` +
      `• Daily average this month: ${this.formatCurrency(monthlyAvg, currency)}\n` +
      `• This month total: ${this.formatCurrency(summary.spent_this_month, currency)}\n\n` +
      `💡 **Recommendations:**\n` +
      `• Track expenses daily for better awareness\n` +
      `• Set weekly spending targets\n` +
      `• Review and categorize large expenses\n` +
      `• Consider the 50/30/20 budgeting rule\n\n` +
      `🎉 Keep up the great work tracking your finances!`;
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Format change indicator with emoji
   */
  private formatChangeIndicator(change: number): string {
    const absChange = Math.abs(change);
    const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
    const direction = change > 0 ? '+' : '';

    return `${emoji} ${direction}${change.toFixed(1)}%`;
  }

  /**
   * Format currency based on user preferences
   */
  private formatCurrency(amount: number, currency: string = 'IDR'): string {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }
}