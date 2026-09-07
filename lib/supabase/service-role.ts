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
      // Next 14 parchea `fetch` y guarda en disco (.next/cache/fetch-cache)
      // las respuestas GET aunque la ruta sea force-dynamic. El worker de
      // Shipit leyó durante una hora un `users` congelado (shipit_origin_id
      // null, shipit_auto_enabled false) que la BD ya no tenía (07-09-2026).
      // Todo lo que pasa por este cliente es operación de backend: nunca
      // se cachea.
      global: {
        fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
      },
    }
  );
}
