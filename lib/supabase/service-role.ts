import { createClient } from "@supabase/supabase-js";

/**
 * Service role client - bypasses RLS for backend operations.
 * Use this ONLY in server-side code for admin operations.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
