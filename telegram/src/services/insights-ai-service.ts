import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { UserContext } from '@/types/auth';
import { Transaction } from './transaction-ai-service';
import { DashboardSummary } from './dashboard-ai-service';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';

// Insight analysis schemas
const SpendingPatternSchema = z.object({
  pattern_type: z.enum(['increasing', 'decreasing', 'stable', 'volatile']),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  timeframe: z.string(),
});

const CategoryInsightSchema = z.object({
  category: z.string(),
  trend: z.enum(['up', 'down', 'stable']),
  percentage_of_total: z.number(),
  recommendation: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

const BudgetRecommendationSchema = z.object({
  category: z.string(),
  current_spending: z.number(),
  recommended_budget: z.number(),
  reasoning: z.string(),
  difficulty: z.enum(['easy', 'moderate', 'challenging']),
});

const FinancialHealthSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.enum(['excellent', 'good', 'fair', 'needs_improvement']),
  key_strengths: z.array(z.string()),
  areas_for_improvement: z.array(z.string()),
  next_steps: z.array(z.string()),
});

export interface SpendingAnalysis {
  patterns: any[];
  categoryInsights: any[];
  budgetRecommendations: any[];
  financialHealth: any;
  anomalies: string[];
  trends: string[];
}

export class InsightsAIService {
  private model = openai(config.ai.model);
  private logger = new Logger('InsightsAI');

  constructor() {
    this.logger.info('Insights AI Service initialized');
  }

  /**
   * Generate comprehensive spending analysis
   */
  public async generateComprehensiveAnalysis(
    transactions: Transaction[],
    summary: DashboardSummary,
    userContext: UserContext
  ): Promise<{
    success: boolean;
    analysis?: SpendingAnalysis;
    message: string;
  }> {
    try {
      this.logger.info(`Generating comprehensive analysis for user ${userContext.userId}`);

      if (transactions.length < 3) {
        return {
          success: true,
          message: this.getInsufficientDataMessage(),
        };
      }

      // Analyze spending patterns
      const patterns = await this.analyzeSpendingPatterns(transactions, summary);

      // Analyze category insights
      const categoryInsights = await this.analyzeCategoryInsights(transactions);

      // Generate budget recommendations
      const budgetRecommendations = await this.generateBudgetRecommendations(transactions, userContext);

      // Assess financial health
      const financialHealth = await this.assessFinancialHealth(transactions, summary, userContext);

      // Detect anomalies
      const anomalies = this.detectSpendingAnomalies(transactions);

      // Identify trends
      const trends = this.identifySpendingTrends(summary);

      const analysis: SpendingAnalysis = {
        patterns,
        categoryInsights,
        budgetRecommendations,
        financialHealth,
        anomalies,
        trends,
      };

      const message = await this.formatComprehensiveAnalysis(analysis, userContext);

      return {
        success: true,
        analysis,
        message,
      };

    } catch (error) {
      this.logger.error('Error generating comprehensive analysis:', error);
      return {
        success: false,
        message: '❌ Sorry, I couldn\'t generate the analysis right now. Please try again later.',
      };
    }
  }

  /**
   * Generate personalized spending recommendations
   */
  public async generatePersonalizedRecommendations(
    transactions: Transaction[],
    summary: DashboardSummary,
    userContext: UserContext
  ): Promise<string> {
    try {
      const analysisData = this.prepareAnalysisData(transactions, summary);

      const prompt = `As an expert financial advisor, analyze this user's spending data and provide personalized recommendations:

${analysisData}

User Profile:
- Currency: ${userContext.preferences.currency}
- Language: ${userContext.preferences.language}
- Notifications enabled: ${userContext.preferences.notifications}

Please provide:
1. 3-4 specific, actionable recommendations
2. Priority level for each recommendation (High/Medium/Low)
3. Expected impact and timeline
4. Practical steps to implement

Consider:
- Indonesian financial context and culture
- Realistic and sustainable changes
- User's current spending patterns
- Positive reinforcement approach

Format as a friendly, encouraging message with clear action items.
Use emojis appropriately and keep under 400 words.`;

      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 500,
      });

