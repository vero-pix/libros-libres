import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/mercadopago
 * Inicia el flujo OAuth de MercadoPago Marketplace.
 * Redirige al vendedor a MP para autorizar la app.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?next=/perfil", process.env.NEXT_PUBLIC_SITE_URL!)
    );
  }

  const appId = process.env.MERCADOPAGO_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "MERCADOPAGO_APP_ID no configurado" },
      { status: 500 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/mercadopago/callback`;

  const authUrl = new URL("https://auth.mercadopago.cl/authorization");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("platform_id", "mp");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  // state = user ID para vincular en el callback
  authUrl.searchParams.set("state", user.id);

  return NextResponse.redirect(authUrl.toString());
}
