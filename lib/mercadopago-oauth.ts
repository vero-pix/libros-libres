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
    console.error("[MP OAuth] refresh failed for seller", sellerId, await res.text());
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

  await supabase
    .from("users")
    .update({
      mercadopago_access_token: access_token,
      mercadopago_refresh_token: newRefresh,
      mercadopago_connected_at: new Date().toISOString(),
    })
    .eq("id", sellerId);

  return access_token;
}
