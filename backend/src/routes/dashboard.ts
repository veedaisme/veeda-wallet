import { Hono } from 'hono';
import { Env, getSupabaseClient } from '@/services/supabase';
import { authMiddleware } from '@/middleware/auth';

const dashboardRoutes = new Hono<{ Bindings: Env }>();

dashboardRoutes.use('*', authMiddleware);

dashboardRoutes.get('/summary', async (c) => {
  try {
    const supabase = getSupabaseClient(c.env);
    
    const { data, error } = await supabase.rpc('dashboard_summary');
    
    if (error) {
      return c.json({ error: 'Failed to fetch dashboard summary' }, 500);
    }
    
    return c.json({ data: data && data.length > 0 ? data[0] : null });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

dashboardRoutes.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'dashboard',
    timestamp: new Date().toISOString() 
  });
});

export { dashboardRoutes };
