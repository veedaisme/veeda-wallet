import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/ui/Card'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatCurrency } from '@/lib/utils'

interface SpendingCardProps {
  title: string
  amount: number
  previousAmount?: number
  percentageChange?: number
  onPress?: () => void
  style?: any
}

export function SpendingCard({
  title,
  amount,
  previousAmount,
  percentageChange,
  onPress,
  style,
}: SpendingCardProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const isClickable = !!onPress
  const hasComparison = typeof percentageChange === 'number' && !isNaN(percentageChange)
  const isIncrease = percentageChange && percentageChange > 0
  const changeColor = isIncrease ? colors.error : colors.success

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={!isClickable}
      activeOpacity={isClickable ? 0.7 : 1}
    >
      <Card style={[
        styles.card,
        isClickable ? { borderWidth: 1, borderColor: colors.border } : undefined
      ]}>
        <View style={styles.content}>
          {/* Header with title and chevron */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textSecondary }]}>
              {title}
            </Text>
            {isClickable && (
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={colors.textMuted} 
              />
            )}
          </View>

          {/* Main amount */}
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatCurrency(amount)}
          </Text>

          {/* Comparison data */}
          {hasComparison && previousAmount !== undefined && (
            <View style={styles.comparison}>
              <View style={styles.changeIndicator}>
                <Ionicons
                  name={isIncrease ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={changeColor}
                />
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {isIncrease ? '+' : ''}{percentageChange!.toFixed(1)}%
                </Text>
              </View>
              
              <Text style={[styles.previousLabel, { color: colors.textMuted }]}>
                vs {getPreviousLabel(title)}: {formatCurrency(previousAmount)}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  )
}

function getPreviousLabel(title: string): string {
  switch (title.toLowerCase()) {
    case 'today':
      return 'Yesterday'
    case 'this week':
      return 'Last week'
    case 'this month':
      return 'Last month'
    default:
      return 'Previous'
  }
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
  },
  card: {
    minHeight: 100,
  },
  content: {
    justifyContent: 'space-between',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  comparison: {
    marginTop: 8,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  previousLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
})