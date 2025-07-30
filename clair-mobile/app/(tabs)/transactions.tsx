import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Card } from '@/components/ui/Card'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Header } from '@/components/ui/Header'
import { SortControls } from '@/components/transactions/SortControls'
import { TransactionBottomSheet, type TransactionBottomSheetMethods } from '@/components/transactions/TransactionBottomSheet'
import { useAuth } from '@/hooks/useAuthV2'
import { useTransactions } from '@/hooks/queries/useTransactions'
import { useAppStore } from '@/stores/appStore'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryIcon, getCategoryColor } from '@/constants/Categories'
import type { Transaction } from '@/types/transaction'

export default function TransactionsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'date' | 'amount'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const transactionBottomSheetRef = useRef<TransactionBottomSheetMethods>(null)
  const { setEditingTransactionId: setStoreEditingTransactionId, setTransactionModalOpen } = useAppStore()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search filters
  const searchFilters = debouncedSearchQuery ? { search: debouncedSearchQuery } : {}

  const { 
    data: transactions = [], 
    isLoading, 
    refetch, 
    isRefetching 
  } = useTransactions(user?.id || null, {
    sortField,
    sortDirection,
    filters: Object.keys(searchFilters).length > 0 ? searchFilters : undefined,
  })

  const handleAddTransaction = () => {
    transactionBottomSheetRef.current?.openAddTransaction()
  }

  const handleEditTransaction = (transaction: Transaction) => {
    transactionBottomSheetRef.current?.openEditTransaction(transaction.id)
  }

  const handleSort = (field: 'date' | 'amount') => {
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
            <Text style={[styles.transactionTitle, { color: colors.text }]}>
              {transaction.note || transaction.category}
            </Text>
            <Text style={[styles.transactionSubtitle, { color: colors.textSecondary }]}>
              {transaction.category}
            </Text>
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
      <Header />

      <View style={styles.searchAndSortContainer}>
        <View style={[styles.searchInputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          ) : null}
        </View>
        <SortControls
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </View>


      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
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
        ListFooterComponent={() => <View style={styles.listFooter} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FloatingActionButton
        onPress={handleAddTransaction}
        icon={<Ionicons name="add" size={24} color="#ffffff" />}
        position="bottom-right"
      />

      <TransactionBottomSheet
        ref={transactionBottomSheetRef}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchAndSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  listFooter: {
    height: 200, // Space for FAB (56px) + margin (24px) + tab bar (80px) + safe area (40px)
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
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionSubtitle: {
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