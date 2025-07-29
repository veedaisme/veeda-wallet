import React from 'react'
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  message?: string
  color?: string
  style?: ViewStyle
  overlay?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  message,
  color,
  style,
  overlay = false,
}) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const spinnerColor = color || colors.primary

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    ...(overlay && {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      zIndex: 999,
    }),
  }

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
})