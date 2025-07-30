import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { TransactionFiltersComponent } from '@/components/transactions/TransactionFilters'
import { SortControls } from '@/components/transactions/SortControls'
import { useAuth } from '@/hooks/useAuthV2'
import { useTransactions } from '@/hooks/queries/useTransactions'
import { useAppStore } from '@/stores/appStore'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryIcon, getCategoryColor } from '@/constants/Categories'
import type { Transaction, TransactionFilters } from '@/types/transaction'

export default function TransactionsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const { setEditingTransactionId, setTransactionModalOpen } = useAppStore()

  // Combine search and filters
  const combinedFilters = {
    ...filters,
    ...(searchQuery ? { search: searchQuery } : {}),
  }

  const { 
    data: transactions = [], 
    isLoading, 
    refetch, 
    isRefetching 
  } = useTransactions(user?.id || null, {
    sortField,
    sortDirection,
    filters: Object.keys(combinedFilters).length > 0 ? combinedFilters : undefined,
  })

  const handleAddTransaction = () => {
    router.push('/modals/add-transaction')
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id)
    router.push('/modals/edit-transaction')
  }

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const handleSort = (field: 'date' | 'amount' | 'category') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const renderTransactionItem = ({ item: transaction }: { item: Transaction }) => (
    <Card 
      onPress={() => handleEditTransaction(transaction)}
      style={styles.transactionCard}
    >
      <View style={styles.transactionContent}>
        <View style={styles.transactionLeft}>
          <View style={[
            styles.categoryIconContainer,
            { backgroundColor: getCategoryColor(transaction.category as any) + '20' } // 20 for opacity
          ]}>
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(transaction.category as any)}
            </Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionCategory, { color: colors.text }]}>
              {transaction.category}
            </Text>
            {transaction.note && (
              <Text style={[styles.transactionNote, { color: colors.textSecondary }]}>
                {transaction.note}
              </Text>
            )}
            <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
              {formatDate(transaction.date)}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: colors.text }]}>
            {formatCurrency(transaction.amount)}
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={colors.textMuted} 
          />
        </View>
      </View>
    </Card>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Transactions Yet
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        Start tracking your expenses by adding your first transaction
      </Text>
    </View>
  )

  const renderSearchResults = () => {
    if (searchQuery && transactions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Results Found
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Try adjusting your search terms
          </Text>
        </View>
      )
    }
    return null
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading transactions..." overlay />
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Transactions
        </Text>
        <TouchableOpacity 
          onPress={handleAddTransaction}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchAndSortContainer}>
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={
            <Ionicons name="search" size={20} color={colors.icon} />
          }
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.icon} />
              </TouchableOpacity>
            ) : undefined
          }
          style={styles.searchInput}
        />
        <SortControls
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </View>

      <View style={styles.filtersContainer}>
        <TransactionFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={searchQuery ? renderSearchResults() : renderEmptyState()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FloatingActionButton
        onPress={handleAddTransaction}
        icon={<Ionicons name="add" size={24} color="#ffffff" />}
        position="bottom-right"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  searchAndSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
  },
  filtersContainer: {
    paddingHorizontal: 24,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Account for FAB and tab bar
  },
  transactionCard: {
    marginVertical: 4,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 14,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
})