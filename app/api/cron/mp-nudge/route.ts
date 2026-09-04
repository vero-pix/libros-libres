import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { VERO_INBOX } from "@/lib/veroInbox";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const REPLY_TO = VERO_INBOX;
const FROM = "Vero de tuslibros.cl <noreply@tuslibros.cl>";
const VERO = "veronicavelasquez@mac.com";

/**
 * GET /api/cron/mp-nudge
 *
 * Empuja a conectar MercadoPago a los vendedores nuevos que ya publicaron pero
 * no han conectado MP (sin MP no pueden cobrar el split y se pierden ventas).
 *
 * Diseño SIN columna de estado: apunta a quienes se registraron hace entre 48h
 * y 72h. Como el cron corre 1 vez al día, esa ventana de 24h la cruza cada
 * vendedor exactamente una vez → recibe el correo una sola vez, sin necesidad
 * de marcar "ya enviado". Si el cron falla un día, ese cohorte se pierde el
 * nudge (tolerancia aceptable, igual que cleanup-bots).
 *
 * Condiciones: registrado en la ventana, ≥1 listing activo, sin MP
 * (ni access_token ni user_id), no en vacaciones.
 *
 * Protegido por CRON_SECRET. Acepta ?dry=1 para simular sin enviar.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const olderThan = new Date(now - 3 * dayMs).toISOString(); // 72h
  const newerThan = new Date(now - 2 * dayMs).toISOString(); // 48h

  // Candidatos del cohorte 48-72h, sin MP, no en vacaciones
  const { data: users, error } = await supabase
    .from("users")
    // La bandera de "tiene MP conectado" es mercadopago_user_id, no el token:
    // los tokens se movieron a mp_credentials. Verificado el 27 jul, los dos
    // campos calzaban exacto en los 41 vendedores conectados.
    .select("id, email, full_name, mercadopago_user_id, on_vacation, created_at")
    .gte("created_at", olderThan)
    .lt("created_at", newerThan)
    .is("mercadopago_user_id", null)
    .or("on_vacation.is.null,on_vacation.eq.false");

  if (error) {
    console.error("[cron/mp-nudge] fetch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent: { email: string; name: string; listings: number }[] = [];
  const skipped: { email: string; reason: string }[] = [];

  for (const u of users ?? []) {
    if (!u.email) { skipped.push({ email: "(sin email)", reason: "sin email" }); continue; }

    // ≥1 listing activo
    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", u.id)
      .eq("status", "active");
    if (!count) { skipped.push({ email: u.email, reason: "sin listings activos" }); continue; }

    const firstName = (u.full_name ?? "").trim().split(/\s+/)[0] || "";
    const html = nudgeEmail(firstName, count);

    if (dry) { sent.push({ email: u.email, name: firstName, listings: count }); continue; }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [u.email],
        reply_to: REPLY_TO,
        // El asunto anterior ("te falta un paso para vender") leía como que sin
        // MercadoPago no se puede vender, y no es así. Un vendedor dejó de subir
        // libros por eso (31-07-2026): "quiero agregar otra cuenta que no sea
        // mercado pago, por eso no he subido libros".
        subject: firstName ? `${firstName}, así te pueden comprar de todo Chile 📚` : "Así te pueden comprar de todo Chile 📚",
        html,
      }),
    });
    if (res.ok) sent.push({ email: u.email, name: firstName, listings: count });
    else { const t = await res.text(); console.error(`[cron/mp-nudge] resend ${res.status}: ${t}`); skipped.push({ email: u.email, reason: `resend ${res.status}` }); }
  }

  // Recap a Vero solo si hubo envíos (o en dry para inspección)
  if ((sent.length || dry) && !dry) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [VERO],
        reply_to: REPLY_TO,
        subject: `MP nudge: ${sent.length} vendedor(es) contactado(s)`,
        html: `<div style="font-family:-apple-system,sans-serif;font-size:14px;color:#1a1a2e">
          <p>Recordatorio de MercadoPago enviado a:</p>
          ${sent.map((s) => `<div>• ${s.name || "(sin nombre)"} — ${s.email} (${s.listings} libros)</div>`).join("")}
          ${skipped.length ? `<p style="color:#837c70;margin-top:14px">Omitidos: ${skipped.map((s) => `${s.email} (${s.reason})`).join(", ")}</p>` : ""}
        </div>`,
      }),
    });
  }

  console.log(`[cron/mp-nudge] ${dry ? "DRY " : ""}enviados=${sent.length} omitidos=${skipped.length}`);
  return NextResponse.json({ dry, sent, skipped });
}

function nudgeEmail(firstName: string, listings: number) {
  const hi = firstName ? `Hola ${firstName}:` : "Hola:";
  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  <p>${hi}</p>
  <p>Soy Vero, de tuslibros.cl. Vi que ya tienes ${listings === 1 ? "tu primer libro publicado" : `${listings} libros publicados`} — ¡gracias por sumarte! Tus libros ya están a la vista y te pueden escribir cuando quieran.</p>
  <div style="background:#fff8e8;border:1px solid #f0d98a;border-radius:10px;padding:14px 16px;margin:18px 0">
    <p style="margin:0 0 8px"><strong>Si quieres, conecta tu MercadoPago.</strong></p>
    <p style="margin:0 0 12px">Sin conectarlo solo te puede comprar alguien que coordine contigo en persona. Con MercadoPago te compran desde cualquier región y la plata te llega directa a ti. Se hace en 1 minuto desde tu perfil.</p>
    <a href="https://tuslibros.cl/perfil" style="display:inline-block;background:#1a3a6b;color:#fff;text-decoration:none;padding:9px 18px;border-radius:8px;font-weight:600">Conectar MercadoPago</a>
  </div>
  <p>Y si prefieres partir sin conectarlo, no hay drama: tus libros siguen publicados igual y lo puedes hacer cuando quieras.</p>
  <p>Si tienes cualquier duda con el proceso, me respondes este correo directo y te ayudo yo misma.</p>
  <p>— Vero</p>
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;
}
