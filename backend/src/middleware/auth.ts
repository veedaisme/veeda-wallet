import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import { Env } from '@/services/supabase';

export interface AuthContext {
  user: { id: string; email: string };
  token: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (\!authHeader || \!authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7);
    
    if (\!token) {
      return c.json({ error: 'Missing token' }, 401);
    }

    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    
    try {
      const { payload } = await jwtVerify(token, secret) as { payload: any };
      
      const user = {
        id: payload.sub,
        email: payload.email,
      };

      c.set('auth', { user, token });
      
      await next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return c.json({ error: 'Invalid token' }, 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
}

export function getUserFromContext(c: Context): { id: string; email: string } {
  const auth = c.get('auth');
  if (\!auth) {
    throw new Error('User not authenticated');
  }
  return auth.user;
}
