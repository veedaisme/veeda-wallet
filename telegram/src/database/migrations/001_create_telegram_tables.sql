-- Migration: Create Telegram Bot Tables
-- This migration creates the necessary tables for Telegram bot functionality

-- Table for linking Telegram users to Clair accounts
CREATE TABLE IF NOT EXISTS telegram_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  auth_token TEXT NOT NULL,
  preferences JSONB DEFAULT '{
    "notifications": true,
    "language": "en",
    "timezone": "UTC",
    "currency": "IDR"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint (assuming users table exists)
  CONSTRAINT fk_telegram_user_links_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table for conversation context and AI session management
CREATE TABLE IF NOT EXISTS telegram_conversation_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite unique constraint for telegram_id + session_id
  CONSTRAINT uk_telegram_conversation_contexts_telegram_session 
    UNIQUE (telegram_id, session_id)
);

-- Table for notification settings
CREATE TABLE IF NOT EXISTS telegram_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  telegram_id TEXT NOT NULL,
  spending_alerts BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  subscription_reminders BOOLEAN DEFAULT true,
  alert_threshold DECIMAL(10,2),
  preferred_time TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_telegram_notification_settings_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_telegram_notification_settings_telegram_id 
    FOREIGN KEY (telegram_id) REFERENCES telegram_user_links(telegram_id) ON DELETE CASCADE,
    
  -- Unique constraint to ensure one setting per user
  CONSTRAINT uk_telegram_notification_settings_user_id 
    UNIQUE (user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_user_links_telegram_id 
  ON telegram_user_links(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_user_links_user_id 
  ON telegram_user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_user_links_last_activity 
  ON telegram_user_links(last_activity);

CREATE INDEX IF NOT EXISTS idx_telegram_conversation_contexts_telegram_id 
  ON telegram_conversation_contexts(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_conversation_contexts_expires_at 
  ON telegram_conversation_contexts(expires_at);

CREATE INDEX IF NOT EXISTS idx_telegram_notification_settings_user_id 
  ON telegram_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notification_settings_telegram_id 
  ON telegram_notification_settings(telegram_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at columns
CREATE TRIGGER update_telegram_user_links_updated_at 
  BEFORE UPDATE ON telegram_user_links 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_notification_settings_updated_at 
  BEFORE UPDATE ON telegram_notification_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired conversation contexts
CREATE OR REPLACE FUNCTION cleanup_expired_conversation_contexts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM telegram_conversation_contexts 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE telegram_user_links IS 'Links Telegram users to Clair user accounts';
COMMENT ON TABLE telegram_conversation_contexts IS 'Stores AI conversation context and session data';
COMMENT ON TABLE telegram_notification_settings IS 'User preferences for Telegram notifications';

COMMENT ON COLUMN telegram_user_links.telegram_id IS 'Telegram user ID as string';
COMMENT ON COLUMN telegram_user_links.auth_token IS 'Encrypted authentication token for API access';
COMMENT ON COLUMN telegram_user_links.preferences IS 'User preferences stored as JSON';
COMMENT ON COLUMN telegram_user_links.last_activity IS 'Last time user interacted with the bot';

COMMENT ON COLUMN telegram_conversation_contexts.context IS 'AI conversation context stored as JSON';
COMMENT ON COLUMN telegram_conversation_contexts.expires_at IS 'When this context expires and should be cleaned up';

COMMENT ON FUNCTION cleanup_expired_conversation_contexts() IS 'Cleanup function for expired conversation contexts - should be run periodically';