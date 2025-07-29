# Clair Telegram AI Assistant

A conversational AI assistant for the Clair spending tracker that allows users to manage their finances through Telegram messages.

## Features

- 🤖 **Natural Language Processing**: Interact with your financial data using conversational AI
- 💸 **Transaction Management**: Add, view, and manage transactions through chat
- 📊 **Dashboard Insights**: Get spending summaries and financial insights
- 🔄 **Subscription Tracking**: Monitor and manage recurring subscriptions
- 🔐 **Secure Authentication**: Link your Clair account securely
- 📱 **Real-time Notifications**: Get alerts for spending patterns and due payments

## Architecture

- **Polling-based Connection**: Secure outbound-only connections to Telegram (no webhooks)
- **Dual Data Access**: 
  - Read operations via Supabase MCP (leveraging RLS)
  - Write operations via Clair API client
- **AI-Powered**: Uses Vercel AI SDK for natural language understanding

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required Environment Variables**
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from @BotFather
   - `OPENAI_API_KEY`: OpenAI API key for AI processing
   - `CLAIR_API_URL`: URL to your Clair API server
   - `SUPABASE_URL`: Supabase project URL (for MCP)
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for MCP)

## Development

```bash
# Start in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

## Bot Commands

- `/start` - Welcome message and setup instructions
- `help` - Show available features and commands
- `link account` - Start account linking process

## Usage Examples

Once your account is linked, you can interact naturally:

- **Add Transaction**: "I spent 50000 on food today"
- **View Dashboard**: "Show my spending summary"
- **Transaction History**: "Show my recent transactions"
- **Subscriptions**: "What subscriptions do I have?"
- **Insights**: "Give me spending insights for this month"

## Security

- **No Public Endpoints**: Uses polling instead of webhooks
- **RLS Protection**: Read operations respect database security policies
- **Token Management**: Secure authentication token handling
- **Rate Limiting**: Built-in rate limiting per user

## Project Structure

```
src/
├── config/          # Environment and configuration
├── services/        # Core services (polling, AI, auth)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions and helpers
└── index.ts        # Main application entry point
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation as needed
4. Follow the existing code style

## License

MIT