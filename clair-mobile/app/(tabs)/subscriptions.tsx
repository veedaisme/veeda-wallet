import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { Card } from '@/components/ui/Card'
import { FloatingActionButton } from '@/components/ui/FloatingActionButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/hooks/useAuthV2'
import { useConsolidatedSubscriptions } from '@/hooks/queries/useSubscriptions'
import { useAppStore } from '@/stores/appStore'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { formatCurrency, formatDate, capitalize } from '@/lib/utils'
import type { Subscription, ProjectedSubscription } from '@/types/subscription'

export default function SubscriptionsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()
  const { setEditingSubscriptionId } = useAppStore()
  
  // Currency toggle state (feature flag enabled by default for mobile)
  const [showInIDR, setShowInIDR] = useState(true)

  // Calculate projection end date (12 months from now)
  const projectionEndDate = React.useMemo(() => {
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 12)
    return endDate.toISOString().split('T')[0] // YYYY-MM-DD
  }, [])

  const { 
    data: consolidatedData,
    isLoading, 
    refetch, 
    isRefetching 
  } = useConsolidatedSubscriptions(user?.id, projectionEndDate)

  // Extract data from consolidated response
  const subscriptionSummary = consolidatedData?.subscription_summary || null

  const handleAddSubscription = () => {
    router.push('/modals/add-subscription')
  }

  const handleEditSubscription = (subscription: Subscription | ProjectedSubscription) => {
    // For projected subscriptions, extract the original subscription ID
    const subscriptionId = 'original_payment_date' in subscription 
      ? subscription.id.split('-')[0] // Remove projection suffix
      : subscription.id
    setEditingSubscriptionId(subscriptionId)
    router.push('/modals/add-subscription') // Will show edit mode based on ID
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'calendar-outline'
      case 'quarterly':
        return 'calendar-outline'
      case 'annually':
        return 'calendar-outline'
      default:
        return 'repeat-outline'
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return colors.info
      case 'quarterly':
        return colors.warning
      case 'annually':
        return colors.success
      default:
        return colors.primary
    }
  }

  // Group projected subscriptions by month-year
  const groupedSubscriptions = React.useMemo(() => {
    const projectedSubscriptions = consolidatedData?.projected_subscriptions || []
    return projectedSubscriptions.reduce<Record<string, ProjectedSubscription[]>>((acc, subscription) => {
      const date = new Date(subscription.projected_payment_date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthYear]) {
        acc[monthYear] = []
      }
      
      acc[monthYear].push(subscription)
      return acc
    }, {})
  }, [consolidatedData?.projected_subscriptions])

  // Get month name helper
  const getMonthName = (monthYear: string) => {
    const [year, month] = monthYear.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  // Helper function to calculate days until payment and urgency
  const getDaysUntilPayment = (paymentDate: string) => {
    const today = new Date()
    const payment = new Date(paymentDate)
    const diffTime = payment.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    let statusText = ''
    let urgencyLevel = 'normal' // normal, warning, danger
    
    if (diffDays === 0) {
      statusText = 'Due today'
      urgencyLevel = 'warning'
    } else if (diffDays === 1) {
      statusText = 'Due tomorrow'
      urgencyLevel = 'warning'
    } else if (diffDays < 0) {
      statusText = 'Past due'
      urgencyLevel = 'danger'
    } else if (diffDays <= 3) {
      statusText = `Due in ${diffDays} days`
      urgencyLevel = 'warning'
    } else {
      statusText = `Due in ${diffDays} days`
      urgencyLevel = 'normal'
    }
    
    return { statusText, urgencyLevel, diffDays }
  }

  // Get card border color based on urgency
  const getCardBorderColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'danger':
        return colors.error
      case 'warning':
        return colors.primary
      default:
        return colors.border
    }
  }

  const renderSubscriptionItem = ({ item: subscription }: { item: ProjectedSubscription }) => {
    const paymentInfo = getDaysUntilPayment(subscription.projected_payment_date)
    const borderColor = getCardBorderColor(paymentInfo.urgencyLevel)
    
    return (
    <Card 
      onPress={() => handleEditSubscription(subscription)}
      style={[styles.subscriptionCard, { borderLeftWidth: 4, borderLeftColor: borderColor }]}
    >
      <View style={styles.subscriptionContent}>
        <View style={styles.subscriptionLeft}>
          <View style={[
            styles.frequencyIconContainer,
            { backgroundColor: getFrequencyColor(subscription.frequency) + '20' }
          ]}>
            <Ionicons 
              name={getFrequencyIcon(subscription.frequency) as any} 
              size={20} 
              color={getFrequencyColor(subscription.frequency)} 
            />
          </View>
          <View style={styles.subscriptionInfo}>
            <Text style={[styles.subscriptionName, { color: colors.text }]}>
              {subscription.provider_name}
            </Text>
            <Text style={[styles.subscriptionFrequency, { color: colors.textSecondary }]}>
              {capitalize(subscription.frequency)} • {subscription.original_currency}
            </Text>
            <Text style={[styles.subscriptionDate, { color: colors.textMuted }]}>
              {formatDate(subscription.projected_payment_date)} • {paymentInfo.statusText}
            </Text>
          </View>
        </View>
        <View style={styles.subscriptionRight}>
          <Text style={[styles.subscriptionAmount, { color: colors.text }]}>
            {showInIDR 
              ? formatCurrency(subscription.amount_in_idr)
              : subscription.original_currency === 'IDR'
                ? formatCurrency(subscription.original_amount)
                : `${subscription.original_currency} ${subscription.original_amount.toFixed(2)}`
            }
          </Text>
          {showInIDR && subscription.original_currency !== 'IDR' && (
            <Text style={[styles.originalAmount, { color: colors.textMuted }]}>
              ({subscription.original_currency} {subscription.original_amount.toFixed(2)})
            </Text>
          )}
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={colors.textMuted} 
          />
        </View>
      </View>
    </Card>
    )
  }

  const renderSummaryCards = () => {
    if (!subscriptionSummary) return null

    return (
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Monthly Spending
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>
            {showInIDR 
              ? formatCurrency(subscriptionSummary.total_monthly_recurring)
              : `Mixed currencies`
            }
          </Text>
        </Card>
        
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Yearly Spending
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.success }]}>
            {showInIDR 
              ? formatCurrency(subscriptionSummary.total_monthly_recurring * 12)
              : `Mixed currencies`
            }
          </Text>
        </Card>
        
        <TouchableOpacity
          style={[styles.summaryCard, styles.clickableSummaryCard]}
          activeOpacity={0.7}
        >
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Active Subscriptions
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.info }]}>
            {subscriptionSummary.subscription_count}
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={colors.textMuted} 
            style={styles.summaryIcon}
          />
        </TouchableOpacity>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="repeat-outline" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Subscriptions Yet
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        Start tracking your recurring payments by adding your first subscription
      </Text>
    </View>
  )

  if (isLoading) {
    return <LoadingSpinner message="Loading subscriptions..." overlay />
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Subscriptions
        </Text>
        <View style={styles.headerActions}>
          <View style={styles.currencyToggle}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>
              {showInIDR ? 'IDR' : 'Original'}
            </Text>
            <Switch
              value={showInIDR}
              onValueChange={setShowInIDR}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={showInIDR ? colors.primary : colors.textMuted}
            />
          </View>
          <TouchableOpacity 
            onPress={handleAddSubscription}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={Object.keys(groupedSubscriptions)}
        renderItem={({ item: monthYear }) => (
          <View style={styles.monthSection}>
            <Text style={[styles.monthHeader, { color: colors.textSecondary }]}>
              {getMonthName(monthYear)}
            </Text>
            {groupedSubscriptions[monthYear].map((subscription) => (
              <View key={subscription.id} style={styles.subscriptionWrapper}>
                {renderSubscriptionItem({ item: subscription })}
              </View>
            ))}
          </View>
        )}
        keyExtractor={(item) => item}
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
        ListHeaderComponent={renderSummaryCards()}
        ListEmptyComponent={renderEmptyState()}
        ItemSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />

      <FloatingActionButton
        onPress={handleAddSubscription}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Account for FAB and tab bar
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  clickableSummaryCard: {
    position: 'relative',
  },
  summaryIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subscriptionCard: {
    marginVertical: 4,
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  frequencyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subscriptionFrequency: {
    fontSize: 14,
    marginBottom: 2,
  },
  subscriptionDate: {
    fontSize: 12,
  },
  subscriptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  originalAmount: {
    fontSize: 12,
    textAlign: 'right',
  },
  monthSection: {
    marginBottom: 16,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  subscriptionWrapper: {
    marginBottom: 8,
  },
  sectionSeparator: {
    height: 16,
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