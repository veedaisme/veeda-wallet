import React from 'react'
import { View, TouchableOpacity, ViewStyle, StyleSheet } from 'react-native'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useHaptics } from '@/hooks/useHaptics'

interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'small' | 'medium' | 'large'
  hapticFeedback?: boolean
  style?: ViewStyle
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  padding = 'medium',
  hapticFeedback = true,
  style,
}) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { onSelection } = useHaptics()

  const handlePress = () => {
    if (hapticFeedback) {
      onSelection()
    }
    onPress?.()
  }

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      backgroundColor: colors.card,
    }

    // Padding styles
    switch (padding) {
      case 'none':
        break
      case 'small':
        baseStyle.padding = 12
        break
      case 'large':
        baseStyle.padding = 24
        break
      default: // medium
        baseStyle.padding = 16
    }

    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.shadowColor = '#000'
        baseStyle.shadowOffset = {
          width: 0,
          height: 2,
        }
        baseStyle.shadowOpacity = 0.1
        baseStyle.shadowRadius = 8
        baseStyle.elevation = 4
        break
      case 'outlined':
        baseStyle.borderWidth = 1
        baseStyle.borderColor = colors.cardBorder
        break
      default: // default
        baseStyle.shadowColor = '#000'
        baseStyle.shadowOffset = {
          width: 0,
          height: 1,
        }
        baseStyle.shadowOpacity = 0.05
        baseStyle.shadowRadius = 4
        baseStyle.elevation = 2
    }

    return baseStyle
  }

  const cardStyle = getCardStyle()

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={handlePress}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  )
}