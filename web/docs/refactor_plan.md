# Refactoring Plan for `web/app/page.tsx`

This document outlines the plan to refactor the main page component (`web/app/page.tsx`) of the Veeda Wallet web application to improve its structure, maintainability, and reusability.

## 1. Current State Analysis:

*   The primary component `Home` in `web/app/page.tsx` acts as a "god component," managing state and logic for multiple distinct features: Dashboard, Transactions, and Subscriptions.
*   It handles data fetching, UI state (modals, active tabs, loading states), and rendering for all these sections.
*   A significant sub-component, `ChartModalDashboard`, is also defined within this file, further increasing its size and complexity.
*   While custom hooks (`useUser`) and services (`subscriptionService`) are used, much of the data fetching and state logic resides directly within the `Home` component.

## 2. Goals of Refactoring:

*   **Improved Maintainability:** Smaller, focused components are easier to understand, modify, and debug.
*   **Enhanced Reusability:** Components designed for specific tasks (e.g., displaying a list of transactions) can be reused elsewhere if needed.
*   **Clearer Separation of Concerns:** Each component and hook will have a single, well-defined responsibility.
*   **Reduced Complexity:** Breaking down the large component will make the overall codebase easier to navigate and reason about.

## 3. Proposed New Structure and Components:

The core idea is to break down `page.tsx` into a main page container and several feature-specific view components, supported by custom hooks and dedicated service modules.

*   **`web/app/page.tsx` (Main Page Container):**
    *   **Responsibilities:**
        *   Maintain the `ProtectedLayout`.
        *   Manage the state for the `activeTab` (Dashboard, Transactions, Subscriptions).
        *   Render tab navigation UI elements.
        *   Conditionally render the active "View" component (`DashboardView`, `TransactionsView`, `SubscriptionsView`) based on the `activeTab`.
        *   Handle global UI elements like the user profile menu and logout functionality.
        *   Potentially manage global FABs (Floating Action Buttons) for "Add Transaction" or "Add Subscription" if they are intended to be accessible from all tabs, or delegate this to the respective views.

