import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { SpendingCard } from '@/components/dashboard/SpendingCard'
import { ChartModal } from '@/components/dashboard/ChartModal'
import { UpcomingSubscriptions } from '@/components/dashboard/UpcomingSubscriptions'
import { QuickExpenseEntry } from '@/components/dashboard/QuickExpenseEntry'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardData } from '@/hooks/queries/useDashboard'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatCurrency } from '@/lib/utils'

export default function DashboardScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user, signOut } = useAuth()
  const { data: dashboardData, isLoading, refetch, isRefetching } = useDashboardData(user?.id || null)
  
  const [chartModal, setChartModal] = useState<{
    visible: boolean
    type: 'today' | 'week' | 'month' | null
    title: string
  }>({
    visible: false,
    type: null,
    title: '',
  })

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." overlay />
  }

  const analytics = dashboardData?.analytics
  const categoryBreakdown = dashboardData?.categoryBreakdown || []
  const recentTransactions = dashboardData?.recentTransactions || []

  const openChartModal = (type: 'today' | 'week' | 'month', title: string) => {
    setChartModal({
      visible: true,
      type,
      title,
    })
  }

  const closeChartModal = () => {
    setChartModal({
      visible: false,
      type: null,
      title: '',
    })
  }

  const getChartData = (type: 'today' | 'week' | 'month') => {
    switch (type) {
      case 'today':
        return {
          current: analytics?.today || 0,
          previous: analytics?.yesterday || 0,
          change: analytics?.today && analytics?.yesterday 
            ? ((analytics.today - analytics.yesterday) / analytics.yesterday) * 100
            : 0
        }
      case 'week':
        return {
          current: analytics?.thisWeek || 0,
          previous: analytics?.lastWeek || 0,
          change: analytics?.weeklyComparison || 0
        }
      case 'month':
        return {
          current: analytics?.thisMonth || 0,
          previous: analytics?.lastMonth || 0,
          change: analytics?.monthlyComparison || 0
        }
      default:
        return { current: 0, previous: 0, change: 0 }
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Good morning
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              Welcome back!
            </Text>
          </View>
          <Button
            title="Logout"
            variant="ghost"
            size="small"
            onPress={signOut}
            rightIcon={
              <Ionicons name="log-out-outline" size={16} color={colors.primary} />
            }
          />
        </View>

        {/* Enhanced Spending Overview Cards */}
        <View style={styles.overviewSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Spending Overview
          </Text>
          
          <View style={styles.overviewGrid}>
            <SpendingCard
              title="Today"
              amount={analytics?.today || 0}
              previousAmount={analytics?.yesterday || 0}
              percentageChange={analytics?.today && analytics?.yesterday 
                ? ((analytics.today - analytics.yesterday) / analytics.yesterday) * 100
                : undefined}
              onPress={() => openChartModal('today', 'Today')}
            />

            <SpendingCard
              title="This Week"
              amount={analytics?.thisWeek || 0}
              previousAmount={analytics?.lastWeek || 0}
              percentageChange={analytics?.weeklyComparison}
              onPress={() => openChartModal('week', 'This Week')}
            />

            <SpendingCard
              title="This Month"
              amount={analytics?.thisMonth || 0}
              previousAmount={analytics?.lastMonth || 0}
              percentageChange={analytics?.monthlyComparison}
              onPress={() => openChartModal('month', 'This Month')}
            />

            <Card style={styles.overviewCard}>
              <View style={styles.overviewCardContent}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                  Total Spending
                </Text>
                <Text style={[styles.overviewAmount, { color: colors.text }]}>
                  {formatCurrency((analytics?.thisMonth || 0) + (analytics?.lastMonth || 0))}
                </Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Category Breakdown
            </Text>
            
            <Card>
              <View style={styles.categoryList}>
                {categoryBreakdown.slice(0, 5).map((category, index) => (
                  <View key={category.category} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <View style={[
                        styles.categoryDot,
                        { backgroundColor: colors.categories[category.category as keyof typeof colors.categories] || colors.primary }
                      ]} />
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {category.category}
                      </Text>
                    </View>
                    <View style={styles.categoryAmount}>
                      <Text style={[styles.categoryAmountText, { color: colors.text }]}>
                        {formatCurrency(category.amount)}
                      </Text>
                      <Text style={[styles.categoryPercentage, { color: colors.textSecondary }]}>
                        {category.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Spending Chart */}
        <View style={styles.section}>
          <SpendingChart analytics={analytics} />
        </View>

        {/* Quick Expense Entry */}
        <View style={styles.section}>
          <QuickExpenseEntry />
        </View>

        {/* Upcoming Subscriptions */}
        <View style={styles.section}>
          <UpcomingSubscriptions />
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Transactions
            </Text>
            
            <Card>
              <View style={styles.transactionList}>
                {recentTransactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionCategory, { color: colors.text }]}>
                        {transaction.category}
                      </Text>
                      {transaction.note && (
                        <Text style={[styles.transactionNote, { color: colors.textSecondary }]}>
                          {transaction.note}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.transactionAmount, { color: colors.text }]}>
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Empty State */}
        {!analytics && categoryBreakdown.length === 0 && recentTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Data Yet
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Start by adding some transactions to see your spending insights
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Chart Modal */}
      <ChartModal
        visible={chartModal.visible}
        onClose={closeChartModal}
        title={chartModal.title}
        type={chartModal.type!}
        data={chartModal.type ? getChartData(chartModal.type) : undefined}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Account for tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  overviewSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    width: '48%',
    minHeight: 80,
  },
  overviewCardContent: {
    justifyContent: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  overviewAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  categoryList: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryAmountText: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionList: {
    gap: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionNote: {
    fontSize: 14,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '500',
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
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
})