import { createClient } from '@supabase/supabase-js';

// Sanitize inputs by stripping any accidental single/double quotes or extra spaces
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/['"]/g, '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();

let client = null;
let initialized = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
    initialized = true;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

export const hasSupabase = initialized;
export const supabase = client;
