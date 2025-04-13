import { createClient } from '@supabase/supabase-js';

// Ensure server-only environment variables are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use the Service Role Key for admin actions - ONLY ON SERVER
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseServiceRoleKey) {
  // This check should only fail server-side during initialization
  console.error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. Admin client cannot be created.");
  // We might not want to throw here directly if the file is imported elsewhere,
  // but log a critical error. Let's throw for now during server init.
  if (typeof window === 'undefined') {
      throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
}

// Create and export the Supabase Admin client
// IMPORTANT: This client instance should ONLY be used in server-side code (API routes, Server Actions)
// NEVER import or use this in client components.
export const supabaseAdmin = supabaseServiceRoleKey 
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            // It's generally recommended to disable auto-refreshing tokens for admin clients
            // as they use the service role key which doesn't expire.
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null; 

// Optional: Add a helper function to get the admin client or throw if unavailable
export function getSupabaseAdmin() {
    if (!supabaseAdmin) {
        throw new Error("Supabase Admin Client not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable.");
    }
    return supabaseAdmin;
} 