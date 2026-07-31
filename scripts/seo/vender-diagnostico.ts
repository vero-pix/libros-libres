/**
 * Diagnóstico de /vender: qué consultas la traen y si compite con
 * /vender-libros-usados por las mismas palabras (canibalización).
 */
import { loadEnv, searchConsole, siteUrl, dateNDaysAgo } from "./_shared";
loadEnv();

const start = dateNDaysAgo(31);
const end = dateNDaysAgo(3);

async function main() {
  const sc = await searchConsole();
  const res = await sc.searchanalytics.query({
    siteUrl: siteUrl(),
    requestBody: {
      startDate: start, endDate: end,
      dimensions: ["page", "query"],
      rowLimit: 1000,
    },
  });
  const rows = (res.data.rows ?? []) as any[];
  const objetivo = rows.filter((r) => /\/vender/.test(r.keys[0]));
  const porPagina: Record<string, any[]> = {};
  for (const r of objetivo) (porPagina[r.keys[0]] ??= []).push(r);

  console.log(`GSC ${start} → ${end}\n`);
  for (const [page, rs] of Object.entries(porPagina).sort((a, b) =>
    b[1].reduce((s: number, r: any) => s + r.impressions, 0) - a[1].reduce((s: number, r: any) => s + r.impressions, 0))) {
    const cl = rs.reduce((s, r) => s + r.clicks, 0);
    const im = rs.reduce((s, r) => s + r.impressions, 0);
    console.log(`\n━━ ${page.replace("https://tuslibros.cl", "")}   ${cl} clics · ${im} impresiones`);
    rs.sort((a, b) => b.impressions - a.impressions).slice(0, 10).forEach((r) =>
      console.log(`    ${String(r.clicks).padStart(3)}c ${String(r.impressions).padStart(4)}i  pos ${r.position.toFixed(1).padStart(5)}  ctr ${(r.ctr*100).toFixed(1).padStart(5)}%  "${r.keys[1]}"`));
  }

  // ¿Las mismas consultas apuntan a dos páginas distintas?
  // Sin Set: el target de TS del proyecto no permite iterarlo (rompe next build).
  const porQuery: Record<string, string[]> = {};
  for (const r of objetivo) {
    const arr = (porQuery[r.keys[1]] ??= []);
    if (!arr.includes(r.keys[0])) arr.push(r.keys[0]);
  }
  const chocan = Object.entries(porQuery).filter(([, ps]) => ps.length > 1);
  console.log(`\n\n━━ CANIBALIZACIÓN: ${chocan.length} consultas apuntan a más de una página`);
  for (const [q, ps] of chocan.slice(0, 15)) {
    console.log(`\n  "${q}"`);
    for (const p of ps) {
      const r = objetivo.find((x) => x.keys[1] === q && x.keys[0] === p)!;
      console.log(`     ${String(r.clicks).padStart(3)}c ${String(r.impressions).padStart(4)}i  pos ${r.position.toFixed(1).padStart(5)}   ${p.replace("https://tuslibros.cl", "")}`);
    }
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
