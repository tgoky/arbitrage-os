// src/utils/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './constant';

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (process.env.NODE_ENV === 'development' && !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Missing SUPABASE_SERVICE_ROLE_KEY. Admin operations (invite emails) will not work.');
}

// Admin client with service role key - use ONLY on the server side
// This bypasses Row Level Security and has full admin access
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
