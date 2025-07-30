import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

interface SortControlsProps {
  sortField: 'date' | 'amount'
  sortDirection: 'asc' | 'desc'
  onSort: (field: 'date' | 'amount') => void
}

export function SortControls({ sortField, sortDirection, onSort }: SortControlsProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const getSortIcon = (field: 'date' | 'amount') => {
    if (sortField !== field) return null
    return (
      <Ionicons
        name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
        size={14}
        color={colors.background}
      />
    )
  }

  const getSortButtonStyle = (field: 'date' | 'amount') => [
    styles.sortButton,
    {
      backgroundColor: sortField === field ? colors.text : colors.border,
    }
  ]

  const getSortTextStyle = (field: 'date' | 'amount') => [
    styles.sortButtonText,
    {
      color: sortField === field ? colors.background : colors.text,
    }
  ]

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onSort('date')}
        style={getSortButtonStyle('date')}
      >
        <Text style={getSortTextStyle('date')}>Date</Text>
        {getSortIcon('date')}
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => onSort('amount')}
        style={getSortButtonStyle('amount')}
      >
        <Text style={getSortTextStyle('amount')}>Amount</Text>
        {getSortIcon('amount')}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
})