import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const { email, company, origen } = (await req.json()) as {
    email?: string;
    company?: string;
    // "registro" cuando viene de RegisterForm: ahí el webhook new-user ya manda
    // su propia bienvenida, y dos correos a la vez se leen como spam.
    origen?: string;
  };

  // Honeypot: los formularios traen un campo oculto `company` que los humanos dejan
  // vacío. Si viene con algo, es un bot → respondemos 200 (para no darle pistas) pero
  // NO guardamos nada. Esto es lo que llenaba newsletter_subscribers de basura.
  if (company && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Upsert to avoid duplicates.
  // Suscribirse en el formulario es volver a dar el consentimiento, así que
  // borra una baja anterior (lib/bajaCorreos.ts). El registro NO: ahí la
  // suscripción va sola, sin que la persona la pida, y no puede pasar por
  // encima de una baja.
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(
      origen === "registro"
        ? { email: email.toLowerCase() }
        : { email: email.toLowerCase(), unsubscribed_at: null },
      { onConflict: "email" }
    );

  if (error) {
    console.error("Newsletter subscribe error:", error.message);
    return NextResponse.json({ error: "Error al suscribir" }, { status: 500 });
  }

  // Sin correo de bienvenida al suscribirse (05-10-2026). Bots inscribían
  // correos de personas reales de EE.UU. y Europa (12 de 17 suscripciones ese
  // día: yahoo, aol, gmx, empresas) y cada inscripción disparaba al tiro un
  // "Gracias por registrarte" desde hola@: gente que nunca lo pidió, que lo
  // marca como spam y le baja la reputación al buzón con que se les escribe a
  // compradores y vendedores. Quien se registra en el sitio recibe su
  // bienvenida por el webhook new-user; el suscriptor recibe el próximo
  // newsletter, que ya se envía filtrado con isLikelyBotEmail.

  return NextResponse.json({ ok: true });
}
