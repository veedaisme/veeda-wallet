import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useHaptics } from '@/hooks/useHaptics'
import { format } from 'date-fns'

interface DatePickerInputProps {
  label?: string
  value: string // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void
  error?: string
  success?: boolean
  placeholder?: string
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  error,
  success = false,
  placeholder = 'Select date'
}) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { onButtonPress, onSelection } = useHaptics()
  const [showPicker, setShowPicker] = useState(false)

  // Convert string date to Date object
  const dateValue = value ? new Date(value + 'T00:00:00') : new Date()
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios') // Keep picker open on iOS

    if (selectedDate) {
      onSelection()
      // Convert to YYYY-MM-DD format
      const formattedDate = selectedDate.toISOString().split('T')[0]
      onChange(formattedDate)
    }
  }

  const handleOpenPicker = () => {
    onButtonPress()
    setShowPicker(true)
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder
    try {
      const date = new Date(dateString + 'T00:00:00')
      return format(date, 'MMM dd, yyyy')
    } catch {
      return placeholder
    }
  }

  const getContainerStyle = () => {
    return {
      borderRadius: 8,
      borderWidth: error ? 2 : 1,
      borderColor: error 
        ? colors.error 
        : success && value 
          ? colors.success 
          : colors.inputBorder,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 48,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    }
  }

  const getLabelStyle = () => {
    return {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.text,
      marginBottom: 8,
    }
  }

  const getErrorStyle = () => {
    return {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    }
  }

  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <TouchableOpacity
        style={getContainerStyle()}
        onPress={handleOpenPicker}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{ marginRight: 8 }}>
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={colors.icon} 
            />
          </View>
          <Text style={{
            fontSize: 16,
            color: value ? colors.text : colors.inputPlaceholder,
            flex: 1,
          }}>
            {formatDisplayDate(value)}
          </Text>
        </View>
        
        <Ionicons 
          name="chevron-down-outline" 
          size={16} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {error && <Text style={getErrorStyle()}>{error}</Text>}

      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={dateValue}
          mode="date"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // Don't allow future dates
        />
      )}
    </View>
  )
}