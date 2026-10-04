/**
 * Helper de correo compartido.
 *
 * Desde el 30-09-2026 sale primero por Gmail (Google Workspace, como hola@) y
 * cae a Resend si Gmail no está configurado o falla. Motivos del cambio:
 *   - Resend gratis topa en 100 correos al día y su key es de solo envío: no
 *     había forma de ver qué había salido.
 *   - Por Gmail cada correo queda en Enviados de hola@ (~2.000 al día por
 *     usuario de Workspace, según Google).
 * Resend se queda de respaldo porque Workspace ya se cayó una vez (sept 2026)
 * y con él se habría ido todo el correo del sitio.
 *
 * Gmail se activa con dos variables:
 *   GMAIL_SA_JSON  — JSON de la cuenta de servicio, en base64
 *   GMAIL_SENDER   — buzón a nombre del que se envía (hola@tuslibros.cl)
 * La cuenta de servicio necesita delegación de dominio con el scope
 * https://www.googleapis.com/auth/gmail.send en la consola de Admin.
 *
 * Cada intento queda en `email_log` (destinatario y asunto, sin el cuerpo).
 *
 * Los envíos masivos (newsletter, scripts/_*.mjs) siguen por Resend: mandar
 * cientos de golpe desde hola@ arriesga que Google marque el buzón principal.
 */
import { JWT } from "google-auth-library";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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
   * Es opt-in por llamada a propósito, NO automático para todo: por Gmail
   * cada correo ya queda en Enviados de hola@, y por Resend cada destinatario
   * cuenta contra la cuota diaria. Úsalo en envíos puntuales —una activación,
   * un aviso a un vendedor— no en los transaccionales de cada venta.
   *
   * Para copiar a Vero, pasar `VERO_INBOX` de lib/veroInbox.ts, nunca el correo
   * escrito a mano.
   */
  bcc?: string | string[];
}

type Proveedor = "gmail" | "resend" | "ninguno";

/** `{ id }` si salió por alguno de los dos; `null` si no salió. */
export async function sendEmail(params: SendEmailParams): Promise<{ id: string } | null> {
  if (estaSuprimido(params.to)) {
    await registrar("ninguno", params, null, "suprimido: rebota (CORREOS_SUPRIMIDOS)");
    return null;
  }
  const gmail = await enviarPorGmail(params);
  if (gmail.ok) {
    await registrar("gmail", params, gmail.id, null);
    return { id: gmail.id };
  }
  if (gmail.error) {
    // Configurado pero falló: queda registrado y se intenta por Resend.
    await registrar("gmail", params, null, gmail.error);
  }

  const resend = await enviarPorResend(params);
  if (resend.ok) {
    await registrar("resend", params, resend.id, null);
    return { id: resend.id };
  }
  await registrar(resend.error === SIN_RESEND ? "ninguno" : "resend", params, null, resend.error);
  return null;
}

/**
 * Direcciones que rebotan y a las que no se les escribe más (04-10-2026: una
 * bandeja llena devolvía cada resumen diario y el aviso de rebote le llegaba a
 * Vero a hola@). Van en la variable `CORREOS_SUPRIMIDOS` de Vercel, separadas
 * por coma, y NO en `site_config`, que se lee con la clave pública, ni en el
 * código, porque el repo es público.
 */
function estaSuprimido(to: string): boolean {
  const lista = (process.env.CORREOS_SUPRIMIDOS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(to.trim().toLowerCase());
}

type Resultado = { ok: true; id: string } | { ok: false; error: string | null };

// ── Gmail ────────────────────────────────────────────────────────────────

let jwt: JWT | null = null;
function clienteGmail(sender: string): JWT | null {
  if (jwt) return jwt;
  const b64 = process.env.GMAIL_SA_JSON;
  if (!b64) return null;
  const sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  jwt = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
    subject: sender,
  });
  return jwt;
}

async function enviarPorGmail(p: SendEmailParams): Promise<Resultado> {
  const sender = process.env.GMAIL_SENDER;
  if (!sender || !process.env.GMAIL_SA_JSON) return { ok: false, error: null };
  try {
    const cliente = clienteGmail(sender);
    if (!cliente) return { ok: false, error: null };
    const res = await cliente.request<{ id: string }>({
      url: `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(sender)}/messages/send`,
      method: "POST",
      data: { raw: armarMime(p, sender) },
    });
    return { ok: true, id: res.data.id };
  } catch (e: any) {
    const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(e?.message ?? e);
    console.error("[email] Gmail falló, se intenta por Resend:", msg);
    return { ok: false, error: msg.slice(0, 500) };
  }
}

/**
 * Gmail envía siempre desde el buzón autenticado: el `from` de la llamada
 * aporta solo el nombre visible. Si el `from` era noreply@, sin replyTo
 * explícito las respuestas igual llegan a hola@, que es donde se leen.
 */
function armarMime(p: SendEmailParams, sender: string): string {
  const nombre = (p.from ?? "").match(/^\s*"?([^"<]+?)"?\s*</)?.[1] ?? "tuslibros.cl";
  const bcc = p.bcc ? (Array.isArray(p.bcc) ? p.bcc : [p.bcc]).filter(Boolean) : [];
  const lineas = [
    `From: ${encabezado(nombre)} <${sender}>`,
    `To: ${p.to}`,
    ...(bcc.length ? [`Bcc: ${bcc.join(", ")}`] : []),
    ...(p.replyTo ? [`Reply-To: ${p.replyTo}`] : []),
    `Subject: ${encabezado(p.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(p.html, "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n"),
  ];
  return Buffer.from(lineas.join("\r\n"), "utf8").toString("base64url");
}

/** Asuntos y nombres con tildes o emojis van codificados (RFC 2047). */
function encabezado(s: string): string {
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

// ── Resend (respaldo) ────────────────────────────────────────────────────

const SIN_RESEND = "RESEND_API_KEY no configurada";

async function enviarPorResend({ to, from = "noreply@tuslibros.cl", subject, html, replyTo, bcc }: SendEmailParams): Promise<Resultado> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return { ok: false, error: SIN_RESEND };
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
    return { ok: false, error: `${res.status} ${body}`.slice(0, 500) };
  }

  const data = await res.json();
  return { ok: true, id: data.id };
}

// ── Registro ─────────────────────────────────────────────────────────────

async function registrar(proveedor: Proveedor, p: SendEmailParams, id: string | null, error: string | null) {
  // Que el registro falle no puede tumbar un envío que ya salió.
  try {
    await createServiceRoleClient().from("email_log").insert({
      proveedor,
      ok: !!id,
      to_email: p.to,
      subject: p.subject.slice(0, 300),
      provider_id: id,
      error,
    });
  } catch (e) {
    console.error("[email] no se pudo registrar en email_log:", e);
  }
}
