import { createClient } from '@supabase/supabase-js';

// Add verbose logging for debugging
console.log('Initializing Supabase Admin client...');
console.log('Admin Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a fallback admin client if environment variables are missing
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Missing Supabase admin environment variables - admin features will be disabled');
  supabaseAdmin = null;
} else {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (error) {
    console.warn('Failed to create Supabase admin client:', error);
    supabaseAdmin = null;
  }
}

export { supabaseAdmin };

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin Client not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  return supabaseAdmin;
}