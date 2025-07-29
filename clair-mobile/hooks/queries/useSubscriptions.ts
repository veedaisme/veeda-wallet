import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { 
  Subscription, 
  SubscriptionCreateData, 
  SubscriptionUpdateData,
  ConsolidatedSubscriptionData 
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

// Fetch consolidated subscription data (from web app's consolidated view)
const fetchConsolidatedSubscriptions = async (
  userId: string
): Promise<ConsolidatedSubscriptionData> => {
  // This would typically call a Supabase function that returns consolidated data
  // For now, we'll fetch basic subscriptions and calculate summaries client-side
  const subscriptions = await fetchSubscriptions(userId)
  
  // Calculate summary data
  const totalMonthlyRecurring = subscriptions.reduce((sum, sub) => {
    if (sub.frequency === 'monthly') return sum + sub.amount
    if (sub.frequency === 'quarterly') return sum + (sub.amount / 3)
    if (sub.frequency === 'annually') return sum + (sub.amount / 12)
    return sum
  }, 0)

  const upcomingThisMonth = subscriptions.filter(sub => {
    const paymentDate = new Date(sub.payment_date)
    const currentDate = new Date()
    return paymentDate.getMonth() === currentDate.getMonth() &&
           paymentDate.getFullYear() === currentDate.getFullYear()
  }).length

  return {
    subscriptions,
    projected_subscriptions: [], // Would be calculated by backend
    subscription_summary: {
      upcoming_this_month: upcomingThisMonth,
      total_monthly_recurring: totalMonthlyRecurring,
      subscription_count: subscriptions.length,
    },
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

export const useConsolidatedSubscriptions = (userId: string | null) => {
  return useQuery({
    queryKey: subscriptionKeys.consolidated(userId!),
    queryFn: () => fetchConsolidatedSubscriptions(userId!),
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