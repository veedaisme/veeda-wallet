# Clair Wallet - Project Overview

## Project Description

**Clair Wallet** is a modern, progressive web application (PWA) designed for personal financial management. It provides users with comprehensive tools to track their expenses, manage subscriptions, and gain insights into their spending patterns through an intuitive dashboard interface.

The application is built as a responsive, mobile-first experience with internationalization support (English and Indonesian), offline capabilities, and real-time data synchronization through Supabase.

## Core Features

### 1. Dashboard & Analytics
- **Real-time spending overview** with visual charts and comparisons
- **Time-based analysis**: Today, yesterday, weekly, and monthly spending patterns
- **Interactive spending comparison charts** (weekly vs previous week, monthly vs previous month)
- **Visual spending trends** with Recharts integration
- **Spending category breakdown** with visual indicators

### 2. Transaction Management
- **Add/Edit/Delete transactions** with comprehensive form validation
- **Transaction categorization** (Food, Transportation, Housing, Entertainment, Shopping, Utilities, Health, etc.)
- **Date-based filtering and sorting**
- **Amount range filtering**
- **Search functionality** across transaction notes and categories
- **Pagination support** for large transaction lists
- **Inline editing** with click-to-edit functionality

### 3. Subscription Management
- **Recurring subscription tracking** (monthly, quarterly, annually)
- **Multi-currency support** with automatic IDR conversion
- **Upcoming payment notifications**
- **Subscription cost projections**
- **Payment date management** with calendar integration
- **Provider-based organization**

### 4. User Authentication & Security
- **Supabase Auth integration** with secure authentication flows
- **Protected routes** with automatic redirection
- **User session management**
- **Secure logout functionality**

### 5. Progressive Web App (PWA) Features
- **Offline functionality** with service worker caching
- **App-like experience** with custom splash screens
- **Installation prompts** for mobile and desktop
- **Background sync** capabilities
- **Optimized caching strategies** for assets and API calls

### 6. Internationalization (i18n)
- **Bilingual support**: English and Indonesian
- **Dynamic language switching** with persistent preferences
- **Localized date and currency formatting**
- **RTL/LTR text direction support**

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4+ with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: Zustand for global state
- **Forms**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query (React Query) v5
- **Charts**: Recharts 2.15.0
- **Icons**: Lucide React
- **Internationalization**: next-intl 4.1+

### Backend & Database
- **Backend as a Service**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time subscriptions**: Supabase Realtime
- **File storage**: Supabase Storage (if needed)

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript compiler
- **Build Tool**: Next.js with Webpack optimization
- **PWA**: next-pwa 5.6+

## Project Structure

```
web/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Internationalized routes
│   │   ├── auth/                 # Authentication pages
│   │   ├── subscriptions/        # Subscription management
│   │   └── layout.tsx           # Localized layout
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── ui/                      # Reusable UI components (shadcn/ui)
│   ├── dashboard/               # Dashboard-specific components
│   ├── transactions/            # Transaction management
│   ├── subscriptions/           # Subscription management
│   └── *.tsx                    # Feature components
├── hooks/                       # Custom React hooks
│   ├── queries/                 # TanStack Query hooks
│   └── *.ts                     # Utility hooks
├── lib/                         # Utility libraries
│   ├── supabaseClient.ts        # Supabase configuration
│   ├── apiClient.ts             # API client utilities
│   └── utils.ts                 # Common utilities
├── models/                      # TypeScript type definitions
├── stores/                      # Zustand stores
├── messages/                    # i18n translation files
├── public/                      # Static assets
└── docs/                        # Project documentation
```

## Data Models

### Transaction Model
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

### Subscription Model
```typescript
interface Subscription {
  id: string
  provider_name: string
  amount: number
  currency: string
  frequency: 'monthly' | 'quarterly' | 'annually'
  payment_date: string
  created_at?: string
  updated_at?: string
}
```

## Key Features in Detail

