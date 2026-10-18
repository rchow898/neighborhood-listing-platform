// src/lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

// Enforce server execution context
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Environment variable SUPABASE_URL is not set.');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Environment variable SUPABASE_SERVICE_ROLE_KEY is not set.');
}

/**
 * Server-only Supabase client initialized with the administrative service_role key.
 * This client bypasses Row-Level Security and MUST only be imported in server-side
 * contexts (Route Handlers, Server Actions, or API endpoints).
 * 
 * Never prefix SUPABASE_SERVICE_ROLE_KEY with NEXT_PUBLIC_ or VITE_.
 */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});