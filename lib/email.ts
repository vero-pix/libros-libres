/**
 * Shared email helper using Resend API.
 * Requires RESEND_API_KEY env var.
 */

interface SendEmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  /** A dónde contesta el vendedor. Sin esto la respuesta muere en noreply@. */
  replyTo?: string;
  /**
   * Copia oculta. Sirve para dejarle a Vero constancia de lo que se envió:
   * `reply_to` solo trae las respuestas, no una copia del correo.
   *
   * Es opt-in por llamada a propósito, NO automático para todo: copiar cada
   * confirmación de compra, cada tracking y cada pedido de reseña llenaría el
   * buzón y además cada destinatario cuenta contra la cuota diaria de Resend,
   * que en el plan gratis son 100 correos. Úsalo en envíos puntuales —una
   * activación, un aviso a un vendedor— no en los transaccionales de cada venta.
   *
   * Para copiar a Vero, pasar `VERO_INBOX` de lib/veroInbox.ts, nunca el correo
   * escrito a mano.
   */
  bcc?: string | string[];
}

/** Respuesta de Resend: `{ id }` si salió; `null` si no hay API key o Resend rechazó. */
export async function sendEmail({ to, from = "noreply@tuslibros.cl", subject, html, replyTo, bcc }: SendEmailParams): Promise<{ id: string } | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return null;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
      // Una lista vacía haría que Resend rechace el envío entero, así que se
      // omite el campo salvo que venga algo de verdad.
      ...(bcc && (!Array.isArray(bcc) || bcc.length > 0) ? { bcc } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend API error:", res.status, body);
    return null;
  }

  return res.json();
}
