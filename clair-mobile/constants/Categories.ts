import type { TransactionCategory } from '@/types/transaction'

export interface CategoryConfig {
  name: TransactionCategory
  icon: string
  color: string
}

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  Food: '🍽️',
  Transportation: '🚗',
  Housing: '🏠',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Utilities: '⚡',
  Health: '🏥',
  Education: '📚',
  Travel: '✈️',
  'Personal Care': '💅',
  Gifts: '🎁',
  Subscription: '🔄',
  Other: '📦',
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { name: 'Food', icon: '🍽️', color: '#f59e0b' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { name: 'Housing', icon: '🏠', color: '#8b5cf6' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { name: 'Shopping', icon: '🛍️', color: '#ef4444' },
  { name: 'Utilities', icon: '⚡', color: '#06b6d4' },
  { name: 'Health', icon: '🏥', color: '#10b981' },
  { name: 'Education', icon: '📚', color: '#6366f1' },
  { name: 'Travel', icon: '✈️', color: '#f97316' },
  { name: 'Personal Care', icon: '💅', color: '#84cc16' },
  { name: 'Gifts', icon: '🎁', color: '#d946ef' },
  { name: 'Subscription', icon: '🔄', color: '#6366f1' },
  { name: 'Other', icon: '📦', color: '#6b7280' },
]

export const getCategoryIcon = (category: TransactionCategory): string => {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.Other
}

export const getCategoryColor = (category: TransactionCategory): string => {
  const config = CATEGORY_CONFIGS.find(c => c.name === category)
  return config?.color || CATEGORY_CONFIGS.find(c => c.name === 'Other')!.color
}