// src/utils/supabase/constant.ts
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only throw in development if variables are missing
if (process.env.NODE_ENV === 'development') {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️ Missing Supabase environment variables. Please check your .env.local file.');
  }
}