### Dashboard Analytics
The dashboard provides comprehensive financial insights through:
- **Spending comparisons**: Week-over-week and month-over-month analysis
- **Category breakdown**: Visual representation of spending by category
- **Trend analysis**: Historical spending patterns with interactive charts
- **Quick stats**: Today's spending, weekly totals, monthly projections

### Transaction Management
Advanced transaction handling includes:
- **Smart categorization**: Predefined categories with icon associations
- **Flexible filtering**: Date ranges, amount ranges, category filters
- **Bulk operations**: Support for multiple transaction management
- **Search capabilities**: Full-text search across notes and categories

### Subscription Tracking
Comprehensive subscription management features:
- **Multi-currency handling**: Automatic conversion to IDR
- **Payment predictions**: Future payment calculations based on frequency
- **Cost analysis**: Monthly recurring cost summaries
- **Calendar integration**: Visual payment date management

### PWA Capabilities
Advanced progressive web app features:
- **Offline-first design**: Core functionality available without internet
- **Smart caching**: Strategic caching of API responses and static assets
- **Background sync**: Automatic data synchronization when connection returns
- **Native app experience**: Installation prompts and app-like navigation

## Performance Optimizations

### Caching Strategy
- **Static assets**: Long-term caching with service worker
- **API responses**: Short-term caching for frequently accessed data
- **Images**: Optimized Next.js Image component with lazy loading
- **Fonts**: Strategic font loading and caching

### Code Splitting
- **Route-based splitting**: Automatic code splitting per route
- **Component lazy loading**: Dynamic imports for heavy components
- **Bundle analysis**: Built-in bundle analyzer for optimization

### Database Optimization
- **Query optimization**: Efficient Supabase queries with proper indexing
- **Data pagination**: Lazy loading for large datasets
- **Real-time updates**: Selective real-time subscriptions

## Security Features

### Authentication Security
- **Supabase Auth**: Industry-standard authentication flows
- **JWT tokens**: Secure token-based authentication
- **Route protection**: Automatic redirection for unauthenticated users
- **Session management**: Secure session handling and cleanup

### Data Security
- **Row Level Security (RLS)**: Database-level access control
- **Input validation**: Client and server-side validation
- **XSS protection**: Sanitized user inputs
- **CSRF protection**: Built-in Next.js CSRF protection

## Deployment & DevOps

### Build Process
- **TypeScript compilation**: Full type checking during build
- **Asset optimization**: Automatic image and asset optimization
- **Bundle compression**: Gzip and Brotli compression
- **PWA manifest generation**: Automatic service worker and manifest creation

### Performance Monitoring
- **Core Web Vitals**: Built-in performance monitoring
- **Bundle analysis**: Size optimization tracking
- **Query performance**: Database query optimization monitoring

## Future Enhancements

### Short-term Roadmap
- **Export functionality**: CSV/PDF export for transactions and reports
- **Budget management**: Monthly budget setting and tracking
- **Receipt scanning**: OCR-based receipt processing
- **Notification system**: Payment reminders and spending alerts

### Long-term Vision
- **Bank integration**: Direct bank account synchronization
- **Investment tracking**: Portfolio management capabilities
- **Multi-user support**: Family account management
- **Advanced analytics**: AI-powered spending insights and recommendations

## Development Guidelines

### Code Standards
- **TypeScript**: Strict type checking enabled
- **Component patterns**: Consistent component structure and naming
- **Error handling**: Comprehensive error boundaries and handling
- **Testing**: Unit and integration test coverage

### Performance Best Practices
- **React optimization**: Proper use of useMemo, useCallback, and React.memo
- **Query optimization**: Efficient data fetching patterns
- **Asset optimization**: Image and bundle size optimization
- **Accessibility**: WCAG 2.1 compliance

This project represents a modern approach to personal financial management, combining the best practices of web development with user-centered design principles to create a powerful, accessible, and performant financial tracking application.