      return `🎯 **Personalized Recommendations**\n\n${result.text}`;

    } catch (error) {
      this.logger.error('Error generating personalized recommendations:', error);
      return this.generateBasicRecommendations(transactions, summary, userContext);
    }
  }

  /**
   * Analyze spending patterns using AI
   */
  private async analyzeSpendingPatterns(
    transactions: Transaction[],
    summary: DashboardSummary
  ): Promise<any[]> {
    try {
      const recentTransactions = transactions.slice(0, 10);
      const transactionData = recentTransactions.map(t => ({
        amount: t.amount,
        category: t.category,
        date: t.date,
      }));

      const prompt = `Analyze these recent transactions and identify spending patterns:

${JSON.stringify(transactionData, null, 2)}

Dashboard Summary:
- Today: ${summary.spent_today}
- This week: ${summary.spent_this_week}
- This month: ${summary.spent_this_month}

Identify patterns such as:
- Increasing/decreasing trends
- Cyclical patterns
- Category-specific patterns
- Unusual spending behavior

Return analysis for the most significant patterns found.`;

      const result = await generateObject({
        model: this.model,
        schema: z.array(SpendingPatternSchema),
        prompt,
        temperature: 0.3,
      });

      return result.object;

    } catch (error) {
      this.logger.error('Error analyzing spending patterns:', error);
      return [];
    }
  }

  /**
   * Analyze category-specific insights
   */
  private async analyzeCategoryInsights(transactions: Transaction[]): Promise<any[]> {
    try {
      const categoryTotals = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      const totalSpending = Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0);

      const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpending) * 100,
      }));

      const prompt = `Analyze these spending categories and provide insights:

${JSON.stringify(categoryData, null, 2)}

For each significant category (>5% of total), provide:
- Trend assessment (up/down/stable)
- Percentage of total spending
- Specific recommendation
- Priority level for optimization

Focus on categories with highest impact potential.`;

      const result = await generateObject({
        model: this.model,
        schema: z.array(CategoryInsightSchema),
        prompt,
        temperature: 0.4,
      });

      return result.object;

    } catch (error) {
      this.logger.error('Error analyzing category insights:', error);
      return [];
    }
  }

  /**
   * Generate budget recommendations
   */
  private async generateBudgetRecommendations(
    transactions: Transaction[],
    userContext: UserContext
  ): Promise<any[]> {
    try {
      const categoryTotals = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      const monthlyEstimates = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        current_monthly: amount,
        transaction_count: transactions.filter(t => t.category === category).length,
      }));

      const prompt = `Based on this spending data, recommend monthly budgets:

${JSON.stringify(monthlyEstimates, null, 2)}

User currency: ${userContext.preferences.currency}

For each category, suggest:
- Realistic monthly budget
- Reasoning for the recommendation
- Implementation difficulty (easy/moderate/challenging)

Consider:
- Indonesian cost of living
- Sustainable budget targets
- Room for occasional treats
- Emergency buffer

Focus on categories with highest optimization potential.`;

      const result = await generateObject({
        model: this.model,
        schema: z.array(BudgetRecommendationSchema),
        prompt,
        temperature: 0.5,
      });

      return result.object;

    } catch (error) {
      this.logger.error('Error generating budget recommendations:', error);
      return [];
    }
  }

  /**
   * Assess overall financial health
   */
  private async assessFinancialHealth(
    transactions: Transaction[],
    summary: DashboardSummary,
    userContext: UserContext
  ): Promise<any> {
    try {
      const analysisData = this.prepareAnalysisData(transactions, summary);

      const prompt = `Assess the financial health based on this spending data:

${analysisData}

Provide a financial health assessment with:
- Overall score (0-100)
- Health level (excellent/good/fair/needs_improvement)
- Key strengths (what they're doing well)
- Areas for improvement
- Next steps to improve financial health

Consider:
- Spending consistency
- Category balance
- Trend direction
- Transaction frequency
- Amount variations

Be encouraging and focus on actionable improvements.`;

      const result = await generateObject({
        model: this.model,
        schema: FinancialHealthSchema,
        prompt,
        temperature: 0.6,
      });

      return result.object;

    } catch (error) {
      this.logger.error('Error assessing financial health:', error);
      return {
        score: 70,
        level: 'good',
        key_strengths: ['Regular expense tracking'],
        areas_for_improvement: ['Budget planning'],
        next_steps: ['Set monthly budgets'],
      };
    }
  }

  /**
   * Detect spending anomalies
   */
  private detectSpendingAnomalies(transactions: Transaction[]): string[] {
    const anomalies: string[] = [];

    if (transactions.length < 5) return anomalies;

    // Calculate average transaction amount
    const amounts = transactions.map(t => t.amount);
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    // Detect unusually large transactions
    if (maxAmount > avgAmount * 3) {
      const largeTransaction = transactions.find(t => t.amount === maxAmount);
      anomalies.push(`Unusually large ${largeTransaction?.category} expense: ${this.formatCurrency(maxAmount)}`);
    }

    // Detect category concentration
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalSpending = Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0);
    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];

    if (topCategory && (topCategory[1] / totalSpending) > 0.6) {
      anomalies.push(`High concentration in ${topCategory[0]} category (${Math.round((topCategory[1] / totalSpending) * 100)}% of spending)`);
    }

    return anomalies;
  }

  /**
   * Identify spending trends
   */
  private identifySpendingTrends(summary: DashboardSummary): string[] {
    const trends: string[] = [];

    const todayChange = this.calculatePercentageChange(summary.spent_today, summary.spent_yesterday);
    const weekChange = this.calculatePercentageChange(summary.spent_this_week, summary.spent_last_week);
    const monthChange = this.calculatePercentageChange(summary.spent_this_month, summary.spent_last_month);

    if (Math.abs(todayChange) > 25) {
      trends.push(`Daily spending ${todayChange > 0 ? 'spike' : 'drop'}: ${Math.abs(todayChange).toFixed(1)}%`);
    }

    if (Math.abs(weekChange) > 20) {
      trends.push(`Weekly spending ${weekChange > 0 ? 'increase' : 'decrease'}: ${Math.abs(weekChange).toFixed(1)}%`);
    }

    if (Math.abs(monthChange) > 15) {
      trends.push(`Monthly spending ${monthChange > 0 ? 'growth' : 'reduction'}: ${Math.abs(monthChange).toFixed(1)}%`);
    }

    // Identify positive trends
    if (weekChange < -10 && monthChange < -5) {
      trends.push('Positive trend: Consistent spending reduction');
    }

    return trends;
  }

  /**
   * Format comprehensive analysis for display
   */
  private async formatComprehensiveAnalysis(
    analysis: SpendingAnalysis,
    userContext: UserContext
  ): Promise<string> {
    let message = `🔍 **Comprehensive Spending Analysis**\n\n`;

    // Financial Health Score
    if (analysis.financialHealth) {
      const health = analysis.financialHealth;
      const healthEmoji = this.getHealthEmoji(health.level);
      message += `${healthEmoji} **Financial Health: ${health.score}/100** (${health.level})\n\n`;

      if (health.key_strengths?.length > 0) {
        message += `✅ **Strengths:**\n`;
        health.key_strengths.slice(0, 2).forEach((strength: string) => {
          message += `• ${strength}\n`;
        });
        message += `\n`;
      }
    }

    // Key Trends
    if (analysis.trends.length > 0) {
      message += `📈 **Key Trends:**\n`;
      analysis.trends.slice(0, 3).forEach(trend => {
        message += `• ${trend}\n`;
      });
      message += `\n`;
    }

    // Anomalies
    if (analysis.anomalies.length > 0) {
      message += `⚠️ **Notable Observations:**\n`;
      analysis.anomalies.slice(0, 2).forEach(anomaly => {
        message += `• ${anomaly}\n`;
      });
      message += `\n`;
    }

    // Top Recommendations
    if (analysis.budgetRecommendations.length > 0) {
      message += `💡 **Top Recommendations:**\n`;
      analysis.budgetRecommendations.slice(0, 2).forEach((rec: any) => {
        message += `• ${rec.category}: ${rec.reasoning}\n`;
      });
      message += `\n`;
    }

    message += `📊 Want detailed insights? Ask me about specific categories or time periods!`;

    return message;
  }

  /**
   * Prepare analysis data for AI prompts
   */
  private prepareAnalysisData(transactions: Transaction[], summary: DashboardSummary): string {
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalSpending = Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0);
    const avgTransaction = totalSpending / transactions.length;

    return `Spending Summary:
- Total transactions: ${transactions.length}
- Total amount: ${totalSpending}
- Average transaction: ${avgTransaction}
- Today: ${summary.spent_today} vs Yesterday: ${summary.spent_yesterday}
- This week: ${summary.spent_this_week} vs Last week: ${summary.spent_last_week}
- This month: ${summary.spent_this_month} vs Last month: ${summary.spent_last_month}

Category Breakdown:
${Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amt]) => `- ${cat}: ${amt} (${((amt / totalSpending) * 100).toFixed(1)}%)`)
        .join('\n')}`;
  }

  /**
   * Generate basic recommendations when AI fails
   */
  private generateBasicRecommendations(
    transactions: Transaction[],
    summary: DashboardSummary,
    userContext: UserContext
  ): string {
    const currency = userContext.preferences.currency;
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];
    const weekChange = this.calculatePercentageChange(summary.spent_this_week, summary.spent_last_week);

    let message = `🎯 **Smart Recommendations**\n\n`;

    message += `📊 **Priority Actions:**\n`;

    if (topCategory && topCategory[1] > summary.spent_this_week * 0.4) {
      message += `🔍 **High Priority:** Review ${topCategory[0]} spending\n`;
      message += `   Current: ${this.formatCurrency(topCategory[1], currency)}\n`;
      message += `   Consider setting a monthly ${topCategory[0]} budget\n\n`;
    }

    if (weekChange > 20) {
      message += `📈 **Medium Priority:** Weekly spending increased ${weekChange.toFixed(1)}%\n`;
      message += `   Track daily expenses more closely\n`;
      message += `   Set weekly spending alerts\n\n`;
    }

    message += `💡 **General Tips:**\n`;
    message += `• Review expenses weekly\n`;
    message += `• Set category budgets\n`;
    message += `• Track large purchases\n`;
    message += `• Build an emergency fund\n\n`;

    message += `🎉 Keep up the great work tracking your finances!`;

    return message;
  }

  /**
   * Get insufficient data message
   */
  private getInsufficientDataMessage(): string {
    return `📊 **Analysis Coming Soon!**\n\n` +
      `I need more transaction data to provide meaningful insights.\n\n` +
      `**To get comprehensive analysis:**\n` +
      `• Add at least 5-10 transactions\n` +
      `• Include different categories\n` +
      `• Track expenses for a few days\n\n` +
      `**What I can analyze:**\n` +
      `• Spending patterns and trends\n` +
      `• Category-wise insights\n` +
      `• Budget recommendations\n` +
      `• Financial health score\n\n` +
      `Keep adding transactions and ask me again soon! 📈`;
  }

  /**
   * Get health emoji based on level
   */
  private getHealthEmoji(level: string): string {
    const emojiMap: Record<string, string> = {
      'excellent': '🌟',
      'good': '✅',
      'fair': '⚠️',
      'needs_improvement': '🔴',
    };
    return emojiMap[level] || '📊';
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
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