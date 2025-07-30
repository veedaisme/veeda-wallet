import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { ChevronRight, ArrowDown, ArrowUp } from 'lucide-react-native'
import { formatIDR } from '@/lib/utils'

interface SpendingCardProps {
  title: string
  amount: number
  change?: number
  previousLabel: string
  previousAmount: number
  onClick?: () => void
}

export function SpendingCard({ title, amount, change, previousLabel, previousAmount, onClick }: SpendingCardProps) {
  // Color is red if current amount > previous amount, green otherwise
  const isOverspent = amount > previousAmount
  const absChange = typeof change === "number" ? Math.abs(change) : 0

  return (
    <TouchableOpacity
      style={[
        styles.container,
        onClick ? styles.clickable : undefined
      ]}
      onPress={onClick}
      disabled={!onClick}
      activeOpacity={onClick ? 0.7 : 1}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{formatIDR(amount)}</Text>
        {typeof change === "number" && (
          <View style={styles.changeContainer}>
            {isOverspent ? (
              <ArrowUp size={16} color="#EF4444" />
            ) : (
              <ArrowDown size={16} color="#10B981" />
            )}
            <Text style={[
              styles.changeText,
              { color: isOverspent ? "#EF4444" : "#10B981" }
            ]}>
              {absChange % 1 === 0 ? absChange : absChange.toFixed(2).replace(/\.?0+$/, "")}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.previousText}>
        {previousLabel} {formatIDR(previousAmount)}
      </Text>
    </TouchableOpacity>
  )
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  clickable: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  amount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previousText: {
    color: '#6B7280',
    fontSize: 14,
  },
})