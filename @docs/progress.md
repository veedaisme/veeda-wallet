# Progress Log

## 2025-04-11

- Supabase project for veeda-wallet was created manually by the user.
  - **Project ID:** vuyswmhrxccwlhunzrdf
  - MCP-based project creation was attempted, but failed due to an internal error in the Supabase MCP server ("crypto is not defined" during cost confirmation). User proceeded with manual creation.

- Created `transactions` table in Supabase (Project ID: vuyswmhrxccwlhunzrdf) via MCP with multi-user support:
  - Columns: id (uuid, PK), amount (integer), category (text), note (text), date (timestamptz), user_id (uuid, FK to auth.users)
  - Row Level Security (RLS) enabled: users can only access their own transactions.
  - Policy: `user_id = auth.uid()`
