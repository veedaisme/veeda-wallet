import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled'
  size?: 'small' | 'medium' | 'large'
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success = false,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'medium',
  style,
  ...props
}) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [isFocused, setIsFocused] = useState(false)

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 12
        baseStyle.paddingVertical = 8
        baseStyle.minHeight = 40
        break
      case 'large':
        baseStyle.paddingHorizontal = 16
        baseStyle.paddingVertical = 16
        baseStyle.minHeight = 56
        break
      default: // medium
        baseStyle.paddingHorizontal = 12
        baseStyle.paddingVertical = 12
        baseStyle.minHeight = 48
    }

    // Variant styles
    if (variant === 'filled') {
      baseStyle.backgroundColor = colors.inputBackground
    } else {
      baseStyle.backgroundColor = colors.background
    }

    // Focus and validation states
    if (error) {
      baseStyle.borderColor = colors.error
      baseStyle.borderWidth = 2
    } else if (success && !isFocused) {
      baseStyle.borderColor = colors.success
    } else if (isFocused) {
      baseStyle.borderColor = colors.inputBorderFocus
    } else {
      baseStyle.borderColor = colors.inputBorder
    }

    return baseStyle
  }

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      color: colors.text,
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

    return baseStyle
  }

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    }
  }

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    }
  }

  const containerStyle = getContainerStyle()
  const inputStyle = getInputStyle()

  return (
    <View style={styles.wrapper}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <View style={[containerStyle, style]}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={inputStyle}
          placeholderTextColor={colors.inputPlaceholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  iconContainer: {
    marginHorizontal: 4,
  },
})