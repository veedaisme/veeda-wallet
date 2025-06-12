import { Hono } from 'hono';
import { Env, getSupabaseClient } from '@/services/supabase';
import { authMiddleware, getUserFromContext } from '@/middleware/auth';

const subscriptionRoutes = new Hono<{ Bindings: Env }>();

subscriptionRoutes.use('*', authMiddleware);

subscriptionRoutes.get('/', async (c) => {
  try {
    const user = getUserFromContext(c);
    const supabase = getSupabaseClient(c.env);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: true });
    
    if (error) {
      return c.json({ error: 'Failed to fetch subscriptions' }, 500);
    }
    
    return c.json({ data });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

subscriptionRoutes.post('/', async (c) => {
  try {
    const user = getUserFromContext(c);
    const subscriptionData = await c.req.json();
    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{ ...subscriptionData, user_id: user.id }])
      .select()
      .single();

    if (error) {
      return c.json({ error: 'Failed to create subscription' }, 500);
    }

    return c.json({ data }, 201);
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get unpaid subscription payments
subscriptionRoutes.get('/unpaid', async (c) => {
  try {
    const user = getUserFromContext(c);
    const supabase = getSupabaseClient(c.env);

    // Get unpaid subscription payments using the database function
    const { data: unpaidPayments, error: paymentsError } = await supabase
      .rpc('get_unpaid_subscription_payments', {
        p_user_id: user.id,
        p_projection_end_date: null // Use default (12 months)
      });

    if (paymentsError) {
      console.error('Error fetching unpaid payments:', paymentsError);
      return c.json({ error: 'Failed to fetch unpaid payments' }, 500);
    }

    // Get payment summary
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_subscription_payment_summary', {
        p_user_id: user.id
      });

    if (summaryError) {
      console.error('Error fetching payment summary:', summaryError);
      return c.json({ error: 'Failed to fetch payment summary' }, 500);
    }

    const summary = summaryData && summaryData[0] ? summaryData[0] : null;

    return c.json({
      data: unpaidPayments || [],
      summary: summary
    });
  } catch (error) {
    console.error('Internal server error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Pay a subscription payment
subscriptionRoutes.post('/payments/:paymentId/pay', async (c) => {
  try {
    const user = getUserFromContext(c);
    const paymentId = c.req.param('paymentId');
    const supabase = getSupabaseClient(c.env);

    // Optional override values from request body
    const requestBody = await c.req.json().catch(() => ({}));
    const { amount, note, category } = requestBody;

    // First, get the payment record to ensure it exists and belongs to the user
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
      .eq('subscriptions.user_id', user.id)
      .eq('payment_status', 'unpaid')
      .single();

    if (paymentError || !paymentRecord) {
      return c.json({ error: 'Payment record not found or already paid' }, 404);
    }

    // Get the subscription details
    const subscription = paymentRecord.subscriptions;

    // Calculate transaction amount (use override or subscription amount in IDR)
    let transactionAmount = amount;
    if (!transactionAmount) {
      // Get amount in IDR from projected payments function
      const { data: projectedData, error: projectedError } = await supabase
        .rpc('get_projected_subscription_payments_with_status', {
          p_user_id: user.id,
          p_projection_end_date: paymentRecord.projected_payment_date,
          p_payment_status: null
        });

      if (projectedError || !projectedData || projectedData.length === 0) {
        return c.json({ error: 'Failed to calculate payment amount' }, 500);
      }

      const matchingPayment = projectedData.find(p =>
        p.id === subscription.id &&
        p.projected_payment_date === paymentRecord.projected_payment_date
      );

      if (!matchingPayment) {
        return c.json({ error: 'Failed to find matching payment projection' }, 500);
      }

      transactionAmount = Math.round(matchingPayment.amount_in_idr);
    }

    // Create transaction data
    const transactionData = {
      amount: transactionAmount,
      category: category || 'Subscriptions',
      note: note || `Payment for ${subscription.provider_name} - ${paymentRecord.projected_payment_date}`,
      date: new Date().toISOString(),
      user_id: user.id
    };

    // Create the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return c.json({ error: 'Failed to create transaction' }, 500);
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
      return c.json({ error: 'Failed to mark payment as paid' }, 500);
    }

    // Get the updated payment record
    const { data: updatedPayment, error: updatedError } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (updatedError) {
      console.error('Error fetching updated payment:', updatedError);
    }

    return c.json({
      transaction,
      payment: updatedPayment || {
        id: paymentId,
        status: 'paid',
        paid_at: new Date().toISOString(),
        transaction_id: transaction.id
      }
    }, 201);

  } catch (error) {
    console.error('Internal server error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { subscriptionRoutes };
