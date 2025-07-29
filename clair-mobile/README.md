# Clair Wallet Mobile

A modern, haptic-enabled mobile application for personal financial management built with React Native and Expo.

## Features

- 📱 **Native Mobile Experience** - Optimized for iOS and Android with haptic feedback
- 💰 **Transaction Management** - Add, edit, and categorize your expenses
- 🔄 **Subscription Tracking** - Monitor recurring payments across multiple currencies
- 📊 **Dashboard Analytics** - Visual spending insights and comparisons
- 🔐 **Secure Authentication** - Supabase Auth with session persistence
- 🌍 **Multi-currency Support** - Track expenses in different currencies
- 📴 **Offline Capable** - Core functionality works without internet
- 🎨 **Modern UI** - Clean, accessible design with haptic feedback

## Tech Stack

- **Framework**: Expo SDK 53 with React Native 0.79.5
- **Language**: TypeScript 5
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand with persistence
- **Data Fetching**: TanStack Query (React Query) v5
- **Forms**: React Hook Form with Zod validation
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: React Native Chart Kit
- **Haptics**: Expo Haptics
- **UI Components**: Custom components with haptic feedback

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## Project Structure

```
clair-mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Authentication screens
│   ├── (tabs)/                   # Main tabs (authenticated)
│   ├── modals/                   # Modal screens
│   └── _layout.tsx              # Root layout with providers
├── components/ui/                # Base UI components
├── hooks/                       # Custom hooks
├── lib/                         # Utilities
├── stores/                      # Zustand stores
├── types/                       # TypeScript types
├── constants/                   # Constants
└── docs/                       # Documentation
```

## Features in Detail

### Authentication
- Email and password authentication with Supabase
- Persistent sessions with auto-refresh
- Protected routes with automatic redirection
- Haptic feedback for auth actions

### Dashboard
- Real-time spending overview with visual cards
- Category breakdown with color-coded visualization
- Recent transactions quick view
- Week-over-week and month-over-month comparisons

### Transaction Management
- Add/edit transactions with form validation
- Category selection with emoji icons
- Search and filter functionality
- Haptic feedback on interactions

### Subscription Management
- Track recurring payments (monthly, quarterly, annually)
- Multi-currency support with conversion
- Payment date tracking
- Summary of total monthly costs

### Haptic Feedback System
- Consistent haptic patterns throughout the app
- Different feedback types for different actions
- Enhanced accessibility and user experience

## Data Models

### Transaction
```typescript
interface Transaction {
  id: string
  amount: number
  category: string
  note: string | null
  date: string
  user_id: string
}
```

### Subscription
```typescript
interface Subscription {
  id: string
  provider_name: string
  amount: number
  currency: string
  frequency: 'monthly' | 'quarterly' | 'annually'
  payment_date: string
  user_id: string
}
```

## Development

- **TypeScript**: Strict type checking enabled
- **Component Patterns**: Consistent structure and naming
- **Error Handling**: Comprehensive error boundaries
- **Performance**: Optimized with React.memo, useMemo, and query caching

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/)
- [Supabase documentation](https://supabase.com/docs)
- [TanStack Query documentation](https://tanstack.com/query/latest)
