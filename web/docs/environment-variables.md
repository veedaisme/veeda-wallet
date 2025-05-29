# Environment Variables

This document describes the environment variables used in the Veeda Wallet web application.

## Feature Flags

### `NEXT_PUBLIC_ENABLE_SUBSCRIPTION_CURRENCY_TOGGLE`

- **Type**: Boolean (`'true'` or `'false'`)
- **Default**: `'false'`
- **Description**: Controls whether users can toggle between IDR and original currency when viewing subscriptions. When set to `'false'`, all subscriptions are shown in IDR only. When set to `'true'`, users can toggle between IDR and original currency.

## How to Use

Add these variables to your `.env.local` file:

```
NEXT_PUBLIC_ENABLE_SUBSCRIPTION_CURRENCY_TOGGLE=false
```

To enable the currency toggle feature:

```
NEXT_PUBLIC_ENABLE_SUBSCRIPTION_CURRENCY_TOGGLE=true
```
