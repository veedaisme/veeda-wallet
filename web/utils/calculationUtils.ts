// Utility functions for calculations

/**
 * Calculates the percentage change between two numbers.
 * @param current The current value.
 * @param previous The previous value.
 * @returns The percentage change, or undefined if previous is 0.
 */
export function getChange(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

// Add other calculation utility functions here
