import { NextRequest, NextResponse } from "next/server";
import { avisarOrigenFaltante, crearOrigenSiSePuede } from "@/lib/shipit-origen";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

  // Guardar en Supabase. Los tokens van a mp_credentials, que no tiene grants
  // para el cliente, así que la escritura necesita service role. En `users`
  // queda solo lo no secreto: el id público del vendedor en MP y la fecha.
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error: credError } = await admin.from("mp_credentials").upsert(
    {
      user_id: state,
      access_token,
      refresh_token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  const { error } = await admin
    .from("users")
    .update({
      mercadopago_user_id: String(mpUserId),
      mercadopago_connected_at: new Date().toISOString(),
    })
    .eq("id", state);

  if (credError || error) {
    console.error("Error guardando tokens MP:", credError ?? error);
    return NextResponse.redirect(
      `${siteUrl}/perfil?mp_error=save_failed`
    );
  }

  // Fuera de la RM hace falta un origen propio en Shipit para poder despachar.
  // Se intenta crear solo: en septiembre de 2026 quedaron 15 vendedores sin
  // origen porque dependía de que Vero lo hiciera a mano, y 105 libros
  // quedaron limitados a entrega en persona sin que nadie se enterara.
  // Si faltan datos (calle, número, comuna), cae al aviso de siempre.
  // Nunca frena el redirect.
  const origenCreado = await crearOrigenSiSePuede(admin, state);
  if (!origenCreado) await avisarOrigenFaltante(admin, state, "conectó MercadoPago");

  return NextResponse.redirect(`${siteUrl}/perfil?mp_connected=true`);
}
