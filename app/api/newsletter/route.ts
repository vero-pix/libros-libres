import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, full_name } = (await req.json()) as {
    email?: string;
    full_name?: string;
  };

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
  const firstName = (full_name ?? "").trim().split(/\s+/)[0];
  const greeting = firstName ? `Hola ${firstName}` : "Hola";

  try {
    await sendEmail({
      to: email.toLowerCase(),
      subject: "Gracias por registrarte en tuslibros.cl",
      html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#2a1f14;background:#ffffff;">

  <p style="font-size:11px;letter-spacing:3px;color:#a8581e;font-weight:600;margin:0 0 10px;text-transform:uppercase;">tuslibros.cl</p>

  <h1 style="font-family:Georgia,serif;font-size:26px;color:#2a1f14;margin:0 0 18px;line-height:1.25;font-weight:500;">${greeting}, gracias por registrarte 🙏</h1>

  <p style="font-size:15px;line-height:1.65;color:#3a2f24;margin:0 0 16px;">
    Soy Vero, la fundadora de tuslibros.cl. Te escribo yo, no un "equipo" — por ahora
    este proyecto lo llevo sola desde Providencia, Santiago.
  </p>

  <p style="font-size:15px;line-height:1.65;color:#3a2f24;margin:0 0 16px;">
    tuslibros.cl es un marketplace de libros usados chilenos con pago seguro por
    MercadoPago y despacho puerta a puerta con Shipit: imprimes la etiqueta y el
    courier pasa a buscarlo a tu casa. Ya hay 3 compradores reales, 11 libros vendidos,
    y el primer envío llegó a Concepción esta semana.
  </p>

  <p style="font-size:15px;line-height:1.65;color:#3a2f24;margin:0 0 20px;">
    Acá te dejo dos caminos para empezar:
  </p>

  <div style="margin:0 0 22px;">
    <a href="https://tuslibros.cl/publish" style="display:block;background:#a8581e;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;margin-bottom:10px;">
      📚 Publicar un libro que tienes en casa →
    </a>
    <a href="https://tuslibros.cl" style="display:block;background:#ffffff;color:#2a1f14;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;border:1px solid #d4c5a8;">
      🔍 Explorar el catálogo →
    </a>
  </div>

  <p style="font-size:14px;line-height:1.65;color:#3a2f24;margin:0 0 16px;">
    <strong>Si tienes varios libros</strong> y quieres ahorrarte la pega de subirlos
    de a uno, mándame una foto de la ruma o un Excel con los títulos por
    <a href="https://wa.me/56994583067" style="color:#a8581e;font-weight:600;">WhatsApp</a>
    y yo los subo por ti.
  </p>

  <p style="font-size:14px;line-height:1.65;color:#3a2f24;margin:0 0 22px;">
    Y si tienes dudas, críticas, ideas, o simplemente quieres saludarme, respondes este correo o me escribes directo.
  </p>

  <div style="border-top:1px solid #e8ddc8;padding-top:18px;margin-top:22px;">
    <p style="font-size:13px;line-height:1.6;color:#7a6649;margin:0 0 6px;">
      En <a href="https://tuslibros.cl/novedades" style="color:#a8581e;">tuslibros.cl/novedades</a> cuento cada par de días lo que pasa, lo que pruebo, lo que sale mal y lo que sale bien.
    </p>
    <p style="font-size:13px;color:#7a6649;margin:8px 0 0;">
      Gracias por estar acá. — Vero
    </p>
  </div>

</div>
      `,
    });
  } catch (emailErr) {
    console.error("Newsletter welcome email failed:", emailErr);
  }

  return NextResponse.json({ ok: true });
}
