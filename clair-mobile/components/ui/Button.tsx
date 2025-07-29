import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useHaptics } from '@/hooks/useHaptics'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  hapticFeedback?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  hapticFeedback = true,
  leftIcon,
  rightIcon,
  disabled,
  onPress,
  style,
  ...props
}) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { onButtonPress } = useHaptics()

  const handlePress = (event: any) => {
    if (hapticFeedback) {
      onButtonPress()
    }
    onPress?.(event)
  }

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 12
        baseStyle.paddingVertical = 8
        baseStyle.minHeight = 36
        break
      case 'large':
        baseStyle.paddingHorizontal = 24
        baseStyle.paddingVertical = 16
        baseStyle.minHeight = 56
        break
      default: // medium
        baseStyle.paddingHorizontal = 16
        baseStyle.paddingVertical = 12
        baseStyle.minHeight = 48
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = colors.backgroundSecondary
        baseStyle.borderWidth = 1
        baseStyle.borderColor = colors.cardBorder
        break
      case 'outline':
        baseStyle.backgroundColor = 'transparent'
        baseStyle.borderWidth = 1
        baseStyle.borderColor = colors.primary
        break
      case 'ghost':
        baseStyle.backgroundColor = 'transparent'
        break
      case 'danger':
        baseStyle.backgroundColor = colors.error
        break
      default: // primary
        baseStyle.backgroundColor = colors.primary
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.5
    }

    return baseStyle
  }

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = 14
        break
      case 'large':
        baseStyle.fontSize = 18
        break
      default: // medium
        baseStyle.fontSize = 16
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.color = colors.text
        break
      case 'outline':
        baseStyle.color = colors.primary
        break
      case 'ghost':
        baseStyle.color = colors.primary
        break
      case 'danger':
        baseStyle.color = '#ffffff'
        break
      default: // primary
        baseStyle.color = '#ffffff'
    }

    return baseStyle
  }

  const buttonStyle = getButtonStyle()
  const textStyle = getTextStyle()

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#ffffff' : colors.primary}
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[textStyle, leftIcon && { marginLeft: 8 }, rightIcon && { marginRight: 8 }]}>
            {title}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  )
}