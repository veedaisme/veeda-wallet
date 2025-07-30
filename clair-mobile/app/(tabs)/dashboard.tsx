import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SpendingCard } from '@/components/dashboard/SpendingCard'
import { ChartModal } from '@/components/dashboard/ChartModal'
import { useAuth } from '@/hooks/useAuthV2'
import { useDashboardData } from '@/hooks/queries/useDashboard'

export default function DashboardScreen() {
  const { user } = useAuth()
  const { data: dashboardData, isLoading, refetch, isRefetching } = useDashboardData(user?.id || null)
  
  const [chartModal, setChartModal] = useState<{
    open: boolean
    type: 'week' | 'month' | null
  }>({
    open: false,
    type: null,
  })

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.loadingGrid}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.loadingCard}>
                <View style={styles.loadingTitle} />
                <View style={styles.loadingAmount} />
                <View style={styles.loadingSubtext} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // Show error state
  if (!dashboardData || !dashboardData.analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load dashboard data</Text>
          <Text style={styles.errorSubtext}>An unexpected error occurred</Text>
        </View>
      </SafeAreaView>
    )
  }

  const analytics = dashboardData.analytics

  // Calculate percentage changes like web
  const todayChange = analytics.today && analytics.yesterday 
    ? ((analytics.today - analytics.yesterday) / analytics.yesterday) * 100
    : undefined
    
  const weekChange = analytics.weeklyComparison
  const monthChange = analytics.monthlyComparison

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spendingGrid}>
          <SpendingCard
            title="Today"
            amount={analytics.today || 0}
            change={todayChange}
            previousLabel="Yesterday"
            previousAmount={analytics.yesterday || 0}
          />
          <SpendingCard
            title="This Week"
            amount={analytics.thisWeek || 0}
            change={weekChange}
            previousLabel="Last Week"
            previousAmount={analytics.lastWeek || 0}
            onClick={() => setChartModal({ open: true, type: "week" })}
          />
          <SpendingCard
            title="This Month"
            amount={analytics.thisMonth || 0}
            change={monthChange}
            previousLabel="Last Month"
            previousAmount={analytics.lastMonth || 0}
            onClick={() => setChartModal({ open: true, type: "month" })}
          />
        </View>
      </ScrollView>

      {/* Chart Modal */}
      <ChartModal
        visible={chartModal.open}
        onClose={() => setChartModal({ open: false, type: null })}
        title={chartModal.type === 'week' ? 'This Week' : 'This Month'}
        type={chartModal.type!}
        data={chartModal.type ? {
          current: chartModal.type === 'week' ? analytics.thisWeek || 0 : analytics.thisMonth || 0,
          previous: chartModal.type === 'week' ? analytics.lastWeek || 0 : analytics.lastMonth || 0,
          change: chartModal.type === 'week' ? weekChange || 0 : monthChange || 0
        } : undefined}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // Account for tab bar
  },
  spendingGrid: {
    gap: 24,
  },
  // Loading states
  loadingGrid: {
    gap: 24,
    padding: 24,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    height: 120,
  },
  loadingTitle: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    width: '50%',
    marginBottom: 16,
  },
  loadingAmount: {
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    width: '75%',
    marginBottom: 8,
  },
  loadingSubtext: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    width: '33%',
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
})