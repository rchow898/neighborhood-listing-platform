// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing public Supabase environment variables.');
}

/**
 * Browser-safe Supabase client initialized with the publishable anon key.
 * Enforces Row-Level Security for all operations.
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);