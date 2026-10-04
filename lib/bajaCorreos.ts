import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Darse de baja de los correos masivos y recurrentes con un clic, sin iniciar
 * sesión (04-10-2026).
 *
 * Hasta ahora la única salida era "respóndeme y lo saco": la ley 21.719 pide
 * que retirar el consentimiento sea tan fácil como darlo, y suscribirse era un
 * clic.
 *
 * Qué cubre una baja: el newsletter, el resumen diario del "Se busca" a
 * vendedores y los avisos de "Se busca" por tema. NO cubre los correos de una
 * venta, un envío o una reseña: esos son parte de una compra en curso.
 *
 * Dónde queda: `newsletter_subscribers.unsubscribed_at`, por correo. Quien
 * nunca se suscribió (un vendedor registrado, alguien que pidió un libro) queda
 * igual con una fila marcada, que sirve de lista de supresión. Así funciona sin
 * migración. Ver también `/api/baja` y `/baja`.
 *
 * El token es un HMAC del correo, igual que el de las reseñas
 * (lib/resenaToken.ts): no hay nada que guardar, se verifica recalculándolo.
 */

const SITE = "https://tuslibros.cl";

function secreto(): string {
  const s = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!s) throw new Error("Sin secreto para firmar el link de baja");
  return s;
}

export function normalizarCorreo(email: string): string {
  return email.trim().toLowerCase();
}

export function firmarBaja(email: string): string {
  return crypto
    .createHmac("sha256", secreto())
    .update(`baja:${normalizarCorreo(email)}`)
    .digest("base64url")
    .slice(0, 32);
}

/** Comparación en tiempo constante. */
export function verificarBaja(email: string | null | undefined, token: string | null | undefined): boolean {
  if (!email || !token) return false;
  try {
    const a = Buffer.from(firmarBaja(email));
    const b = Buffer.from(token);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * El correo va en base64url y no en claro: no queda un "@" a la vista en el
 * link ni en los registros de quien lo copie.
 */
export function codificarCorreo(email: string): string {
  return Buffer.from(normalizarCorreo(email), "utf8").toString("base64url");
}

export function decodificarCorreo(e: string | null | undefined): string | null {
  if (!e) return null;
  try {
    const s = Buffer.from(e, "base64url").toString("utf8");
    return s.includes("@") ? normalizarCorreo(s) : null;
  } catch {
    return null;
  }
}

function query(email: string): string {
  return `e=${codificarCorreo(email)}&t=${firmarBaja(email)}`;
}

/** Link visible del pie: abre la página que pide confirmar. */
export function urlBaja(email: string): string {
  return `${SITE}/baja?${query(email)}`;
}

/**
 * Encabezados para Gmail, Apple Mail y compañía (RFC 8058): el cliente muestra
 * su propio botón "Cancelar suscripción" y hace un POST a esta URL.
 */
export function encabezadosBaja(email: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${SITE}/api/baja?${query(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** Pie para el final del HTML de un correo masivo o recurrente. */
export function pieBajaHtml(email: string): string {
  return `
<p style="color:#9a9a9a;font-size:11px;line-height:1.5;margin:24px auto 0;max-width:540px;text-align:center;font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ¿Prefieres no recibir más estos correos? <a href="${urlBaja(email)}" style="color:#8a6d2e;text-decoration:underline;">Date de baja con un clic</a>. Los avisos de tus compras y ventas te siguen llegando igual.
</p>`;
}

/** Agrega el pie dentro del `<body>` si el HTML es un documento completo, o al final si no. */
export function agregarPieBaja(html: string, email: string): string {
  const pie = pieBajaHtml(email);
  const i = html.toLowerCase().lastIndexOf("</body>");
  return i >= 0 ? html.slice(0, i) + pie + html.slice(i) : html + pie;
}

/** Marca la baja. Devuelve false si no se pudo guardar. */
export async function darDeBaja(db: SupabaseClient, email: string): Promise<boolean> {
  const { error } = await db
    .from("newsletter_subscribers")
    .upsert(
      { email: normalizarCorreo(email), unsubscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );
  if (error) console.error("[baja] no se pudo guardar:", error.message);
  return !error;
}

/**
 * Correos dados de baja, en minúsculas. Si la consulta falla devuelve `null`:
 * quien llama decide (un envío masivo debería frenar antes que escribirle a
 * alguien que pidió que no).
 */
export async function correosDadosDeBaja(db: SupabaseClient): Promise<Set<string> | null> {
  const bajas = new Set<string>();
  for (let pos = 0; ; pos += 1000) {
    const { data, error } = await db
      .from("newsletter_subscribers")
      .select("email")
      .not("unsubscribed_at", "is", null)
      .range(pos, pos + 999);
    if (error) {
      console.error("[baja] no se pudo leer la lista de bajas:", error.message);
      return null;
    }
    for (const r of data ?? []) if (r.email) bajas.add(normalizarCorreo(r.email));
    if (!data || data.length < 1000) break;
  }
  return bajas;
}
