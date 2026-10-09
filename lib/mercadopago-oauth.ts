import { createServerClient } from "@supabase/ssr";

/**
 * Renueva el access_token de un vendedor usando su refresh_token.
 * Retorna el nuevo access_token o null si falla.
 */
export async function refreshSellerToken(
  sellerId: string,
  refreshToken: string
): Promise<string | null> {
  const res = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.MERCADOPAGO_APP_ID,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.error("[MP OAuth] refresh failed for seller", sellerId, detalle);
    // invalid_grant = MercadoPago ya no reconoce el permiso (clave cambiada,
    // acceso revocado). Si el vendedor sigue figurando conectado, el sitio le
    // esconde el WhatsApp y el botón de pagar falla siempre: el comprador queda
    // sin salida. Pasó con buhardilla, cimlibros y carlos.sanchez.sotelo hasta
    // el 09-10-2026. Se le marca desconectado; al reconectar, el callback de
    // OAuth vuelve a llenar estas columnas.
    if (detalle.includes("invalid_grant")) {
      await createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      )
        .from("users")
        .update({ mercadopago_user_id: null, mercadopago_connected_at: null })
        .eq("id", sellerId);
    }
    return null;
  }

  const data = await res.json();
  const { access_token, refresh_token: newRefresh } = data as {
    access_token: string;
    refresh_token: string;
  };

  // Update tokens in DB
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Los tokens viven en mp_credentials (sin grants para el cliente); en `users`
  // solo se refresca la fecha, que no es secreta.
  await supabase
    .from("mp_credentials")
    .update({
      access_token,
      refresh_token: newRefresh,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", sellerId);

  await supabase
    .from("users")
    .update({ mercadopago_connected_at: new Date().toISOString() })
    .eq("id", sellerId);

  return access_token;
}
