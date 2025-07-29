export interface MessageIntent {
  type: string;
  confidence: number;
  entities?: Record<string, any>;
}

export interface ProcessedMessage {
  intent: MessageIntent;
  originalMessage: string;
  timestamp: string;
}

export interface UserContext {
  userId: string;
  telegramId: string;
  preferences: {
    currency: string;
    language: 'en' | 'id';
    notifications: boolean;
  };
}

export interface AIMessageProcessor {
  processMessage(message: any, userContext?: UserContext): Promise<ProcessedMessage>;
  generateResponse(intent: MessageIntent, context: UserContext, originalMessage: string, additionalData?: any): Promise<string>;
}