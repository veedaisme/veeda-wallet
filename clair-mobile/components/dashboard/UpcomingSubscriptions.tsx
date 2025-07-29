import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/ui/Card'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow, parseISO, addDays, startOfMonth, endOfMonth } from 'date-fns'

interface UpcomingSubscription {
  id: string
  provider_name: string
  amount: number
  currency: string
  payment_date: string
  daysUntilPayment: number
}

const fetchUpcomingSubscriptions = async (userId: string): Promise<UpcomingSubscription[]> => {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, provider_name, amount, currency, payment_date')
    .eq('user_id', userId)
    .gte('payment_date', monthStart.toISOString().split('T')[0])
    .lte('payment_date', monthEnd.toISOString().split('T')[0])
    .order('payment_date', { ascending: true })

  if (error) throw error

  // Calculate days until payment and filter upcoming ones (next 7 days)
  const upcoming = (data || [])
    .map(sub => {
      const paymentDate = parseISO(sub.payment_date + 'T00:00:00')
      const daysUntilPayment = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        ...sub,
        daysUntilPayment,
      }
    })
    .filter(sub => sub.daysUntilPayment >= 0 && sub.daysUntilPayment <= 7)
    .slice(0, 3) // Show only top 3

  return upcoming
}

export function UpcomingSubscriptions() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { user } = useAuth()

  const { data: upcomingSubscriptions, isLoading } = useQuery({
    queryKey: ['upcomingSubscriptions', user?.id],
    queryFn: () => fetchUpcomingSubscriptions(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }
    return `${currency} ${amount.toLocaleString()}`
  }

  const getDaysText = (days: number) => {
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  const getDaysColor = (days: number) => {
    if (days === 0) return colors.error
    if (days <= 2) return colors.warning || '#f59e0b'
    return colors.textSecondary
  }

  if (isLoading) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Upcoming Payments
          </Text>
        </View>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </Card>
    )
  }

  if (!upcomingSubscriptions || upcomingSubscriptions.length === 0) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Upcoming Payments
          </Text>
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No upcoming payments in the next 7 days
        </Text>
      </Card>
    )
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Upcoming Payments
        </Text>
      </View>
      
      <View style={styles.subscriptionsList}>
        {upcomingSubscriptions.map((subscription) => (
          <View key={subscription.id} style={styles.subscriptionItem}>
            <View style={styles.subscriptionInfo}>
              <Text style={[styles.providerName, { color: colors.text }]}>
                {subscription.provider_name}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>
                {formatCurrency(subscription.amount, subscription.currency)}
              </Text>
            </View>
            <Text style={[
              styles.daysText,
              { color: getDaysColor(subscription.daysUntilPayment) }
            ]}>
              {getDaysText(subscription.daysUntilPayment)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  subscriptionsList: {
    gap: 12,
  },
  subscriptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  amount: {
    fontSize: 12,
    marginTop: 2,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
  },
})