# Progress Log

## 2025-04-11

- Supabase project for veeda-wallet was created manually by the user.
  - **Project ID:** vuyswmhrxccwlhunzrdf
  - MCP-based project creation was attempted, but failed due to an internal error in the Supabase MCP server ("crypto is not defined" during cost confirmation). User proceeded with manual creation.

- Created `transactions` table in Supabase (Project ID: vuyswmhrxccwlhunzrdf) via MCP with multi-user support:
  - Columns: id (uuid, PK), amount (integer), category (text), note (text), date (timestamptz), user_id (uuid, FK to auth.users)
  - Row Level Security (RLS) enabled: users can only access their own transactions.
  - Policy: `user_id = auth.uid()`

- Integrated Supabase Auth UI for authentication:
  - Installed: @supabase/supabase-js, @supabase/auth-ui-react, @supabase/auth-ui-shared
  - Created `lib/supabaseClient.ts` to initialize the Supabase client.
  - Created `app/auth/page.tsx` to provide a login/signup UI using Supabase Auth UI.

- Added authentication state management:
  - Created `hooks/useUser.ts` to provide user/session context and listen for Supabase auth state changes.
  - Integrated `UserProvider` in `app/layout.tsx` to make authentication state available throughout the app.

- Fixed TypeScript/JSX errors in the authentication state hook:
  - Renamed `hooks/useUser.ts` to `hooks/useUser.tsx` to support JSX syntax.
  - Corrected Supabase auth subscription cleanup logic to use the correct subscription object.
  - The hook now compiles and works as intended.

- Enforced authentication for main app page:
  - Created `components/ProtectedLayout.tsx` to redirect unauthenticated users to `/auth`.
  - Wrapped `app/page.tsx` with `ProtectedLayout` so only logged-in users can access the dashboard.

- Improved login/signup page:
  - Replaced default Supabase Auth UI with a custom shadcn-styled `AuthForm` in `components/AuthForm.tsx`.
  - Updated `app/auth/page.tsx` to render the new AuthForm for a modern, branded authentication experience.

- Refined login/signup page to match wallet guidelines:
  - Removed logo and extra description for a minimal, focused form.
  - Title is bold and left-aligned, matching dashboard style.
  - Only essential elements (fields, button, toggle) are present for consistency.

## 2025-04-12

- Fixed dashboard to use live Supabase data and handle bigint values.
- Resolved NaN issue by extracting the first element from the Supabase RPC array.
- Cleaned up and deduplicated app/page.tsx.
- Prepared to generate and insert 2 months of mock transaction data for user 19408d1e-e317-4cc4-8dcc-8425b46d5bd2 to populate dashboard stats for yesterday, last week, and last month.

- Eliminated redundant dashboard_summary queries:
  - Refactored the dashboard data fetching logic in `app/page.tsx` to only call the Supabase `dashboard_summary` RPC once per dashboard tab activation, regardless of user state changes or effect re-runs.
  - Added a `useRef`-based guard to ensure the query is only made once per dashboard view, and reset when switching away from the dashboard tab.
  - This robustly prevents multiple unnecessary network requests and ensures only a single query is made per dashboard view.

- Added logout button under profile:
  - Updated the dashboard header in `app/page.tsx` to include a profile icon that opens a dropdown menu.
  - Implemented a "Logout" button in the dropdown, which calls `supabase.auth.signOut()` and redirects the user to `/auth`.
  - Dropdown menu closes automatically after logout.

### Dashboard Card Chart Comparison Feature

- The "Spent This Week" and "Spent This Month" cards on the dashboard are now clickable.
- Clicking a card opens a modal with a two-line chart:
  - "This Week": Shows a line chart comparing daily spending for the current week and previous week.
  - "This Month": Shows a line chart comparing weekly spending for the current month and previous month.
- All chart labels and legends use English ("Current Week", "Previous Week", "Current Month", "Previous Month", "Week 1", etc.).
- Data is fetched live from Supabase and aggregated as needed.
- UI is consistent with shadcn and uses the existing Modal and ChartContainer (Recharts) components.
- All code changes are in `app/page.tsx` and `components/spending-card.tsx`.
