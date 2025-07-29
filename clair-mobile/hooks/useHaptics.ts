import { useCallback } from 'react'
import { Platform } from 'react-native'
import { haptics, triggerHaptic } from '@/lib/haptics'

export const useHaptics = () => {
  // Base haptic functions
  const triggerLight = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.light()
    }
  }, [])

  const triggerMedium = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.medium()
    }
  }, [])

  const triggerHeavy = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.heavy()
    }
  }, [])

  const triggerRigid = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.rigid()
    }
  }, [])

  const triggerSoft = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.soft()
    }
  }, [])

  const triggerSelection = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.selection()
    }
  }, [])

  const triggerSuccess = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.success()
    }
  }, [])

  const triggerError = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.error()
    }
  }, [])

  const triggerWarning = useCallback(() => {
    if (Platform.OS === 'ios') {
      haptics.warning()
    }
  }, [])

  // Convenience functions for common use cases
  const onButtonPress = useCallback(() => {
    triggerHaptic.buttonPress()
  }, [])

  const onFormSubmit = useCallback(() => {
    triggerHaptic.formSubmit()
  }, [])

  const onSuccess = useCallback(() => {
    triggerHaptic.success()
  }, [])

  const onError = useCallback(() => {
    triggerHaptic.error()
  }, [])

  const onSelection = useCallback(() => {
    triggerHaptic.selection()
  }, [])

  const onImportantAction = useCallback(() => {
    triggerHaptic.important()
  }, [])

  const onNavigation = useCallback(() => {
    triggerHaptic.navigation()
  }, [])

  const onRefresh = useCallback(() => {
    triggerHaptic.refresh()
  }, [])

  return {
    // Base functions
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerRigid,
    triggerSoft,
    triggerSelection,
    triggerSuccess,
    triggerError,
    triggerWarning,
    
    // Convenience functions
    onButtonPress,
    onFormSubmit,
    onSuccess,
    onError,
    onSelection,
    onImportantAction,
    onNavigation,
    onRefresh,
  }
}