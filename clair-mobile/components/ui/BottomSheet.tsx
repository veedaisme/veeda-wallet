import React, { useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
  BackHandler,
} from 'react-native'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface BottomSheetProps {
  isVisible: boolean
  onClose: () => void
  children: React.ReactNode
  height?: number | string
  enableBackdropDismiss?: boolean
  enableSwipeToDismiss?: boolean
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  height = 'auto',
  enableBackdropDismiss = true,
  enableSwipeToDismiss = true,
}) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  
  // Calculate sheet height
  const sheetHeight = typeof height === 'string' 
    ? (parseFloat(height.replace('%', '')) / 100) * SCREEN_HEIGHT
    : height || SCREEN_HEIGHT * 0.5 // Default to 50% if undefined

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableSwipeToDismiss,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enableSwipeToDismiss && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > sheetHeight * 0.3 || gestureState.vy > 0.5) {
          closeBottomSheet()
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  const openBottomSheet = () => {
    // Reset translateY to start position before animating
    translateY.setValue(sheetHeight)
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const closeBottomSheet = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose()
    })
  }

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) {
        closeBottomSheet()
        return true
      }
      return false
    })

    return () => backHandler.remove()
  }, [isVisible])

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      openBottomSheet()
    } else {
      // When not visible, immediately reset values without animation
      translateY.setValue(sheetHeight)
      backdropOpacity.setValue(0)
    }
  }, [isVisible, sheetHeight])

  if (!isVisible) {
    return null
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop, 
          { opacity: backdropOpacity }
        ]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={enableBackdropDismiss ? closeBottomSheet : undefined}
        />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.background,
            height: sheetHeight,
            transform: [{ translateY }],
          },
        ]}
        {...(enableSwipeToDismiss ? panResponder.panHandlers : {})}
        pointerEvents="auto"
      >
        {/* Handle Bar */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
})