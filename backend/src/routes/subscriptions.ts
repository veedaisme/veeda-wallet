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

export { subscriptionRoutes };
