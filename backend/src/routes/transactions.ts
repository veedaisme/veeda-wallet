import { Hono } from 'hono';
import { Env, getSupabaseClient } from '@/services/supabase';
import { authMiddleware, getUserFromContext } from '@/middleware/auth';

const transactionRoutes = new Hono<{ Bindings: Env }>();

transactionRoutes.use('*', authMiddleware);

transactionRoutes.get('/', async (c) => {
  try {
    const user = getUserFromContext(c);
    const supabase = getSupabaseClient(c.env);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (error) {
      return c.json({ error: 'Failed to fetch transactions' }, 500);
    }
    
    return c.json({ 
      data,
      pagination: { page: 0, limit: 20, total: data?.length || 0, hasMore: false }
    });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

transactionRoutes.post('/', async (c) => {
  try {
    const user = getUserFromContext(c);
    const transactionData = await c.req.json();
    const supabase = getSupabaseClient(c.env);
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...transactionData, user_id: user.id }])
      .select()
      .single();
    
    if (error) {
      return c.json({ error: 'Failed to create transaction' }, 500);
    }
    
    return c.json(data, 201);
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { transactionRoutes };
