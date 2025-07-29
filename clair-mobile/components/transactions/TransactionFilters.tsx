import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DatePickerInput } from '@/components/ui/DatePickerInput'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { TRANSACTION_CATEGORIES, type TransactionFilters } from '@/types/transaction'

interface TransactionFiltersProps {
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
  onClearFilters: () => void
}

export function TransactionFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: TransactionFiltersProps) {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  )

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length
  }


  if (!isExpanded) {
    return (
      <Card style={styles.container}>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setIsExpanded(true)}
        >
          <View style={styles.expandButtonContent}>
            <Ionicons 
              name="filter-outline" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={[styles.expandButtonText, { color: colors.primary }]}>
              Filters
            </Text>
            {hasActiveFilters && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: colors.background }]}>
                  {getActiveFilterCount()}
                </Text>
              </View>
            )}
          </View>
          <Ionicons 
            name="chevron-down-outline" 
            size={16} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </Card>
    )
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="filter-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Filter Transactions
          </Text>
          {hasActiveFilters && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.background }]}>
                {getActiveFilterCount()}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => setIsExpanded(false)}
          style={styles.collapseButton}
        >
          <Ionicons 
            name="chevron-up-outline" 
            size={16} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContent}>
        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Category
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <Button
              title="All"
              variant={!filters.category ? 'primary' : 'outline'}
              size="small"
              onPress={() => updateFilter('category', undefined)}
              style={styles.categoryFilterButton}
            />
            {TRANSACTION_CATEGORIES.map((category) => (
              <Button
                key={category}
                title={category}
                variant={filters.category === category ? 'primary' : 'outline'}
                size="small"
                onPress={() => updateFilter('category', category)}
                style={styles.categoryFilterButton}
              />
            ))}
          </ScrollView>
        </View>

        {/* Date Range Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Date Range
          </Text>
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInput}>
              <DatePickerInput
                label="From"
                value={filters.dateFrom || ''}
                onChange={(date) => updateFilter('dateFrom', date)}
                placeholder="Start date"
              />
            </View>
            <View style={styles.dateInput}>
              <DatePickerInput
                label="To"  
                value={filters.dateTo || ''}
                onChange={(date) => updateFilter('dateTo', date)}
                placeholder="End date"
              />
            </View>
          </View>
        </View>

        {/* Amount Range Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>
            Amount Range (IDR)
          </Text>
          <View style={styles.amountRangeContainer}>
            <View style={styles.amountInput}>
              <Input
                label="Min Amount"
                placeholder="0"
                value={filters.minAmount?.toString() || ''}
                onChangeText={(text) => {
                  const amount = text ? parseFloat(text) : undefined
                  updateFilter('minAmount', amount)
                }}
                keyboardType="numeric"
                leftIcon={
                  <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
                    Rp
                  </Text>
                }
              />
            </View>
            <View style={styles.amountInput}>
              <Input
                label="Max Amount"
                placeholder="999,999,999"
                value={filters.maxAmount?.toString() || ''}
                onChangeText={(text) => {
                  const amount = text ? parseFloat(text) : undefined
                  updateFilter('maxAmount', amount)
                }}
                keyboardType="numeric"
                leftIcon={
                  <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
                    Rp
                  </Text>
                }
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Clear All"
            variant="outline"
            onPress={() => {
              onClearFilters()
              setIsExpanded(false)
            }}
            style={styles.clearButton}
          />
          <Button
            title="Apply Filters"
            onPress={() => setIsExpanded(false)}
            style={styles.applyButton}
          />
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  expandButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  collapseButton: {
    padding: 4,
  },
  filtersContent: {
    gap: 16,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  categoryFilterButton: {
    minWidth: 80,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  amountRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
})