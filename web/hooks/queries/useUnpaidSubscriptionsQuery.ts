import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabaseClient';
import { 
  ProjectedSubscription, 
  SubscriptionPaymentSummary,
  PaySubscriptionRequest,
  PaySubscriptionResponse 
} from '@/models/subscription';

// Feature flag for payment functionality
const isPaymentFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTION_PAYMENTS === 'true';

/**
 * Hook to fetch unpaid subscription payments
 * Uses the new database function to get only unpaid items
 */
export function useUnpaidSubscriptions(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.subscriptionsUnpaid(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      // Use the new database function for unpaid subscriptions
      const { data: unpaidPayments, error: paymentsError } = await supabase
        .rpc('get_unpaid_subscription_payments', {
          p_user_id: userId,
          p_projection_end_date: null // Use default (12 months)
        });

      if (paymentsError) {
        console.error('Error fetching unpaid payments:', paymentsError);
        throw paymentsError;
      }

      // Get payment summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_subscription_payment_summary', {
          p_user_id: userId
        });

      if (summaryError) {
        console.error('Error fetching payment summary:', summaryError);
        throw summaryError;
      }

      const summary = summaryData && summaryData[0] ? summaryData[0] : {
        total_unpaid_amount: 0,
        unpaid_count: 0,
        overdue_count: 0,
        next_payment_date: null,
        next_payment_amount: null
      };

      return {
        unpaid_subscriptions: (unpaidPayments || []) as ProjectedSubscription[],
        payment_summary: summary as SubscriptionPaymentSummary
      };
    },
    enabled: !!userId && isPaymentFeatureEnabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to pay a subscription payment
 * Creates transaction and marks payment as paid
 */
export function usePaySubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      paymentData 
    }: { 
      paymentId: string; 
      paymentData?: PaySubscriptionRequest 
    }) => {
      if (!isPaymentFeatureEnabled) {
        throw new Error('Payment feature is not enabled');
      }

      // For now, we'll use Supabase directly since the frontend currently calls Supabase
      // Later this can be updated to use the backend API when migration is complete
      
      // First, get the payment record to validate
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('subscription_payments')
        .select(`
          *,
          subscriptions!inner(
            id,
            provider_name,
            amount,
            currency,
            user_id
          )
        `)
        .eq('id', paymentId)
        .eq('payment_status', 'unpaid')
        .single();

      if (paymentError || !paymentRecord) {
        throw new Error('Payment record not found or already paid');
      }

      const subscription = paymentRecord.subscriptions;

      // Calculate transaction amount
      let transactionAmount = paymentData?.amount;
      if (!transactionAmount) {
        // Get amount in IDR from projected payments function
        const { data: projectedData, error: projectedError } = await supabase
          .rpc('get_projected_subscription_payments_with_status', {
            p_user_id: subscription.user_id,
            p_projection_end_date: paymentRecord.projected_payment_date,
            p_payment_status: null
          });

        if (projectedError || !projectedData || projectedData.length === 0) {
          throw new Error('Failed to calculate payment amount');
        }

        const matchingPayment = projectedData.find((p: any) => 
          p.id === subscription.id && 
          p.projected_payment_date === paymentRecord.projected_payment_date
        );

        if (!matchingPayment) {
          throw new Error('Failed to find matching payment projection');
        }

        transactionAmount = Math.round(matchingPayment.amount_in_idr);
      }

      // Create transaction data
      const transactionData = {
        amount: transactionAmount,
        category: paymentData?.category || 'Subscriptions',
        note: paymentData?.note || `Payment for ${subscription.provider_name} - ${paymentRecord.projected_payment_date}`,
        date: new Date().toISOString(),
        user_id: subscription.user_id
      };

      // Create the transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw new Error('Failed to create transaction');
      }

      // Mark the payment as paid using the database function
      const { data: markPaidResult, error: markPaidError } = await supabase
        .rpc('mark_subscription_payment_paid', {
          p_payment_id: paymentId,
          p_transaction_id: transaction.id
        });

      if (markPaidError || !markPaidResult) {
        // Rollback: delete the transaction if payment marking failed
        await supabase
          .from('transactions')
          .delete()
          .eq('id', transaction.id);

        console.error('Error marking payment as paid:', markPaidError);
        throw new Error('Failed to mark payment as paid');
      }

      // Get the updated payment record
      const { data: updatedPayment, error: updatedError } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      return {
        transaction,
        payment: updatedPayment || {
          id: paymentId,
          status: 'paid' as const,
          paid_at: new Date().toISOString(),
          transaction_id: transaction.id
        }
      } as PaySubscriptionResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch unpaid subscriptions
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.subscriptionsUnpaid(variables.paymentId) 
      });
      
      // Also invalidate consolidated subscription data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.subscriptionsConsolidated('', '') 
      });

      // Invalidate transactions to show the new payment
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.transactionsList('') 
      });
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    }
  });
}

/**
 * Hook to check if payment feature is enabled
 */
export function usePaymentFeatureFlag() {
  return {
    isEnabled: isPaymentFeatureEnabled,
    canPay: isPaymentFeatureEnabled
  };
}
