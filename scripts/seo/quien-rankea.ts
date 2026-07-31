/** Para las consultas de "vender", qué página del sitio entrega Google. */
import { loadEnv, searchConsole, siteUrl, dateNDaysAgo } from "./_shared";
loadEnv();
const CLAVES = ["vender libros usados","vender libros","donde vender libros usados","quiero vender libros usados","vender libros usados chile","donde puedo vender libros usados","venta de libros usados","como vender libros usados"];
async function main() {
  const sc = await searchConsole();
  const res = await sc.searchanalytics.query({
    siteUrl: siteUrl(),
    requestBody: { startDate: dateNDaysAgo(31), endDate: dateNDaysAgo(3), dimensions: ["query","page"], rowLimit: 5000 },
  });
  const rows = (res.data.rows ?? []) as any[];
  for (const clave of CLAVES) {
    const rs = rows.filter(r => r.keys[0] === clave).sort((a,b)=>b.impressions-a.impressions);
    if (!rs.length) { console.log(`\n"${clave}" — sin datos`); continue; }
    console.log(`\n"${clave}"`);
    for (const r of rs) console.log(`    ${String(r.clicks).padStart(3)}c ${String(r.impressions).padStart(4)}i  pos ${r.position.toFixed(1).padStart(5)}   ${r.keys[1].replace("https://tuslibros.cl","") || "/"}`);
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
