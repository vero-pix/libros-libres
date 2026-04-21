import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/sponsor-request
 * Guarda postulaciones para "Gente de confianza" en contact_messages con
 * prefijo identificable, y notifica a Vero por mail.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    name?: string;
    email?: string;
    whatsapp?: string;
    offer?: string;
    description?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim();
  const offer = body.offer?.trim();
  const description = body.description?.trim();
  const whatsapp = body.whatsapp?.trim() || "";

  if (!name || !email || !offer || !description) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const compiledMessage =
    `[SOLICITUD: Gente de confianza]\n\n` +
    `Qué ofrece: ${offer}\n` +
    (whatsapp ? `WhatsApp: ${whatsapp}\n` : "") +
    `\nDescripción:\n${description}`;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    message: compiledMessage,
  });

  if (error) {
    console.error("Sponsor request insert error:", error.message);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }

  try {
    await sendEmail({
      to: "vero@economics.cl",
      subject: `Amigo de la casa: ${name} — ${offer}`,
      html: `
        <h2>Nueva postulación a Gente de confianza</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${whatsapp ? `<p><strong>WhatsApp:</strong> ${whatsapp}</p>` : ""}
        <p><strong>Qué ofrece:</strong> ${offer}</p>
        <p><strong>Descripción:</strong></p>
        <p>${description.replace(/\n/g, "<br>")}</p>
      `,
    });
  } catch (emailErr) {
    console.error("Sponsor email notification failed:", emailErr);
  }

  return NextResponse.json({ ok: true });
}
