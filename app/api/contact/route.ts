import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email";
import { VERO_INBOX } from "@/lib/veroInbox";
import { motivoDescarteContacto, CONTACTO_MENSAJE_INVALIDO } from "@/lib/contactValidation";

/**
 * POST /api/contact
 * Guarda el formulario de contacto en `contact_messages` y avisa a VERO_INBOX.
 *
 * Los mensajes que no pasan la validación (lib/contactValidation.ts) se guardan
 * igual, con `discarded_reason`, para poder mirar qué se está filtrando: no
 * mandan correo y el panel de admin no los muestra.
 */
export async function POST(req: NextRequest) {
  const { name, email, message } = (await req.json()) as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const motivo = motivoDescarteContacto(message);
  if (motivo) {
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      message,
      read: true,
      discarded_reason: motivo,
    });
    if (error) console.error("Contact form (descartado) error:", error.message);
    return NextResponse.json({ error: CONTACTO_MENSAJE_INVALIDO }, { status: 400 });
  }

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    message,
  });

  if (error) {
    console.error("Contact form error:", error.message);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }

  // Send notification email (don't fail the request if this errors)
  try {
    await sendEmail({
      to: VERO_INBOX,
      subject: "Nuevo mensaje de contacto — tuslibros.cl",
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });
  } catch (emailErr) {
    console.error("Contact email notification failed:", emailErr);
  }

  return NextResponse.json({ ok: true });
}
