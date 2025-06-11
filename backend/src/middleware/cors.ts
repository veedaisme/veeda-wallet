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
