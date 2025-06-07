import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { Env } from '@/services/supabase';
import { corsMiddleware, securityHeaders } from '@/middleware/cors';

// Import route handlers
import { authRoutes } from '@/routes/auth';
import { transactionRoutes } from '@/routes/transactions';
import { subscriptionRoutes } from '@/routes/subscriptions';
import { dashboardRoutes } from '@/routes/dashboard';

// Create the main Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', corsMiddleware());
app.use('*', securityHeaders);
app.use('*', prettyJSON());

// Error handling middleware
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  // Don't expose internal errors in production
  const isProduction = c.env?.ENVIRONMENT === 'production';
  const errorMessage = isProduction ? 'Internal server error' : err.message;
  
  return c.json({ 
    error: errorMessage,
    timestamp: new Date().toISOString(),
    ...(isProduction ? {} : { stack: err.stack })
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not found',
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString()
  }, 404);
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Veeda Wallet Backend API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env?.ENVIRONMENT || 'unknown'
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 'unknown',
    environment: c.env?.ENVIRONMENT || 'unknown'
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/transactions', transactionRoutes);
app.route('/api/subscriptions', subscriptionRoutes);
app.route('/api/dashboard', dashboardRoutes);

// Analytics routes (future AI integration)
app.get('/api/analytics/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'analytics',
    message: 'AI analytics features coming soon',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for API routes
app.all('/api/*', (c) => {
  return c.json({
    error: 'API endpoint not found',
    path: c.req.path,
    method: c.req.method,
    availableEndpoints: [
      'GET /api/auth/verify',
      'GET /api/transactions',
      'POST /api/transactions',
      'PUT /api/transactions/:id',
      'DELETE /api/transactions/:id',
      'GET /api/subscriptions',
      'POST /api/subscriptions',
      'PUT /api/subscriptions/:id',
      'DELETE /api/subscriptions/:id',
      'GET /api/subscriptions/summary',
      'GET /api/subscriptions/projected',
      'GET /api/subscriptions/consolidated',
      'GET /api/subscriptions/exchange-rates',
      'GET /api/dashboard/summary',
      'GET /api/dashboard/charts/weekly',
      'GET /api/dashboard/charts/monthly',
      'GET /api/dashboard/charts/daily'
    ],
    timestamp: new Date().toISOString()
  }, 404);
});

export default app;
