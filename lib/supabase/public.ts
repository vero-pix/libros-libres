import { createClient } from "@supabase/supabase-js";

// Cliente Supabase sin cookies ni sesión, pensado para datos públicos
// que se consumen dentro de unstable_cache. Next.js prohíbe llamar a
// cookies() dentro de unstable_cache, así que el cliente SSR con
// cookies no sirve en ese contexto. Usar este helper sólo para queries
// sin contexto de usuario.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
