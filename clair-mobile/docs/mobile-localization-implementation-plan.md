# Mobile App Internationalization (i18n) Implementation Plan

## Overview
Implement English and Bahasa Indonesia language support in the mobile app, matching the web's language toggle functionality with a pill toggle button in the header.

## Current Web Implementation Analysis
- **Language Toggle**: Pill-style toggle with flag icons (UK flag for English, Indonesian flag for Bahasa)
- **Location**: Header next to profile avatar
- **Implementation**: Uses Next.js `next-intl` with `useLocale()` and URL-based routing
- **Translation Files**: Structured JSON files (`en.json`, `id.json`) with nested keys

## Mobile Implementation Strategy

### 1. Choose i18n Library
**Library**: `react-i18next` with `i18next`
- **Reason**: Most popular and mature i18n solution for React Native
- **Features**: Hooks support, namespace organization, pluralization, interpolation
- **React Native Compatible**: Works seamlessly with Expo

### 2. Project Structure Setup
```
clair-mobile/
├── locales/
│   ├── en/
│   │   └── translation.json
│   └── id/
│       └── translation.json
├── src/
│   ├── i18n/
│   │   └── index.ts
│   └── components/
│       └── ui/
│           └── LanguagePillToggle.tsx
```

### 3. Implementation Steps

#### Phase 1: Core i18n Setup
- **Install Dependencies**: `npm install react-i18next i18next`
- **Configure i18next**: Create `src/i18n/index.ts` with configuration
- **Language Detection**: Use device locale as default, with AsyncStorage persistence
- **Initialize**: Wrap app with `I18nextProvider` in `_layout.tsx`

#### Phase 2: Translation Files Migration
- **Convert Web JSON**: Migrate web's `en.json` and `id.json` to mobile structure
- **Organize by Feature**: Split into namespaces (dashboard, transactions, subscriptions, auth)
- **Add Mobile-Specific**: Include tab labels and mobile-specific strings

#### Phase 3: Language Toggle Component
- **Create LanguagePillToggle**: React Native version matching web design
- **Flag Icons**: Create SVG flag components (UK flag, Indonesian flag)
- **Styling**: Use same visual design as web (pill shape, active state, shadows)
- **Functionality**: Toggle between 'en' and 'id', persist choice in AsyncStorage

#### Phase 4: Component Integration
- **Header Integration**: Add LanguagePillToggle to dashboard header
- **Replace Hardcoded Text**: Update all components to use `useTranslation()` hook
- **Tab Navigation**: Translate tab labels using i18n
- **Dynamic Content**: Ensure spending cards, modals, and forms are translated

### 4. Key Features to Implement

#### Language Toggle Component
```typescript
// Visual features matching web:
- Pill-shaped container with inner shadow
- Two flag buttons (UK and Indonesian flags)
- Active state: larger scale, ring border, shadow
- Inactive state: opacity and grayscale effects
- Smooth transitions between states
```

#### Translation Hook Usage
```typescript
// Replace hardcoded text with:
const { t } = useTranslation('dashboard');
return <Text>{t('today')}</Text>; // "Today" or "Hari Ini"
```

#### Persistence Strategy
- **AsyncStorage**: Store language preference persistently
- **App Launch**: Restore language on app restart
- **Device Detection**: Use device locale as fallback

### 5. Translation File Structure
```json
// en/translation.json
{
  "app": { "title": "Clair", "logout": "Logout" },
  "dashboard": { 
    "today": "Today", 
    "thisWeek": "This Week",
    "thisMonth": "This Month"
  },
  "tabs": {
    "dashboard": "Dashboard",
    "subscriptions": "Subscriptions", 
    "transactions": "Transactions"
  }
}
```

### 6. Implementation Priority
1. **Core Setup** (i18next configuration, provider setup)
2. **Translation Files** (migrate web translations, add mobile-specific)
3. **Language Toggle** (create component, integrate in header)
4. **Dashboard Translation** (spending cards, headers)
5. **Navigation Translation** (tab labels)
6. **Forms & Modals** (transaction/subscription forms)

## Expected Result
- **Language Toggle**: Pill-style toggle in header matching web design exactly
- **Bilingual Support**: Complete English/Bahasa Indonesia translation
- **Persistent Language**: User choice saved and restored across app sessions
- **Native Experience**: Smooth language switching without app restart
- **Consistent Design**: Visual parity with web language toggle functionality

## Technical Benefits
- **Scalable**: Easy to add more languages in the future
- **Maintainable**: Centralized translation management
- **Performance**: Efficient with built-in optimization features
- **Developer Experience**: Type-safe with proper TypeScript integration

## Files to Create/Modify

### New Files
- `locales/en/translation.json` - English translations
- `locales/id/translation.json` - Bahasa Indonesia translations
- `src/i18n/index.ts` - i18next configuration
- `components/ui/LanguagePillToggle.tsx` - Language toggle component

### Modified Files
- `app/_layout.tsx` - Add I18nextProvider wrapper
- `app/(tabs)/dashboard.tsx` - Add language toggle to header, translate text
- `app/(tabs)/_layout.tsx` - Translate tab labels
- `components/dashboard/SpendingCard.tsx` - Translate card text
- All modal and form components - Replace hardcoded strings

## Development Timeline
- **Week 1**: Core setup, translation files migration
- **Week 2**: Language toggle component, header integration
- **Week 3**: Dashboard and navigation translation
- **Week 4**: Forms, modals, and remaining components translation
- **Week 5**: Testing, refinement, and documentation