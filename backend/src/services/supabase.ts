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
