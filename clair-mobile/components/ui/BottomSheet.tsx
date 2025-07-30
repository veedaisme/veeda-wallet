import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import { BackHandler, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import GorhomBottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export interface BottomSheetMethods {
  open: () => void
  close: () => void
  isOpen: () => boolean
}

interface BottomSheetProps {
  children: React.ReactNode
  snapPoints?: (string | number)[]
  enableDynamicSizing?: boolean
  enableBackdropDismiss?: boolean
  enableSwipeToDismiss?: boolean
  onOpen?: () => void
  onClose?: () => void
  initialIndex?: number
  maxDynamicContentSize?: number
}

export const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(({
  children,
  snapPoints = ['50%'],
  enableDynamicSizing = false,
  enableBackdropDismiss = true,
  enableSwipeToDismiss = true,
  onOpen,
  onClose,
  initialIndex = -1, // Start closed
  maxDynamicContentSize,
}, ref) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const insets = useSafeAreaInsets()
  
  const bottomSheetRef = useRef<GorhomBottomSheet>(null)
  const currentIndexRef = useRef(initialIndex)

  // Calculate maximum content size accounting for safe areas and tab bar
  const calculatedMaxDynamicContentSize = useMemo(() => {
    if (maxDynamicContentSize) return maxDynamicContentSize
    
    // Reserve space for:
    // - Status bar (top inset)
    // - Tab bar (bottom inset + 60px for tab bar height)
    // - Handle bar (24px)
    // - Some breathing room (40px)
    const reservedSpace = insets.top + insets.bottom + 60 + 24 + 40
    return SCREEN_HEIGHT - reservedSpace
  }, [maxDynamicContentSize, insets])

  // Memoize snap points for dynamic sizing
  const memoizedSnapPoints = useMemo(() => {
    if (enableDynamicSizing) {
      // For single-stage opening, provide minimal snap points
      // The library will add the dynamic content height as the main snap point
      return []
    }
    return snapPoints
  }, [snapPoints, enableDynamicSizing])

  // Imperative methods
  useImperativeHandle(ref, () => ({
    open: () => {
      bottomSheetRef.current?.snapToIndex(0)
    },
    close: () => {
      bottomSheetRef.current?.close()
    },
    isOpen: () => {
      return currentIndexRef.current >= 0
    },
  }), [])

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    currentIndexRef.current = index
    
    if (index >= 0) {
      // Sheet is open
      onOpen?.()
    } else {
      // Sheet is closed
      onClose?.()
    }
  }, [onOpen, onClose])

  // Handle Android back button
  const handleBackPress = useCallback(() => {
    if (currentIndexRef.current >= 0) {
      bottomSheetRef.current?.close()
      return true
    }
    return false
  }, [])

  // Custom backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        enableTouchThrough={false}
        onPress={enableBackdropDismiss ? () => bottomSheetRef.current?.close() : undefined}
      />
    ),
    [enableBackdropDismiss]
  )

  // Register back handler
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress)
    return () => backHandler.remove()
  }, [handleBackPress])

  return (
    <GorhomBottomSheet
      ref={bottomSheetRef}
      snapPoints={memoizedSnapPoints}
      index={initialIndex}
      onChange={handleSheetChanges}
      enablePanDownToClose={enableSwipeToDismiss}
      enableDynamicSizing={enableDynamicSizing}
      maxDynamicContentSize={calculatedMaxDynamicContentSize}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: colors.background,
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: 40,
        height: 4,
      }}
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <BottomSheetView style={{
        paddingHorizontal: 24,
        paddingBottom: Math.max(24, insets.bottom),
        backgroundColor: colors.background,
      }}>
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  )
})

BottomSheet.displayName = 'BottomSheet'