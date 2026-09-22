/**
 * ¿Dónde está concentrado el stock que Google nunca muestra?
 *
 * Cruza las páginas con impresiones de Search Console (28 días) con los
 * listings activos y agrupa las fichas invisibles por categoría, autor y
 * editorial. Solo sirve para diagnosticar: no escribe nada.
 *
 *   npx tsx scripts/seo/_grupos_invisibles.ts
 */
import { loadEnv, searchConsole, siteUrl, dateNDaysAgo } from "./_shared";
import { createClient } from "@supabase/supabase-js";

loadEnv();

type Fila = { keys: string[]; clicks: number; impressions: number };

async function paginasGSC(): Promise<Fila[]> {
  const api = await searchConsole();
  const startDate = dateNDaysAgo(31);
  const endDate = dateNDaysAgo(3);
  const filas: Fila[] = [];
  for (let startRow = 0; startRow < 25000; startRow += 1000) {
    const res: any = await api.searchanalytics.query({
      siteUrl: siteUrl(),
      requestBody: { startDate, endDate, dimensions: ["page"], rowLimit: 1000, startRow },
    });
    const rows: Fila[] = res.data.rows ?? [];
    filas.push(...rows);
    if (rows.length < 1000) break;
  }
  return filas;
}

function top(mapa: Map<string, { total: number; invis: number; clics: number }>, n: number) {
  return Array.from(mapa.entries())
    .filter(([k]) => k && k !== "null" && k !== "—")
    .sort((a, b) => b[1].invis - a[1].invis)
    .slice(0, n);
}

async function main() {
  const filas = await paginasGSC();
  // El slug es único global: basta el último segmento de la URL para matchear.
  const slugsVistos = new Set<string>();
  const clicsPorSlug = new Map<string, number>();
  for (const f of filas) {
    const url = f.keys[0];
    if (!/\/libro\/|\/listings\//.test(url)) continue;
    const slug = decodeURIComponent(url.replace(/\/$/, "").split("/").pop() ?? "");
    slugsVistos.add(slug);
    clicsPorSlug.set(slug, (clicsPorSlug.get(slug) ?? 0) + f.clicks);
  }

  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const listings: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await s
      .from("listings")
      .select("id, slug, price, book:books(title, author, publisher, category, subcategory, genre, tags)")
      .eq("status", "active")
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    listings.push(...data);
    if (data.length < 1000) break;
  }

  const porCategoria = new Map<string, { total: number; invis: number; clics: number }>();
  const porAutor = new Map<string, { total: number; invis: number; clics: number }>();
  const porEditorial = new Map<string, { total: number; invis: number; clics: number }>();
  const porSubcat = new Map<string, { total: number; invis: number; clics: number }>();

  const suma = (m: Map<string, any>, k: string | null, invisible: boolean, clics: number) => {
    const key = (k ?? "—").trim() || "—";
    const v = m.get(key) ?? { total: 0, invis: 0, clics: 0 };
    v.total++;
    if (invisible) v.invis++;
    v.clics += clics;
    m.set(key, v);
  };

  let invisibles = 0;
  for (const l of listings) {
    const b = l.book ?? {};
    const visible = l.slug ? slugsVistos.has(l.slug) : slugsVistos.has(l.id);
    const clics = (l.slug ? clicsPorSlug.get(l.slug) : clicsPorSlug.get(l.id)) ?? 0;
    if (!visible) invisibles++;
    suma(porCategoria, b.category, !visible, clics);
    suma(porSubcat, `${b.category ?? "—"} › ${b.subcategory ?? "—"}`, !visible, clics);
    suma(porAutor, b.author, !visible, clics);
    suma(porEditorial, b.publisher, !visible, clics);
  }

  console.log(`Listings activos: ${listings.length} · invisibles en Google: ${invisibles}\n`);

  const imprimir = (titulo: string, m: Map<string, any>, n = 15) => {
    console.log(`\n### ${titulo}`);
    console.log("invis/total  clics  grupo");
    for (const [k, v] of top(m, n)) {
      console.log(`${String(v.invis).padStart(5)}/${String(v.total).padEnd(5)} ${String(v.clics).padStart(5)}  ${k}`);
    }
  };

  imprimir("Por categoría", porCategoria, 20);
  imprimir("Por subcategoría", porSubcat, 20);
  imprimir("Por autor", porAutor, 20);
  imprimir("Por editorial", porEditorial, 20);
}

main();
