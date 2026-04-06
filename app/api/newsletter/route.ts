import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Upsert to avoid duplicates
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email: email.toLowerCase() }, { onConflict: "email" });

  if (error) {
    console.error("Newsletter subscribe error:", error.message);
    return NextResponse.json({ error: "Error al suscribir" }, { status: 500 });
  }

  // Send welcome email (don't fail the request if this errors)
  try {
    await sendEmail({
      to: email.toLowerCase(),
      subject: "Bienvenido al newsletter de Libros Libres",
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 8px;">Libros Libres</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hola y bienvenido/a al newsletter de <strong>Libros Libres</strong>.
          </p>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Te avisaremos cuando lancemos nuevas funcionalidades, tengamos novedades del marketplace,
            y compartiremos recomendaciones de libros de nuestra comunidad.
          </p>
          <p style="font-size: 14px; color: #888; margin-top: 24px;">
            — El equipo de tuslibros.cl
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error("Newsletter welcome email failed:", emailErr);
  }

  return NextResponse.json({ ok: true });
}
