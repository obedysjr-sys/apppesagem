import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_ANON_KEY || 'anon-key-not-set'
);

export const getSupabase = (): SupabaseClient | null => {
  if (!hasSupabaseEnv) return null;
  return client ?? supabase;
};