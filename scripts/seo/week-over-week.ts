/**
 * Comparativa semana vs semana en Google Search Console.
 *
 * Dos ventanas de 7 días consecutivas, terminando en la última fecha con datos
 * (GSC tiene ~3 días de lag). Muestra totales (clics/impresiones/CTR/posición)
 * y los mayores movimientos por query y por página.
 *
 * Uso:
 *   npx tsx scripts/seo/week-over-week.ts
 *   npx tsx scripts/seo/week-over-week.ts -- --end 2026-07-19   # fija el fin
 */
import { loadEnv, searchConsole, siteUrl } from "./_shared";

loadEnv();

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
}

function parseEnd(argv: string[]): string | undefined {
  const i = argv.indexOf("--end");
  return i >= 0 ? argv[i + 1] : undefined;
}

async function q(dimension: "query" | "page", startDate: string, endDate: string): Promise<Row[]> {
  const sc = searchConsole();
  const res = await sc.searchanalytics.query({
    siteUrl: siteUrl(),
    requestBody: { startDate, endDate, dimensions: [dimension], rowLimit: 25000, type: "web" },
  });
  return (res.data.rows ?? []) as Row[];
}

function totals(rows: Row[]) {
  const clicks = rows.reduce((a, r) => a + r.clicks, 0);
  const impressions = rows.reduce((a, r) => a + r.impressions, 0);
  // Posición media ponderada por impresiones (como la calcula GSC).
  const posW = rows.reduce((a, r) => a + r.position * r.impressions, 0);
  const position = impressions ? posW / impressions : 0;
  const ctr = impressions ? clicks / impressions : 0;
  return { clicks, impressions, ctr, position };
}

function pct(cur: number, prev: number): string {
  if (prev === 0) return cur === 0 ? "±0%" : "nuevo";
  const d = ((cur - prev) / prev) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(0)}%`;
}
function delta(cur: number, prev: number, digits = 0): string {
  const d = cur - prev;
  return `${d >= 0 ? "+" : ""}${d.toFixed(digits)}`;
}

function byKey(rows: Row[]): Map<string, Row> {
  const m = new Map<string, Row>();
  for (const r of rows) m.set(r.keys[0], r);
  return m;
}

function movers(curRows: Row[], prevRows: Row[], metric: "clicks" | "impressions", topN = 12) {
  const cur = byKey(curRows);
  const prev = byKey(prevRows);
  const keys = new Set(Array.from(cur.keys()).concat(Array.from(prev.keys())));
  const out: Array<{ key: string; cur: number; prev: number; diff: number; pos: number; posPrev: number }> = [];
  for (const k of Array.from(keys)) {
    const c = cur.get(k);
    const p = prev.get(k);
    const cv = c?.[metric] ?? 0;
    const pv = p?.[metric] ?? 0;
    out.push({ key: k, cur: cv, prev: pv, diff: cv - pv, pos: c?.position ?? 0, posPrev: p?.position ?? 0 });
  }
  return out.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, topN);
}

async function main() {
  const endArg = parseEnd(process.argv.slice(2));
  // Fin por defecto: hace 3 días (lag de GSC).
  const end = endArg ?? addDays(ymd(new Date()), -3);
  const curStart = addDays(end, -6); // ventana de 7 días (inclusive)
  const prevEnd = addDays(curStart, -1);
  const prevStart = addDays(prevEnd, -6);

  console.log(`\n📊 GSC — semana vs semana  (propiedad ${siteUrl()})`);
  console.log(`   Esta semana:    ${curStart} → ${end}`);
  console.log(`   Semana pasada:  ${prevStart} → ${prevEnd}\n`);

  const [curQ, prevQ, curP, prevP] = await Promise.all([
    q("query", curStart, end),
    q("query", prevStart, prevEnd),
    q("page", curStart, end),
    q("page", prevStart, prevEnd),
  ]);

  const tc = totals(curQ);
  const tp = totals(prevQ);

  console.log("── TOTALES ─────────────────────────────────────────────");
  console.log(`Clics         ${tp.clicks}  →  ${tc.clicks}   (${delta(tc.clicks, tp.clicks)}, ${pct(tc.clicks, tp.clicks)})`);
  console.log(`Impresiones   ${tp.impressions}  →  ${tc.impressions}   (${delta(tc.impressions, tp.impressions)}, ${pct(tc.impressions, tp.impressions)})`);
  console.log(`CTR           ${(tp.ctr * 100).toFixed(2)}%  →  ${(tc.ctr * 100).toFixed(2)}%   (${delta(tc.ctr * 100, tp.ctr * 100, 2)} pts)`);
  console.log(`Posición med. ${tp.position.toFixed(1)}  →  ${tc.position.toFixed(1)}   (${delta(tc.position, tp.position, 1)}, ${tc.position < tp.position ? "mejora ↑" : "baja ↓"})`);

  const fmtQ = (rows: ReturnType<typeof movers>, unit: string) => {
    for (const r of rows) {
      const posInfo = r.pos ? ` · pos ${r.posPrev ? r.posPrev.toFixed(0) + "→" : ""}${r.pos.toFixed(0)}` : "";
      console.log(`  ${r.diff >= 0 ? "▲" : "▼"} ${(r.diff >= 0 ? "+" : "") + r.diff} ${unit}  ${r.key}   (${r.prev}→${r.cur})${posInfo}`);
    }
  };

  console.log("\n── QUERIES: mayores movimientos en CLICS ───────────────");
  fmtQ(movers(curQ, prevQ, "clicks"), "clics");
  console.log("\n── QUERIES: mayores movimientos en IMPRESIONES ─────────");
  fmtQ(movers(curQ, prevQ, "impressions"), "impr");

  const stripHost = (u: string) => u.replace(/^https?:\/\/[^/]+/, "") || "/";
  console.log("\n── PÁGINAS: mayores movimientos en CLICS ───────────────");
  for (const r of movers(curP, prevP, "clicks")) {
    console.log(`  ${r.diff >= 0 ? "▲" : "▼"} ${(r.diff >= 0 ? "+" : "") + r.diff} clics  ${stripHost(r.key)}   (${r.prev}→${r.cur})`);
  }
  console.log("\n── PÁGINAS: mayores movimientos en IMPRESIONES ─────────");
  for (const r of movers(curP, prevP, "impressions")) {
    console.log(`  ${r.diff >= 0 ? "▲" : "▼"} ${(r.diff >= 0 ? "+" : "") + r.diff} impr  ${stripHost(r.key)}   (${r.prev}→${r.cur})`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
