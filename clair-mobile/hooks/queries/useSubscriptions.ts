import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { 
  Subscription, 
  SubscriptionCreateData, 
  SubscriptionUpdateData,
  ConsolidatedSubscriptionData,
  ProjectedSubscription,
  SubscriptionSummary
} from '@/types/subscription'

// Query keys
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (userId: string) => [...subscriptionKeys.lists(), userId] as const,
  details: () => [...subscriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
  consolidated: (userId: string) => [...subscriptionKeys.all, 'consolidated', userId] as const,
}

// Fetch subscriptions
const fetchSubscriptions = async (userId: string): Promise<Subscription[]> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Fetch single subscription
const fetchSubscription = async (id: string): Promise<Subscription> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Helper function to calculate next payment date based on frequency
const calculateNextPaymentDate = (baseDate: string, frequency: string, monthsAhead: number): string => {
  const date = new Date(baseDate)
  
  switch (frequency) {
    case 'monthly':
      date.setMonth(date.getMonth() + monthsAhead)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + (monthsAhead * 3))
      break
    case 'annually':
      date.setFullYear(date.getFullYear() + monthsAhead)
      break
  }
  
  return date.toISOString().split('T')[0]
}

// Generate projected subscriptions for 12 months
const generateProjectedSubscriptions = (subscriptions: Subscription[]): ProjectedSubscription[] => {
  const projectedSubs: ProjectedSubscription[] = []
  const currentDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 12)
  
  subscriptions.forEach(sub => {
    let projectionDate = new Date(sub.payment_date)
    let projectionCount = 0
    
    // Generate projections until we reach 12 months ahead
    while (projectionDate <= endDate && projectionCount < 50) { // Safety limit
      if (projectionDate >= currentDate) {
        projectedSubs.push({
          id: `${sub.id}-${projectionCount}`,
          provider_name: sub.provider_name,
          original_amount: sub.amount,
          original_currency: sub.currency,
          amount_in_idr: sub.currency === 'IDR' ? sub.amount : sub.amount * 15000, // Rough conversion
          frequency: sub.frequency,
          original_payment_date: sub.payment_date,
          projected_payment_date: projectionDate.toISOString().split('T')[0],
          user_id: sub.user_id,
          created_at: sub.created_at,
          updated_at: sub.updated_at,
        })
      }
      
      // Calculate next payment date
      switch (sub.frequency) {
        case 'monthly':
          projectionDate.setMonth(projectionDate.getMonth() + 1)
          break
        case 'quarterly':
          projectionDate.setMonth(projectionDate.getMonth() + 3)
          break
        case 'annually':
          projectionDate.setFullYear(projectionDate.getFullYear() + 1)
          break
      }
      
      projectionCount++
    }
  })
  
  return projectedSubs.sort((a, b) => 
    new Date(a.projected_payment_date).getTime() - new Date(b.projected_payment_date).getTime()
  )
}

// Fetch consolidated subscription data (matching web app's structure)
const fetchConsolidatedSubscriptions = async (
  userId: string,
  projectionEndDate?: string
): Promise<ConsolidatedSubscriptionData> => {
  const subscriptions = await fetchSubscriptions(userId)
  const projectedSubscriptions = generateProjectedSubscriptions(subscriptions)
  
  // Calculate enhanced summary data
  const totalMonthlyRecurring = subscriptions.reduce((sum, sub) => {
    let monthlyAmount = 0
    const amount = sub.currency === 'IDR' ? sub.amount : sub.amount * 15000 // Rough conversion
    
    switch (sub.frequency) {
      case 'monthly':
        monthlyAmount = amount
        break
      case 'quarterly':
        monthlyAmount = amount / 3
        break
      case 'annually':
        monthlyAmount = amount / 12
        break
    }
    
    return sum + monthlyAmount
  }, 0)

  // Calculate upcoming this month
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const upcomingThisMonth = projectedSubscriptions
    .filter(sub => {
      const paymentDate = new Date(sub.projected_payment_date)
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear
    })
    .reduce((sum, sub) => sum + sub.amount_in_idr, 0)

  const subscriptionSummary: SubscriptionSummary = {
    upcoming_this_month: upcomingThisMonth,
    total_monthly_recurring: totalMonthlyRecurring,
    subscription_count: subscriptions.length,
  }

  return {
    subscriptions,
    projected_subscriptions: projectedSubscriptions,
    subscription_summary: subscriptionSummary,
  }
}

// Create subscription
const createSubscription = async (
  userId: string,
  subscriptionData: SubscriptionCreateData
): Promise<Subscription> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      ...subscriptionData,
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update subscription
const updateSubscription = async (
  id: string,
  subscriptionData: SubscriptionUpdateData
): Promise<Subscription> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(subscriptionData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete subscription
const deleteSubscription = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Hooks
export const useSubscriptions = (userId: string | null) => {
  return useQuery({
    queryKey: subscriptionKeys.list(userId!),
    queryFn: () => fetchSubscriptions(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useSubscription = (id: string) => {
  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: () => fetchSubscription(id),
    enabled: !!id,
  })
}

export const useConsolidatedSubscriptions = (userId: string | null, projectionEndDate?: string) => {
  return useQuery({
    queryKey: subscriptionKeys.consolidated(userId!),
    queryFn: () => fetchConsolidatedSubscriptions(userId!, projectionEndDate),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useCreateSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, subscriptionData }: {
      userId: string
      subscriptionData: SubscriptionCreateData
    }) => createSubscription(userId, subscriptionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, subscriptionData }: {
      id: string
      subscriptionData: SubscriptionUpdateData
    }) => updateSubscription(id, subscriptionData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
      queryClient.setQueryData(subscriptionKeys.detail(data.id), data)
    },
  })
}

export const useDeleteSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    },
  })
}