#\!/bin/bash

# Create all backend directories
mkdir -p src/{routes,middleware,services,types,utils}

# Create essential files with basic content
cat > src/services/supabase.ts << 'SUPABASE_EOF'
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  CACHE?: KVNamespace;
  ENVIRONMENT?: string;
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(env: Env): SupabaseClient {
  if (\!supabaseClient) {
    if (\!env.SUPABASE_URL || \!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }
    
    supabaseClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  
  return supabaseClient;
}

export async function executeQuery<T>(query: any): Promise<{ data: T[] | null; error: Error | null; count?: number }> {
  try {
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Query error:', error);
      return { data: null, error: new Error(error.message), count };
    }
    
    return { data, error: null, count };
  } catch (err) {
    console.error('Query exception:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error'),
      count: 0
    };
  }
}
SUPABASE_EOF

cat > src/middleware/auth.ts << 'AUTH_EOF'
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
AUTH_EOF

cat > src/middleware/cors.ts << 'CORS_EOF'
import { Context, Next } from 'hono';
import { cors } from 'hono/cors';

export function corsMiddleware() {
  return cors({
    origin: (origin) => {
      if (\!origin) return true;
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://clair-wallet.vercel.app',
      ];
      
      if (origin.startsWith('http://localhost:')) {
        return true;
      }
      
      return allowedOrigins.includes(origin);
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });
}

export async function securityHeaders(c: Context, next: Next) {
  await next();
  
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  
  if (c.env?.ENVIRONMENT === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}
CORS_EOF

cat > src/routes/auth.ts << 'AUTH_ROUTES_EOF'
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
AUTH_ROUTES_EOF

cat > src/routes/transactions.ts << 'TRANS_ROUTES_EOF'
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
TRANS_ROUTES_EOF

cat > src/routes/subscriptions.ts << 'SUB_ROUTES_EOF'
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
SUB_ROUTES_EOF

cat > src/routes/dashboard.ts << 'DASH_ROUTES_EOF'
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
DASH_ROUTES_EOF

echo "Backend files created successfully\!"
