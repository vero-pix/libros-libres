import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/mercadopago/callback
 * Recibe el code de OAuth de MercadoPago, lo intercambia por tokens,
 * y guarda las credenciales del vendedor en la DB.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // user ID

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!code || !state) {
    return NextResponse.redirect(
      `${siteUrl}/perfil?mp_error=missing_params`
    );
  }

  // Intercambiar code por access_token
  const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.MERCADOPAGO_APP_ID,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${siteUrl}/api/auth/mercadopago/callback`,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("MercadoPago OAuth token error:", err);
    return NextResponse.redirect(
      `${siteUrl}/perfil?mp_error=token_exchange`
    );
  }

  const tokenData = await tokenRes.json();
  const {
    access_token,
    refresh_token,
    user_id: mpUserId,
  } = tokenData as {
    access_token: string;
    refresh_token: string;
    user_id: number;
  };

  // Guardar en Supabase
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      mercadopago_user_id: String(mpUserId),
      mercadopago_access_token: access_token,
      mercadopago_refresh_token: refresh_token,
      mercadopago_connected_at: new Date().toISOString(),
    })
    .eq("id", state);

  if (error) {
    console.error("Error guardando tokens MP:", error);
    return NextResponse.redirect(
      `${siteUrl}/perfil?mp_error=save_failed`
    );
  }

  return NextResponse.redirect(`${siteUrl}/perfil?mp_connected=true`);
}
