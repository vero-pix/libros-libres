import { createClient } from "@supabase/supabase-js";

const serviceSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export interface ApiCaller {
  sellerId: string;
  keyId: string;
}

export async function authenticateApiKey(req: Request): Promise<ApiCaller | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const key = auth.slice(7).trim();
  if (!key) return null;

  const supabase = serviceSupabase();
  const { data } = await supabase
    .from("api_keys")
    .select("id, seller_id")
    .eq("key", key)
    .single();

  if (!data) return null;

  // Actualizar last_used_at sin bloquear la respuesta
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return { sellerId: data.seller_id, keyId: data.id };
}

export function unauthorized() {
  return Response.json(
    { error: "API key inválida o ausente. Incluye el header: Authorization: Bearer <tu_api_key>" },
    { status: 401 }
  );
}

export function forbidden() {
  return Response.json({ error: "No tienes permiso para modificar este recurso" }, { status: 403 });
}
