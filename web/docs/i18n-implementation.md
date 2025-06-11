# Multilingual (i18n) Support Implementation for Clair Wallet Web

## Overview
This document describes the steps and architectural considerations for adding Bahasa Indonesia support (alongside English) to the Clair Wallet web app. Users will be able to toggle languages via a button next to the profile icon.

## Current State Analysis
- Only English is supported; all UI text is hardcoded in components.
- No i18n library is present.
- `<html lang="en">` is set in the root layout.
- Text to translate appears in main pages, forms, cards, and menus.

## Solution: next-intl
We recommend `next-intl` for its tight integration with Next.js App Router, type safety, and flexible message formatting.

## Implementation Steps

### 1. Install next-intl
```
npm install next-intl
```

### 2. Create Translation Files
Structure:
```
/messages
  en.json
  id.json
```
Sample `en.json` and `id.json` provided in this doc. Use keys for all user-facing text.

### 3. Configure Middleware
Create `middleware.ts` in the root:
```ts
import createMiddleware from 'next-intl/middleware';
export default createMiddleware({
  locales: ['en', 'id'],
  defaultLocale: 'en',
});
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

### 4. Update next.config.mjs
```js
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();
const nextConfig = {};
export default withNextIntl(nextConfig);
```

### 5. Update Root Layout
Move layout to `app/[locale]/layout.tsx` and wrap with `NextIntlClientProvider`. Dynamically import messages based on locale. Set `<html lang={locale}>`.

### 6. Create a Language Switcher
Add a `LanguageSwitcher` component (see doc for code) and place it in the profile dropdown.

### 7. Refactor Components
Replace hardcoded text with `useTranslations()` from `next-intl`. Use translation keys everywhere.

### 8. Move Pages
Move all pages under `app/[locale]/` to support locale-based routing.

## Testing
- Switch between English and Bahasa; verify all text updates
- Check fallback and navigation persistence

## Future Enhancements
- Add more languages
- Use translation management tools
- Detect browser language automatically

## Example Translation Files

**en.json**
```json
{
  "app": { "title": "Transactions", "logout": "Logout" },
  "dashboard": { "title": "Dashboard", "today": "Today", "yesterday": "Yesterday", "thisWeek": "This Week", "lastWeek": "Last Week", "thisMonth": "This Month", "lastMonth": "Last Month" },
  "transactions": { "add": "Add Transaction", "amount": "Amount", "note": "Note", "category": "Category", "date": "Date", "filter": "Filter" },
  "categories": { "food": "Food", "transportation": "Transportation", "entertainment": "Entertainment", "housing": "Housing", "utilities": "Utilities", "shopping": "Shopping", "health": "Health", "education": "Education", "travel": "Travel", "other": "Other" },
  "language": { "en": "English", "id": "Bahasa Indonesia" }
}
```

**id.json**
```json
{
  "app": { "title": "Transaksi", "logout": "Keluar" },
  "dashboard": { "title": "Dasbor", "today": "Hari Ini", "yesterday": "Kemarin", "thisWeek": "Minggu Ini", "lastWeek": "Minggu Lalu", "thisMonth": "Bulan Ini", "lastMonth": "Bulan Lalu" },
  "transactions": { "add": "Tambah Transaksi", "amount": "Jumlah", "note": "Catatan", "category": "Kategori", "date": "Tanggal", "filter": "Filter" },
  "categories": { "food": "Makanan", "transportation": "Transportasi", "entertainment": "Hiburan", "housing": "Perumahan", "utilities": "Utilitas", "shopping": "Belanja", "health": "Kesehatan", "education": "Pendidikan", "travel": "Perjalanan", "other": "Lainnya" },
  "language": { "en": "English", "id": "Bahasa Indonesia" }
}
```

---

This approach provides scalable, maintainable multilingual support for the Clair Wallet web app. See this doc for details, code samples, and future recommendations.
