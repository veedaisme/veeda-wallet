import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User, LogOut } from 'lucide-react-native'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SpendingCard } from '@/components/dashboard/SpendingCard'
import { ChartModal } from '@/components/dashboard/ChartModal'
import { useAuth } from '@/hooks/useAuthV2'
import { useDashboardData } from '@/hooks/queries/useDashboard'

export default function DashboardScreen() {
  const { user, signOut } = useAuth()
  const { data: dashboardData, isLoading, refetch, isRefetching } = useDashboardData(user?.id || null)
  
  const [chartModal, setChartModal] = useState<{
    open: boolean
    type: 'week' | 'month' | null
  }>({
    open: false,
    type: null,
  })
  
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    setProfileMenuOpen(false)
  }

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/clair_v2_transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            <User size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
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
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/clair_v2_transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            <User size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
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
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/clair_v2_transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            <User size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {/* Profile Menu */}
          {profileMenuOpen && (
            <View style={styles.profileMenu}>
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={handleLogout}
              >
                <LogOut size={16} color="#6B7280" />
                <Text style={styles.profileMenuText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
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
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    backgroundColor: 'white',
  },
  logo: {
    height: 88,
    width: 88,
  },
  headerRight: {
    position: 'relative',
  },
  profileButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 8,
  },
  profileMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
    zIndex: 1000,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  profileMenuText: {
    color: '#374151',
    fontSize: 14,
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