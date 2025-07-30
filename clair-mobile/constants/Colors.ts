/**
 * Clair Wallet color scheme optimized for financial management app
 * Updated to match web app tangerine theme
 */

const primaryColor = '#DE5C2B';
const primaryLight = '#F5A373';
const primaryDark = '#B94A20';

export const Colors = {
  light: {
    // Text colors
    text: '#1a1a1a',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f9fafb',
    backgroundMuted: '#f3f4f6',
    
    // Primary colors (brand)
    primary: primaryColor,
    primaryLight: primaryLight,
    primaryDark: primaryDark,
    
    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Card and surface colors
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    border: '#e5e7eb',
    
    // Tab colors
    tint: primaryColor,
    tabIconDefault: '#9ca3af',
    tabIconSelected: primaryColor,
    tabBackground: '#ffffff',
    
    // Icon colors
    icon: '#6b7280',
    iconMuted: '#9ca3af',
    
    // Input colors
    inputBackground: '#ffffff',
    inputBorder: '#d1d5db',
    inputBorderFocus: primaryColor,
    inputPlaceholder: '#9ca3af',
    
    // Transaction category colors
    categories: {
      Food: '#f59e0b',
      Transportation: '#3b82f6',
      Housing: '#8b5cf6',
      Entertainment: '#ec4899',
      Shopping: '#ef4444',
      Utilities: '#06b6d4',
      Health: '#10b981',
      Education: '#6366f1',
      Travel: '#f97316',
      'Personal Care': '#84cc16',
      Gifts: '#d946ef',
      Other: '#6b7280',
    },
  },
  dark: {
    // Text colors
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    
    // Background colors
    background: '#111827',
    backgroundSecondary: '#1f2937',
    backgroundMuted: '#374151',
    
    // Primary colors (brand)
    primary: primaryLight,
    primaryLight: '#5fb584',
    primaryDark: primaryColor,
    
    // Semantic colors
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    // Card and surface colors
    card: '#1f2937',
    cardBorder: '#374151',
    border: '#374151',
    
    // Tab colors
    tint: primaryLight,
    tabIconDefault: '#9ca3af',
    tabIconSelected: primaryLight,
    tabBackground: '#1f2937',
    
    // Icon colors
    icon: '#d1d5db',
    iconMuted: '#9ca3af',
    
    // Input colors
    inputBackground: '#374151',
    inputBorder: '#4b5563',
    inputBorderFocus: primaryLight,
    inputPlaceholder: '#9ca3af',
    
    // Transaction category colors
    categories: {
      Food: '#fbbf24',
      Transportation: '#60a5fa',
      Housing: '#a78bfa',
      Entertainment: '#f472b6',
      Shopping: '#f87171',
      Utilities: '#22d3ee',
      Health: '#34d399',
      Education: '#818cf8',
      Travel: '#fb923c',
      'Personal Care': '#a3e635',
      Gifts: '#e879f9',
      Other: '#9ca3af',
    },
  },
};
