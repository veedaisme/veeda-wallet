import React from 'react'
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useHaptics } from '@/hooks/useHaptics'

interface FloatingActionButtonProps {
  onPress: () => void
  icon: React.ReactNode
  size?: 'small' | 'medium' | 'large'
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  backgroundColor?: string
  hapticFeedback?: boolean
  style?: ViewStyle
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  size = 'medium',
  position = 'bottom-right',
  backgroundColor,
  hapticFeedback = true,
  style,
}) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { onButtonPress } = useHaptics()
  const scaleValue = new Animated.Value(1)

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  const handlePress = () => {
    if (hapticFeedback) {
      onButtonPress()
    }
    onPress()
  }

  const getFABStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      borderRadius: 50,
      backgroundColor: backgroundColor || colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.width = 48
        baseStyle.height = 48
        break
      case 'large':
        baseStyle.width = 72
        baseStyle.height = 72
        break
      default: // medium
        baseStyle.width = 56
        baseStyle.height = 56
    }

    // Position styles
    switch (position) {
      case 'bottom-left':
        baseStyle.bottom = 24
        baseStyle.left = 24
        break
      case 'bottom-center':
        baseStyle.bottom = 24
        baseStyle.alignSelf = 'center'
        break
      default: // bottom-right
        baseStyle.bottom = 24
        baseStyle.right = 24
    }

    return baseStyle
  }

  const fabStyle = getFABStyle()

  return (
    <Animated.View style={[fabStyle, { transform: [{ scale: scaleValue }] }, style]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {icon}
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
})