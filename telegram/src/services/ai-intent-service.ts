import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import {
  ProcessedMessage,
  MessageIntent,
  ExtractedEntities,
  UserContext
} from '@/types/ai';
import { TelegramMessage } from '@/types/telegram';
import { Logger } from '@/utils/logger';
import { config } from '@/config/environment';

// Zod schemas for structured AI responses
const MessageIntentSchema = z.object({
  type: z.enum([
    'ADD_TRANSACTION',
    'VIEW_TRANSACTIONS',
    'DASHBOARD',
    'INSIGHTS',
    'SUBSCRIPTIONS',
    'HELP',
    'AUTH',
    'UNKNOWN'
  ]),
  action: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

const ExtractedEntitiesSchema = z.object({
  amount: z.number().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  note: z.string().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  currency: z.string().optional(),
});

const ProcessedMessageSchema = z.object({
  intent: MessageIntentSchema,
  entities: ExtractedEntitiesSchema,
  confidence: z.number().min(0).max(1),
  requiresAuth: z.boolean(),
  clarificationNeeded: z.boolean().optional(),
  clarificationQuestion: z.string().optional(),
});

export class AIIntentService {
  private logger = new Logger('AIIntentService');
  private model = openai(config.ai.model);

  constructor() {
    this.logger.info(`AI Intent Service initialized with model: ${config.ai.model}`);
  }

  /**
   * Process a message and extract intent and entities
   */
  public async processMessage(message: TelegramMessage, userContext?: UserContext): Promise<ProcessedMessage> {
    try {
      const messageText = message.text || '';
      const userId = message.from?.id.toString();

      this.logger.debug(`Processing message from user ${userId}: ${messageText}`);

      // Use AI to analyze the message
      const result = await generateObject({
        model: this.model,
        schema: ProcessedMessageSchema,
        prompt: this.buildIntentPrompt(messageText, userContext),
        temperature: 0.1, // Low temperature for consistent intent recognition
      });

      const processedMessage: ProcessedMessage = {
        intent: result.object.intent,
        entities: result.object.entities,
        confidence: result.object.confidence,
        requiresAuth: result.object.requiresAuth,
      };

      this.logger.debug(`Processed message - Intent: ${processedMessage.intent.type}, Confidence: ${processedMessage.confidence}`);

      return processedMessage;

    } catch (error) {
      this.logger.error('Error processing message with AI:', error);

      // Fallback to rule-based processing
      return this.fallbackProcessing(message.text || '');
    }
  }

  /**
   * Generate a conversational response based on intent and context
   */
  public async generateResponse(
    intent: MessageIntent,
    context: UserContext,
    originalMessage: string,
    additionalData?: any
  ): Promise<string> {
    try {
      const prompt = this.buildResponsePrompt(intent, context, originalMessage, additionalData);

      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7, // Higher temperature for more natural responses
        maxTokens: 500,
      });

      return result.text;

    } catch (error) {
      this.logger.error('Error generating AI response:', error);
      return this.getFallbackResponse(intent.type);
    }
  }

  /**
   * Extract transaction details from natural language
   */
  public async extractTransactionDetails(text: string): Promise<{
    amount?: number;
    category?: string;
    note?: string;
    date?: string;
    confidence: number;
    needsConfirmation: boolean;
  }> {
    try {
      const TransactionSchema = z.object({
        amount: z.number().optional(),
        category: z.string().optional(),
        note: z.string().optional(),
        date: z.string().optional(),
        confidence: z.number().min(0).max(1),
        needsConfirmation: z.boolean(),
      });

      const result = await generateObject({
        model: this.model,
        schema: TransactionSchema,
        prompt: this.buildTransactionExtractionPrompt(text),
        temperature: 0.1,
      });

      return result.object;

    } catch (error) {
      this.logger.error('Error extracting transaction details:', error);
      return {
        confidence: 0,
        needsConfirmation: true,
      };
    }
  }

  /**
   * Build the prompt for intent recognition
   */
  private buildIntentPrompt(messageText: string, userContext?: UserContext): string {
    const contextInfo = userContext ? `
User Context:
- User ID: ${userContext.userId}
- Language: ${userContext.preferences.language}
- Currency: ${userContext.preferences.currency}
- Timezone: ${userContext.preferences.timezone}
` : 'User Context: Not authenticated';

    return `You are an AI assistant for a personal finance app called Clair. Analyze the user's message and determine their intent.

${contextInfo}

User Message: "${messageText}"

Analyze this message and return:
1. Intent type (one of: ADD_TRANSACTION, VIEW_TRANSACTIONS, DASHBOARD, INSIGHTS, SUBSCRIPTIONS, HELP, AUTH, UNKNOWN)
2. Extracted entities (amounts, categories, dates, etc.)
3. Confidence score (0-1)
4. Whether authentication is required for this request

Intent Guidelines:
- ADD_TRANSACTION: User wants to record a spending/expense ("I spent 50000 on food", "Add expense")
- VIEW_TRANSACTIONS: User wants to see transaction history ("show transactions", "recent expenses")
- DASHBOARD: User wants spending summary/overview ("dashboard", "spending summary", "how much spent")
- INSIGHTS: User wants analysis/advice ("insights", "spending patterns", "advice")
- SUBSCRIPTIONS: User wants to manage recurring payments ("subscriptions", "Netflix", "monthly payments")
- HELP: User needs assistance ("help", "what can you do")
- AUTH: User wants to link/unlink account ("link account", "authenticate")
- UNKNOWN: Intent is unclear

Entity Extraction:
- Extract amounts (numbers that represent money)
- Extract categories (food, transport, entertainment, etc.)
- Extract dates (today, yesterday, last week, specific dates)
- Extract notes/descriptions
- For Indonesian Rupiah, amounts are typically large numbers (25000, 150000, etc.)

Authentication Requirements:
- ADD_TRANSACTION, VIEW_TRANSACTIONS, DASHBOARD, INSIGHTS, SUBSCRIPTIONS require auth
- HELP, AUTH do not require auth`;
  }

  /**
   * Build the prompt for response generation
   */
  private buildResponsePrompt(
    intent: MessageIntent,
    context: UserContext,
    originalMessage: string,
    additionalData?: any
  ): string {
    return `You are Clair, a friendly AI assistant for personal finance management. Generate a helpful, conversational response.

User Context:
- Language: ${context.preferences.language}
- Currency: ${context.preferences.currency}
- User is authenticated and linked

Intent: ${intent.type}
Original Message: "${originalMessage}"
${additionalData ? `Additional Data: ${JSON.stringify(additionalData)}` : ''}

Response Guidelines:
- Be conversational and friendly
- Use appropriate emojis
- Keep responses concise but helpful
- For Indonesian users, use IDR currency format (e.g., "Rp 50.000")
- If data is provided, format it clearly
- If action was taken, confirm it clearly
- If clarification is needed, ask specific questions

Generate a natural, helpful response that addresses the user's intent.`;
  }

  /**
   * Build prompt for transaction extraction
   */
  private buildTransactionExtractionPrompt(text: string): string {
    return `Extract transaction details from this natural language text: "${text}"

Guidelines:
- Amount: Look for numbers that represent money (50000, 25k, 150000, etc.)
- Category: Common categories include: Food, Transportation, Entertainment, Shopping, Housing, Utilities, Health, Education, Other
- Date: Extract or infer date (today, yesterday, last week, specific dates)
- Note: Any descriptive text about the transaction
- For Indonesian context, amounts are typically large numbers without decimals

Examples:
- "I spent 50000 on food today" → amount: 50000, category: "Food", date: "today", note: "food"
- "Add 25k transportation expense" → amount: 25000, category: "Transportation", note: "transportation expense"
- "Lunch at warung 35000" → amount: 35000, category: "Food", note: "Lunch at warung"

Set confidence based on how clear the extraction is:
- 0.9+: All details clear
- 0.7-0.9: Most details clear, minor ambiguity
- 0.5-0.7: Some details unclear
- <0.5: Very ambiguous

Set needsConfirmation to true if confidence < 0.8 or if critical details are missing.`;
  }

  /**
   * Fallback processing when AI fails
   */
  private fallbackProcessing(messageText: string): ProcessedMessage {
    const lowerText = messageText.toLowerCase();

    let intentType: MessageIntent['type'] = 'UNKNOWN';
    let requiresAuth = true;

    // Simple rule-based intent detection
    if (lowerText.includes('spent') || lowerText.includes('expense') || lowerText.includes('add')) {
      intentType = 'ADD_TRANSACTION';
    } else if (lowerText.includes('transaction') || lowerText.includes('history')) {
      intentType = 'VIEW_TRANSACTIONS';
    } else if (lowerText.includes('dashboard') || lowerText.includes('summary')) {
      intentType = 'DASHBOARD';
    } else if (lowerText.includes('insight') || lowerText.includes('advice')) {
      intentType = 'INSIGHTS';
    } else if (lowerText.includes('subscription')) {
      intentType = 'SUBSCRIPTIONS';
    } else if (lowerText.includes('help')) {
      intentType = 'HELP';
      requiresAuth = false;
    } else if (lowerText.includes('link') || lowerText.includes('auth')) {
      intentType = 'AUTH';
      requiresAuth = false;
    }

    return {
      intent: { type: intentType },
      entities: {},
      confidence: 0.6, // Lower confidence for fallback
      requiresAuth,
    };
  }

  /**
   * Get fallback response when AI generation fails
   */
  private getFallbackResponse(intentType: MessageIntent['type']): string {
    const responses = {
      ADD_TRANSACTION: '💸 I understand you want to add a transaction. Could you please provide more details about the amount and category?',
      VIEW_TRANSACTIONS: '📝 I can help you view your transactions. Let me fetch that information for you.',
      DASHBOARD: '📊 I can show you your spending dashboard. Let me get that data for you.',
      INSIGHTS: '💡 I can provide spending insights. Let me analyze your data.',
      SUBSCRIPTIONS: '🔄 I can help with your subscriptions. What would you like to know?',
      HELP: '🤖 I can help you manage your finances. Try asking me to add transactions, view your dashboard, or manage subscriptions.',
      AUTH: '🔐 I can help you with account authentication. What would you like to do?',
      UNKNOWN: '🤔 I\'m not sure what you\'d like to do. Could you please rephrase your request?',
    };

    return responses[intentType] || responses.UNKNOWN;
  }

  /**
   * Check if the AI service is healthy
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await generateText({
        model: this.model,
        prompt: 'Respond with "OK" if you can process this message.',
        maxTokens: 10,
      });

      return result.text.toLowerCase().includes('ok');
    } catch (error) {
      this.logger.error('AI health check failed:', error);
      return false;
    }
  }
}