*   **New View Components (e.g., in `web/components/views/` or feature-specific directories like `web/components/dashboard/`):**
    *   **`DashboardView.tsx`**
        *   **Responsibilities:** Fetching and displaying dashboard summary cards (Today's, This Week's, This Month's spending). Handling interactions on these cards, such as opening the chart modal.
        *   **Imports/Uses:** `SpendingCard`, `ChartModal`, `useDashboardSummary` hook.
    *   **`TransactionsView.tsx`**
        *   **Responsibilities:** Fetching, displaying, sorting, searching, and paginating the list of transactions. Handling the "Edit Transaction" modal.
        *   **Imports/Uses:** `TransactionsList`, `EditTransactionModal`, `TransactionForm` (for a potential "Add Transaction" button within this view), `useTransactions` hook.
    *   **`SubscriptionsView.tsx`**
        *   **Responsibilities:** Fetching and displaying the list of projected subscriptions and the subscription summary. Handling the "Add/Edit Subscription" modal.
        *   **Imports/Uses:** `SubscriptionsList`, `SubscriptionForm`, `useSubscriptions` hook.

*   **Dedicated Component Files:**
    *   **`ChartModal.tsx` (e.g., in `web/components/dashboard/`):**
        *   The existing `ChartModalDashboard` component logic will be extracted from `page.tsx` into this dedicated file.
        *   **Responsibilities:** Fetching and displaying detailed weekly/monthly spending charts.
        *   **Props:** `open`, `type` ("week" | "month"), `onClose`, `userId`.

*   **Custom Hooks (in `web/hooks/`):**
    *   **`useDashboardSummary.ts`:**
        *   **Responsibilities:** Encapsulate logic for fetching dashboard summary data (e.g., `spent_today`, `spent_this_week`) and chart-specific data (weekly/monthly summaries if `ChartModal` doesn't fetch its own).
        *   **Returns:** `{ dashboardData, chartData, loading, error, refetch }`.
    *   **`useTransactions.ts`:**
        *   **Responsibilities:** Encapsulate logic for fetching transactions, including pagination, sorting, and search filtering.
        *   **Returns:** `{ transactions, loadMore, hasMore, loading, error, sortParams, setSortParams, searchTerm, setSearchTerm, refreshTransactions }`.
    *   **`useSubscriptions.ts`:**
        *   **Responsibilities:** Encapsulate logic for fetching projected subscriptions and the subscription summary.
        *   **Returns:** `{ subscriptions, summary, loading, error, refetch }`.

*   **Service Layer Enhancement (in `web/lib/` or a new `web/services/` directory):**
    *   **`dashboardService.ts` (New):**
        *   Contain functions for fetching data related to the dashboard, e.g., `fetchDashboardSummary()`, `fetchWeeklySpendingForChart(userId, dateRange)`, `fetchMonthlySpendingForChart(userId, dateRange)`.
    *   **`transactionService.ts` (New or Enhanced):**
        *   Contain functions for `fetchTransactions(params)`, `addTransaction(data)`, `updateTransaction(id, data)`, `deleteTransaction(id)`.
    *   `subscriptionService.ts` (Existing, serves as a good model).

*   **Utility Functions (in `web/utils/`):**
    *   Move general utility functions like `getChange` (calculates percentage change), and date manipulation functions (currently in `ChartModalDashboard` like `getWeekDays`, `getMonthWeeks`) into appropriate utility files (e.g., `calculationUtils.ts`, `dateUtils.ts`).

## 4. Proposed Directory Structure Changes (Illustrative):

```
web/
├── app/
│   └── page.tsx              # Main page container
├── components/
│   ├── dashboard/
│   │   ├── DashboardView.tsx
│   │   ├── SpendingCard.tsx      # Existing
│   │   └── ChartModal.tsx        # Extracted from page.tsx
│   ├── transactions/
│   │   ├── TransactionsView.tsx
│   │   ├── TransactionsList.tsx  # Existing
│   │   ├── TransactionForm.tsx   # Existing
│   │   └── EditTransactionModal.tsx # Existing
│   ├── subscriptions/
│   │   ├── SubscriptionsView.tsx
│   │   ├── SubscriptionsList.tsx # Existing
│   │   └── SubscriptionForm.tsx  # Existing
│   ├── ui/                     # Existing (generic UI components)
│   └── ProtectedLayout.tsx     # Existing
├── hooks/
│   ├── useUser.ts              # Existing
│   ├── useDashboardSummary.ts  # New
│   ├── useTransactions.ts      # New
│   └── useSubscriptions.ts     # New
├── lib/                        # (or a new 'services/' directory)
│   ├── supabaseClient.ts       # Existing
│   ├── subscriptionService.ts  # Existing
│   ├── transactionService.ts   # New/Enhanced
│   └── dashboardService.ts     # New
└── utils/
    ├── currency.ts             # Existing (for formatIDR)
    └── dateUtils.ts            # New (for date helpers)
    └── calculationUtils.ts     # New (for getChange etc.)
```

## 5. Data Flow:

*   The main `page.tsx` will pass down the `userId` (from `useUser`) and any necessary shared state or callbacks to the active View component.
*   Each View component will use its corresponding custom hook (e.g., `DashboardView` uses `useDashboardSummary`) to fetch and manage its specific data.
*   Custom hooks will call functions from the service layer modules (e.g., `transactionService.fetchTransactions`).
*   Service layer modules will interact with Supabase (or other data sources).
*   State specific to a modal (e.g., data for `EditTransactionModal`) will be managed within its parent View component or the modal itself if it's complex enough.

## 6. Potential Challenges/Considerations:

*   **Prop Drilling:** Care must be taken to avoid excessive prop drilling. Custom hooks and potentially React Context (if shared state becomes complex) can mitigate this.
*   **State Co-location:** Strive to keep state as close as possible to where it's used. Feature-specific hooks help achieve this.
*   **Global State:** For truly global state (like user authentication, theme), `useUser` hook and React Context are appropriate. For now, the proposed structure aims to minimize the need for additional global state managers.
*   **Testing:** Smaller, focused components and hooks are generally easier to test individually.

This plan aims to create a more modular, maintainable, and scalable frontend architecture for the web application.
