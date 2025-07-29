import * as Haptics from 'expo-haptics'

/**
 * Haptic feedback utilities for consistent feedback across the app
 */
export const haptics = {
  // Light haptic feedback for subtle interactions
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Medium haptic feedback for standard interactions
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  // Heavy haptic feedback for important interactions
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  // Rigid haptic feedback for firm interactions
  rigid: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
  
  // Soft haptic feedback for gentle interactions
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
  
  // Selection feedback for picking items
  selection: () => Haptics.selectionAsync(),
  
  // Success notification feedback
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  
  // Error notification feedback
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  
  // Warning notification feedback
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
}

/**
 * Convenience functions for common use cases
 */
export const triggerHaptic = {
  // For button presses and taps
  buttonPress: haptics.light,
  
  // For form submissions
  formSubmit: haptics.medium,
  
  // For successful operations
  success: haptics.success,
  
  // For errors and failures
  error: haptics.error,
  
  // For selection in lists or pickers
  selection: haptics.selection,
  
  // For important actions like delete
  important: haptics.heavy,
  
  // For navigation and tab switches
  navigation: haptics.soft,
  
  // For pull to refresh
  refresh: haptics.light,
}