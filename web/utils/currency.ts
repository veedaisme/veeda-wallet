/**
 * Format a number as Indonesian Rupiah (IDR)
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted IDR string
 */
export function formatIDR(amount: number | string, options: { compact?: boolean } = {}): string {
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
 * Parse an IDR string into a number
 * @param value - The IDR string to parse
 * @returns The numeric value
 */
export function parseIDR(value: string): number {
  // Remove currency symbol, dots, and replace comma with dot
  const cleanValue = value
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  return Number.parseFloat(cleanValue)
}
