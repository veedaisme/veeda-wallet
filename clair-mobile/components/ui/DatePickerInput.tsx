import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
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
  const [isPickerActive, setIsPickerActive] = useState(false)

  // Convert string date to Date object
  const dateValue = value ? new Date(value + 'T00:00:00') : new Date()
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      onSelection()
      // Convert to YYYY-MM-DD format using local date methods to avoid timezone issues
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      onChange(formattedDate)
      
      // Auto-close picker on iOS after selection
      if (Platform.OS === 'ios') {
        setIsPickerActive(false)
      }
    }
  }

  const handleAndroidDatePicker = () => {
    onButtonPress()
    
    DateTimePickerAndroid.open({
      value: dateValue,
      onChange: handleDateChange,
      mode: 'date',
      is24Hour: true,
      maximumDate: new Date(), // Don't allow future dates
    })
  }

  const handleIOSPickerActivate = () => {
    if (!isPickerActive) {
      onButtonPress()
      setIsPickerActive(true)
    }
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder
    try {
      const date = new Date(dateString + 'T00:00:00')
      return format(date, 'dd MMM yyyy')
    } catch {
      return placeholder
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
      
      {/* iOS Date Picker - Direct component integration */}
      {Platform.OS === 'ios' ? (
        <TouchableOpacity
          onPress={handleIOSPickerActivate}
          activeOpacity={1}
          disabled={isPickerActive}
          style={{
            backgroundColor: colors.background,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: isPickerActive ? colors.primary : colors.border,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isPickerActive ? 1 : 0.7,
          }}
        >
          <DateTimePicker
            testID="dateTimePicker"
            value={dateValue}
            mode="date"
            display="compact"
            onChange={handleDateChange}
            maximumDate={new Date()}
            accentColor={colors.primary}
            themeVariant={colorScheme || 'light'}
            disabled={!isPickerActive}
          />
        </TouchableOpacity>
      ) : (
        /* Android Date Display - Show selected date and trigger native picker */
        <TouchableOpacity
          onPress={handleAndroidDatePicker}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: colors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 48,
          }}
        >
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
            fontWeight: value ? '500' : '400',
          }}>
            {formatDisplayDate(value)}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={colors.icon} 
          />
        </TouchableOpacity>
      )}
      
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  )
}