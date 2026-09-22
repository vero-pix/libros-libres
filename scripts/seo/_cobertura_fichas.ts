/**
 * ¿Cuántas fichas aparecen en Google? Pagina el reporte de páginas de Search
 * Console (la API devuelve 1000 filas por llamada) hasta agotarlo y lo compara
 * con los listings activos.
 *
 *   npx tsx scripts/seo/_cobertura_fichas.ts
 */
import { loadEnv, searchConsole, siteUrl, dateNDaysAgo } from "./_shared";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

loadEnv();
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  if (!line.includes("=") || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

async function main() {
  const api = await searchConsole();
  const startDate = dateNDaysAgo(31);
  const endDate = dateNDaysAgo(3);

  const filas: { keys: string[]; clicks: number; impressions: number }[] = [];
  for (let startRow = 0; startRow < 25000; startRow += 1000) {
    const res: any = await api.searchanalytics.query({
      siteUrl: siteUrl(),
      requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: 1000, startRow },
    });
    const rows = res.data.rows ?? [];
    filas.push(...rows);
    if (rows.length < 1000) break;
  }

  const fichas = filas.filter((r) => /\/libro\//.test(r.keys[0]));
  const conClic = fichas.filter((r) => r.clicks > 0);

  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { count: activos } = await s.from("listings").select("id", { count: "exact", head: true }).eq("status", "active");

  console.log(`Rango: ${startDate} → ${endDate}`);
  console.log(`URLs con al menos una impresión: ${filas.length}`);
  console.log(`  · fichas /libro/: ${fichas.length}`);
  console.log(`  · fichas con al menos un clic: ${conClic.length}`);
  console.log(`Listings activos en la base: ${activos}`);
  const pct = activos ? ((fichas.length / activos) * 100).toFixed(1) : "—";
  console.log(`\nFichas que Google llegó a mostrar: ${pct}% del catálogo`);
  console.log(`Fichas que NO aparecieron ni una vez: ${(activos ?? 0) - fichas.length}`);

}
main();
