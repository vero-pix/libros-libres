import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TO = "veronicavelasquez@mac.com";
const REPLY_TO = "vero@economics.cl";

/**
 * GET /api/cron/seo-report
 *
 * Reporte SEO/tráfico diario a Vero. Calcula desde page_views (tracking propio):
 * pageviews/sesiones de hoy, 7d y 30d, bounce de 7d, top fuentes y top páginas.
 * Las posiciones de keywords NO se automatizan (Semrush no está conectado);
 * el correo incluye un recordatorio para revisarlas a mano.
 *
 * Protegido por CRON_SECRET. Agendado diario en vercel.json.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const d7 = new Date(now - 7 * dayMs).toISOString();
  const d30 = new Date(now - 30 * dayMs).toISOString();
  // Inicio del día en hora Chile (UTC-4)
  const chileNow = new Date(now - 4 * 60 * 60 * 1000);
  const startToday = new Date(Date.UTC(chileNow.getUTCFullYear(), chileNow.getUTCMonth(), chileNow.getUTCDate()) + 4 * 60 * 60 * 1000).toISOString();

  // Detalle de 7 días (una sola query liviana) para sesiones/bounce/fuentes/paths
  const { data: rows7 } = await supabase
    .from("page_views")
    .select("session_id, path, referrer, created_at")
    .gte("created_at", d7)
    .limit(8000);
  const views7 = rows7 ?? [];

  // Totales 30d y hoy con count exacto (sin traer filas)
  const { count: pv30 } = await supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", d30);
  const { count: pvToday } = await supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", startToday);

  // Helpers sobre el subset de 7d
  const sessionsOf = (rows: typeof views7) => new Set(rows.map((r) => r.session_id)).size;
  const today7 = views7.filter((r) => r.created_at >= startToday);

  const pv7 = views7.length;
  const sess7 = sessionsOf(views7);
  const sessToday = sessionsOf(today7);

  // Bounce 7d: sesiones con 1 sola pageview
  const perSession = new Map<string, number>();
  for (const r of views7) perSession.set(r.session_id, (perSession.get(r.session_id) ?? 0) + 1);
  const bounced = Array.from(perSession.values()).filter((n) => n === 1).length;
  const bounceRate = sess7 > 0 ? Math.round((bounced / sess7) * 100) : 0;

  // Top fuentes (primera pageview por sesión)
  const firstRefBySession = new Map<string, string>();
  for (const r of [...views7].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))) {
    if (!firstRefBySession.has(r.session_id)) {
      let ref = (r.referrer ?? "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!ref || ref.includes("tuslibros.cl")) ref = "(directo / interno)";
      firstRefBySession.set(r.session_id, ref);
    }
  }
  const refCounts: Record<string, number> = {};
  for (const ref of Array.from(firstRefBySession.values())) refCounts[ref] = (refCounts[ref] ?? 0) + 1;
  const topRefs = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Top páginas
  const pathCounts: Record<string, number> = {};
  for (const r of views7) {
    const p = (r.path ?? "/").split("?")[0];
    pathCounts[p] = (pathCounts[p] ?? 0) + 1;
  }
  const topPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const fecha = new Date(now - 4 * 60 * 60 * 1000).toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const stat = (v: string | number, label: string) =>
    `<div style="display:inline-block;background:#f5f0e8;border-radius:10px;padding:12px 18px;margin:0 8px 8px 0;text-align:center"><div style="font-size:22px;font-weight:700;color:#1a3a6b">${v}</div><div style="font-size:11px;color:#837c70">${label}</div></div>`;
  const list = (entries: [string, number][]) =>
    entries.map(([k, n]) => `<div style="padding:5px 0;border-bottom:1px solid #f0ebe0;font-size:13px"><strong>${n}</strong> &nbsp;${k}</div>`).join("");

  const html = `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1a1a2e;max-width:600px">
  <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d4a017;margin:0">Reporte SEO diario</p>
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:2px 0">tuslibros.cl</h2>
  <p style="color:#837c70;margin-top:0;font-size:13px">${fecha}</p>

  <h3 style="color:#1a3a6b;border-bottom:2px solid #d4a017;padding-bottom:4px">📈 Tráfico</h3>
  <div>${stat(pvToday ?? 0, "vistas hoy")}${stat(sessToday, "sesiones hoy")}${stat(pv7, "vistas 7d")}${stat(sess7, "sesiones 7d")}${stat(pv30 ?? 0, "vistas 30d")}</div>
  <p style="font-size:14px">Bounce 7 días: <strong>${bounceRate}%</strong> · ${sess7 > 0 ? (pv7 / sess7).toFixed(1) : "0"} páginas por sesión.</p>

  <h3 style="color:#1a3a6b;border-bottom:2px solid #d4a017;padding-bottom:4px">🔎 Fuentes (7d, por sesión)</h3>
  ${list(topRefs)}

  <h3 style="color:#1a3a6b;border-bottom:2px solid #d4a017;padding-bottom:4px">📄 Páginas más vistas (7d)</h3>
  ${list(topPaths)}

  <h3 style="color:#1a3a6b;border-bottom:2px solid #d4a017;padding-bottom:4px">🏆 Keywords</h3>
  <p style="font-size:13px;color:#837c70">Los rankings de Google se revisan a mano en Semrush (no está conectado al sitio). Último snapshot: #1 en «vender libros usados chile» y «libros usados providencia»; «libros de segunda mano» (8) y «libros usados baratos» (11) al borde de la 1ª página.</p>

  <p style="color:#837c70;font-size:12px;margin-top:24px">Reporte automático diario · tuslibros.cl</p>
</div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "tuslibros.cl <noreply@tuslibros.cl>",
      to: [TO],
      reply_to: REPLY_TO,
      subject: `Hallazgos SEO — ${fecha} 📈`,
      html,
    }),
  });

  return NextResponse.json({ ok: true, pvToday, sessToday, pv7, sess7, pv30, bounceRate });
}
