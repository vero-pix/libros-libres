import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TO = "vero@tuslibros.cl";
const REPLY_TO = "vero@tuslibros.cl";

type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

/**
 * Consulta Search Analytics de GSC para un rango y dimensión.
 * Autentica con el service account inyectado como JSON en GSC_SERVICE_ACCOUNT_JSON
 * (en Vercel no existe el archivo local que usan los scripts). Devuelve null si
 * faltan credenciales o la API falla, para que el email no se caiga por esto.
 */
async function queryGsc(
  dimension: "query" | "page",
  startDate: string,
  endDate: string
): Promise<GscRow[] | null> {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const site = process.env.GSC_SITE_URL || "sc-domain:tuslibros.cl";
  if (!raw) return null;
  try {
    const credentials = JSON.parse(raw);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    const sc = google.searchconsole({ version: "v1", auth });
    const res = await sc.searchanalytics.query({
      siteUrl: site,
      requestBody: { startDate, endDate, dimensions: [dimension], rowLimit: 1000, dataState: "final" },
    });
    return (res.data.rows ?? []).map((r) => ({
      keys: r.keys ?? [],
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));
  } catch (err) {
    console.error("[seo-report] GSC query falló:", (err as Error).message);
    return null;
  }
}

/**
 * GET /api/cron/seo-report
 *
 * Reporte SEO/tráfico diario a Vero. Calcula desde page_views (tracking propio):
 * pageviews/sesiones de hoy, 7d y 30d, bounce de 7d, top fuentes y top páginas.
 * Las keywords vienen en vivo de Google Search Console (API, service account):
 * top consultas por clics y las que más crecieron vs el periodo anterior. Si no
 * hay credenciales GSC en el entorno, esa sección cae a un aviso, sin romper el email.
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

  // Detalle de 7 días para sesiones/bounce/fuentes/paths.
  // PostgREST topa cada request a ~1000 filas, así que paginamos con range()
  // hasta traer todo (7d ≈ 2 mil filas → 2-3 páginas).
  const views7: { session_id: string; path: string | null; referrer: string | null; created_at: string }[] = [];
  const PAGE = 1000;
  for (let from = 0; from < 30000; from += PAGE) {
    const { data } = await supabase
      .from("page_views")
      .select("session_id, path, referrer, created_at")
      .gte("created_at", d7)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    views7.push(...(data as typeof views7));
    if (data.length < PAGE) break;
  }

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

  // ── Keywords en vivo desde Google Search Console ──
  // GSC tiene ~3 días de lag; comparamos los últimos 28 días vs los 28 previos.
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const gscEnd = iso(now - 3 * dayMs);
  const gscStart = iso(now - 31 * dayMs);
  const gscPrevEnd = iso(now - 32 * dayMs);
  const gscPrevStart = iso(now - 60 * dayMs);

  const [qCur, qPrev] = await Promise.all([
    queryGsc("query", gscStart, gscEnd),
    queryGsc("query", gscPrevStart, gscPrevEnd),
  ]);

  let keywordsHtml: string;
  if (qCur && qCur.length) {
    const totClicks = qCur.reduce((s, r) => s + r.clicks, 0);
    const totImpr = qCur.reduce((s, r) => s + r.impressions, 0);
    const ctr = totImpr > 0 ? ((totClicks / totImpr) * 100).toFixed(1) : "0";
    const avgPos = qCur.length
      ? (qCur.reduce((s, r) => s + r.position * r.impressions, 0) / (totImpr || 1)).toFixed(1)
      : "—";

    const topByClicks = [...qCur].sort((a, b) => b.clicks - a.clicks).slice(0, 8);

    // Crecimiento vs periodo anterior (por clics)
    const prevMap = new Map<string, number>();
    for (const r of qPrev ?? []) prevMap.set(r.keys[0] ?? "", r.clicks);
    const growth = qCur
      .map((r) => ({ q: r.keys[0] ?? "", delta: r.clicks - (prevMap.get(r.keys[0] ?? "") ?? 0) }))
      .filter((g) => g.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5);

    const kwRow = (q: string, right: string) =>
      `<div style="padding:5px 0;border-bottom:1px solid #f0ebe0;font-size:13px;display:flex;justify-content:space-between"><span>${q}</span><strong style="color:#1a3a6b">${right}</strong></div>`;

    keywordsHtml = `
  <div>${stat(totClicks, "clics 28d")}${stat(totImpr.toLocaleString("es-CL"), "impresiones 28d")}${stat(ctr + "%", "CTR")}${stat("#" + avgPos, "posición prom.")}</div>
  <p style="font-size:13px;color:#837c70;margin:10px 0 4px">Top consultas por clics (28d)</p>
  ${topByClicks.map((r) => kwRow(r.keys[0] ?? "", `${r.clicks} clics · #${r.position.toFixed(1)}`)).join("")}
  ${
    growth.length
      ? `<p style="font-size:13px;color:#837c70;margin:14px 0 4px">Las que más crecieron vs mes anterior</p>${growth
          .map((g) => kwRow(g.q, `+${g.delta} clics`))
          .join("")}`
      : ""
  }
  <p style="font-size:11px;color:#b0a898;margin-top:8px">Fuente: Google Search Console (API) · rango ${gscStart} → ${gscEnd} · lag ~3 días.</p>`;
  } else {
    keywordsHtml = `<p style="font-size:13px;color:#837c70">Sin datos de GSC en este envío${
      process.env.GSC_SERVICE_ACCOUNT_JSON ? " (la API no respondió)" : " — falta configurar GSC_SERVICE_ACCOUNT_JSON en Vercel"
    }. Referencia manual: #1 en «vender libros usados chile» y «libros usados providencia».</p>`;
  }

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

  <h3 style="color:#1a3a6b;border-bottom:2px solid #d4a017;padding-bottom:4px">🏆 Keywords (Search Console)</h3>
  ${keywordsHtml}

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
