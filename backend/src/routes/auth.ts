import { Hono } from 'hono';
import { jwtVerify } from 'jose';
import { Env } from '@/services/supabase';

const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/verify', async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (\!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    
    try {
      const { payload } = await jwtVerify(token, secret) as { payload: any };
      
      const user = {
        id: payload.sub,
        email: payload.email,
      };

      return c.json({ user, valid: true });
    } catch (jwtError) {
      return c.json({ user: { id: '', email: '' }, valid: false }, 401);
    }
  } catch (error) {
    return c.json({ error: 'Authentication verification failed' }, 500);
  }
});

authRoutes.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'auth',
    timestamp: new Date().toISOString() 
  });
});

export { authRoutes };
