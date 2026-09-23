import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * El teléfono de los vendedores que una página muestra, y solo esos.
 *
 * Hasta el 23-09-2026 `users.phone` se podía leer con la anon key y con
 * cualquier sesión: la columna entera, los ~150 teléfonos, a un script de
 * distancia. Se dejaba así por el botón de WhatsApp de la ficha, que tiene que
 * funcionar sin cuenta (lib/whatsapp-policy.ts). Desde la migración
 * 20260923e la columna ya no se concede a anon ni a authenticated: la página
 * que necesita el teléfono de SU vendedor lo pide acá, por id, y lo agrega al
 * objeto `seller` como antes. Cuándo se muestra lo sigue decidiendo la página.
 */
export async function telefonosDe(sellerIds: string[]): Promise<Map<string, string | null>> {
  const ids = Array.from(new Set(sellerIds.filter(Boolean)));
  const out = new Map<string, string | null>();
  if (ids.length === 0) return out;
  try {
    const { data } = await createServiceRoleClient().from("users").select("id, phone").in("id", ids);
    for (const u of data ?? []) out.set(u.id as string, (u.phone as string | null) ?? null);
  } catch {
    // Sin teléfono la página cae a la mensajería interna: nunca se rompe por esto.
  }
  return out;
}

/** Lo mismo para un solo vendedor. */
export async function telefonoDe(sellerId: string): Promise<string | null> {
  return (await telefonosDe([sellerId])).get(sellerId) ?? null;
}
