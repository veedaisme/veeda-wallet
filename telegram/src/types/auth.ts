// Authentication Types
export interface TelegramAuthService {
  linkAccount(telegramId: string, authToken: string): Promise<LinkResult>;
  isUserLinked(telegramId: string): Promise<boolean>;
  getUserContext(telegramId: string): Promise<UserContext | null>;
  generateAuthLink(telegramId: string): Promise<string>;
  unlinkAccount(telegramId: string): Promise<void>;
}

export interface LinkResult {
  success: boolean;
  message: string;
  authUrl?: string;
}

// Database Models
export interface TelegramUserLink {
  id: string;
  telegram_id: string;
  user_id: string;
  auth_token: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface ConversationContext {
  id: string;
  telegram_id: string;
  session_id: string;
  context: Record<string, any>;
  expires_at: string;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  telegram_id: string;
  spending_alerts: boolean;
  weekly_summary: boolean;
  subscription_reminders: boolean;
  alert_threshold?: number;
  preferred_time?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Data Transfer Objects for creating/updating records
export interface CreateTelegramUserLinkData {
  telegram_id: string;
  user_id: string;
  auth_token: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateTelegramUserLinkData {
  auth_token?: string;
  preferences?: Partial<UserPreferences>;
  last_activity?: string;
}

export interface CreateConversationContextData {
  telegram_id: string;
  session_id: string;
  context: Record<string, any>;
  expires_at: string;
}

export interface UpdateConversationContextData {
  context: Record<string, any>;
  expires_at?: string;
}

export interface CreateNotificationSettingsData {
  user_id: string;
  telegram_id: string;
  spending_alerts?: boolean;
  weekly_summary?: boolean;
  subscription_reminders?: boolean;
  alert_threshold?: number;
  preferred_time?: string;
  timezone?: string;
}

export interface UpdateNotificationSettingsData {
  spending_alerts?: boolean;
  weekly_summary?: boolean;
  subscription_reminders?: boolean;
  alert_threshold?: number;
  preferred_time?: string;
  timezone?: string;
}

// Re-export from ai.ts to avoid circular imports
export interface UserContext {
  userId: string;
  telegramId: string;
  authToken: string;
  preferences: UserPreferences;
  linkedAt: string;
}

export interface UserPreferences {
  notifications: boolean;
  language: 'en' | 'id';
  timezone: string;
  currency: string;
}