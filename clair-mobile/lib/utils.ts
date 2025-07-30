import { format, formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Format currency amount in IDR (matching web implementation)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number as Indonesian Rupiah (IDR) with compact option
 * @param amount - The amount to format
 * @param options - Formatting options  
 * @returns Formatted IDR string
 */
export const formatIDR = (amount: number | string, options: { compact?: boolean } = {}): string => {
  // Convert string to number if needed
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  // Format with IDR locale and currency
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: options.compact ? "compact" : "standard",
    compactDisplay: "short",
  })

  return formatter.format(numAmount)
}

/**
 * Format number with thousands separator
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Format date for display
 */
export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Generate a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Check if string is valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sleep function for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}