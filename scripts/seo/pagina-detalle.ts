/** Todo lo que GSC sabe de una página. Uso: npx tsx scripts/seo/pagina-detalle.ts /ruta */
import { loadEnv, searchConsole, siteUrl, dateNDaysAgo } from "./_shared";
loadEnv();
const ruta = process.argv[2] ?? "/vender-libros-usados";
async function main() {
  const sc = await searchConsole();
  const res = await sc.searchanalytics.query({
    siteUrl: siteUrl(),
    requestBody: {
      startDate: dateNDaysAgo(90), endDate: dateNDaysAgo(3),
      dimensions: ["page", "query"], rowLimit: 5000,
    },
  });
  const rows = (res.data.rows ?? []) as any[];
  const mias = rows.filter(r => r.keys[0].replace("https://tuslibros.cl","").replace("https://www.tuslibros.cl","") === ruta);
  const cl = mias.reduce((s,r)=>s+r.clicks,0), im = mias.reduce((s,r)=>s+r.impressions,0);
  console.log(`${ruta} — últimos 90 días: ${cl} clics · ${im} impresiones · ${mias.length} consultas\n`);
  mias.sort((a,b)=>b.impressions-a.impressions).slice(0,20).forEach(r =>
    console.log(`   ${String(r.clicks).padStart(3)}c ${String(r.impressions).padStart(4)}i  pos ${r.position.toFixed(1).padStart(5)}  "${r.keys[1]}"`));
}
main().catch(e => { console.error(e.message); process.exit(1); });
