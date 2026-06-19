/**
 * Auditoría del origen de los 404 / soft-404 (Tarea 4 — prioritaria).
 *
 * REORIENTADO (19 jun 2026) respecto del prompt original. El prompt asumía que
 * la causa raíz era "el sitemap publica URLs muertas" (Set A). Verificado contra
 * el código: NO es así. `app/sitemap.ts` filtra `.eq("status","active")` y topa
 * en 1000 → el sitemap está limpio, Set A saldrá casi vacío.
 *
 * Causa real (confirmada en app/(main)/libro/[username]/[slug]/page.tsx):
 *   - Ficha VENDIDA  → getListing NO filtra status → devuelve la fila →
 *     renderiza con schema SoldOut. NO es 404 (queda indexada a propósito).
 *   - Ficha BORRADA o con slug/username cambiado → null → permanentRedirect("/")
 *     = 308 al home → Google lo marca como SOFT-404.
 *
 * Por eso este script LIDERA con la lista de 404 que exportas de GSC y la
 * clasifica contra la verdad de terreno (Supabase). NO aplica ningún fix:
 * solo diagnostica y propone acción por set.
 *
 * Input requerido: scripts/seo/input/404-gsc.csv
 *   Exportado de GSC → Páginas → "No se ha encontrado (404)" → Exportar.
 *   (opcional) scripts/seo/input/soft404-gsc.csv para el motivo soft-404.
 *
 * Uso:  npm run seo:audit-404
 *
 * Salida: scripts/seo/output/audit-404-<fecha>.csv  (columna `set`: A/B/C/soft404)
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  loadEnv,
  inputPath,
  outputPath,
  parseCsv,
  csvCell,
  dateNDaysAgo,
} from "./_shared";

loadEnv();

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://tuslibros.cl").replace(/\/$/, "");

/** Extrae la primera columna que parezca una URL de una fila del CSV de GSC. */
function pickUrl(row: Record<string, string>): string | null {
  for (const [k, v] of Object.entries(row)) {
    if (/^https?:\/\//i.test(v)) return v.trim();
    if (/url|p[aá]gina|page/i.test(k) && v) return v.trim();
  }
  return null;
}

function readUrlCsv(file: string): string[] {
  if (!fs.existsSync(file)) return [];
  const rows = parseCsv(fs.readFileSync(file, "utf-8"));
  return rows.map(pickUrl).filter((u): u is string => !!u);
}

/** Normaliza una URL a su pathname (sin host, sin query, sin trailing slash). */
function toPath(url: string): string {
  try {
    const u = new URL(url, BASE);
    return u.pathname.replace(/\/$/, "") || "/";
  } catch {
    return url;
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // 1) Verdad de terreno: TODAS las fichas en Supabase (cualquier status), para
  //    poder distinguir una ficha viva de una pausada/vendida (que igual
  //    renderiza con schema SoldOut) de una borrada (que ya no existe → 308→home).
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, slug, status, seller:users(username)");
  if (error) throw new Error("Supabase: " + error.message);

  const livePaths = new Set<string>(); // solo activas (lo que debería estar en sitemap)
  const statusByPath = new Map<string, string>(); // path → status (cualquier ficha existente)
  for (const l of listings ?? []) {
    const username = (l as any).seller?.username;
    const paths: string[] = [`/listings/${l.id}`];
    if (username && l.slug) paths.push(`/libro/${username}/${l.slug}`);
    for (const p of paths) statusByPath.set(p, l.status);
    if (l.status === "active") for (const p of paths) livePaths.add(p);
  }
  const activeCount = (listings ?? []).filter((l) => l.status === "active").length;

  // Usernames vivos (para distinguir Set B de Set C en URLs de ficha).
  const { data: sellers } = await supabase
    .from("users")
    .select("username")
    .not("username", "is", null);
  const liveUsernames = new Set((sellers ?? []).map((s: any) => s.username));

  // 2) Sitemap publicado (para el chequeo Set A, aunque se espera vacío).
  let sitemapPaths = new Set<string>();
  try {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toPath(m[1]));
    sitemapPaths = new Set(locs);
  } catch {
    console.log("⚠️  No se pudo descargar el sitemap (sigo sin Set A).");
  }

  // 3) Lista de 404 exportada de GSC.
  const file404 = inputPath("404-gsc.csv");
  const urls404 = readUrlCsv(file404);
  const fileSoft = inputPath("soft404-gsc.csv");
  const urlsSoft = readUrlCsv(fileSoft);

  if (urls404.length === 0 && urlsSoft.length === 0) {
    console.log(
      `\n⚠️  No hay input. Exporta de GSC y guarda en:\n` +
        `   ${file404}      (motivo "No se ha encontrado (404)")\n` +
        `   ${fileSoft}  (opcional, motivo "Soft 404")\n` +
        `Luego vuelve a correr npm run seo:audit-404.`
    );
    // Aun así, reporto Set A (sitemap vs Supabase), que no depende del input.
  }

  type Out = { set: string; path: string; url: string; recomendacion: string };
  const rows: Out[] = [];

  // Set A — sitemap declara URLs que NO son ficha activa. Distinguir severidad:
  //   - existe pero pausada/vendida → renderiza 200 (SoldOut). Inconsistencia
  //     menor: el sitemap de prod está cacheado/stale; se corrige al revalidar.
  //   - no existe (borrada) → 308→home = soft-404. Sí hay que sacarla del sitemap.
  for (const p of sitemapPaths) {
    if (!p.startsWith("/libro/") || livePaths.has(p)) continue;
    const st = statusByPath.get(p);
    if (st && st !== "active") {
      rows.push({
        set: "A",
        path: p,
        url: BASE + p,
        recomendacion: `Ficha ${st} (renderiza 200, no es 404). Sitemap de prod cacheado/stale; se corrige al revalidar. Severidad baja.`,
      });
    } else {
      rows.push({
        set: "A",
        path: p,
        url: BASE + p,
        recomendacion: "CRÍTICO: el sitemap publica una URL de ficha que ya no existe (308→home). Excluir del sitemap.",
      });
    }
  }

  // Clasificar cada 404 de GSC.
  for (const url of urls404) {
    const p = toPath(url);
    const m = p.match(/^\/libro\/([^/]+)\/(.+)$/);
    if (m && !livePaths.has(p)) {
      const username = m[1];
      if (liveUsernames.has(username)) {
        rows.push({
          set: "B",
          path: p,
          url,
          recomendacion:
            "Ficha vendida/eliminada (vendedor existe, slug ya no). Decidir política: 410 Gone o redirect al perfil/categoría del vendedor (hoy hace 308→home = soft-404).",
        });
      } else {
        rows.push({
          set: "C",
          path: p,
          url,
          recomendacion:
            "Vendedor/username ya no existe o URL legacy. Revisar enlace interno roto.",
        });
      }
    } else if (!livePaths.has(p)) {
      rows.push({
        set: "C",
        path: p,
        url,
        recomendacion: "No matchea patrón de ficha. Enlace interno roto o URL legacy. Revisión manual.",
      });
    }
    // Si SÍ está en livePaths pero GSC la da 404 → falso positivo de GSC (caché viejo). Se omite.
  }

  // Soft-404 (input separado).
  for (const url of urlsSoft) {
    const p = toPath(url);
    rows.push({
      set: "soft404",
      path: p,
      url,
      recomendacion:
        "Devuelve 200 con contenido vacío o redirect a home. Acción: noindex temporal o contenido mínimo / redirect relevante.",
    });
  }

  // Resumen por set.
  const count = (s: string) => rows.filter((r) => r.set === s).length;
  console.log("\n━━━ AUDITORÍA 404 / soft-404 ━━━");
  console.log(`Fichas activas en Supabase: ${activeCount}  (total filas: ${listings?.length ?? 0})`);
  console.log(`URLs en sitemap:            ${sitemapPaths.size}`);
  console.log(`404 exportadas de GSC:      ${urls404.length}`);
  console.log(`soft-404 exportadas:        ${urlsSoft.length}`);
  console.log("");
  const setAcrit = rows.filter((r) => r.set === "A" && r.recomendacion.startsWith("CRÍTICO")).length;
  console.log(`  Set A (sitemap declara no-activa): ${count("A")}  (de las cuales borradas/críticas: ${setAcrit})`);
  console.log(`  Set B (ficha vendida/borrada, vendedor vive):  ${count("B")}`);
  console.log(`  Set C (legacy / enlace roto / sin patrón):     ${count("C")}`);
  console.log(`  soft-404:                                      ${count("soft404")}`);
  if (setAcrit === 0) {
    console.log("\n✅ Sin URLs críticas en el sitemap (las de Set A, si hay, solo renderizan 200 por caché stale).");
  }

  // CSV de salida.
  const date = dateNDaysAgo(0);
  const csv = [
    "set,path,url,recomendacion",
    ...rows.map((r) => [r.set, csvCell(r.path), csvCell(r.url), csvCell(r.recomendacion)].join(",")),
  ].join("\n");
  const outFile = outputPath(`audit-404-${date}.csv`);
  fs.writeFileSync(outFile, csv, "utf-8");
  console.log(`\n📄 Detalle guardado en ${outFile}`);
  console.log("\nℹ️  Este script NO aplica fixes. La política (410 / redirect / sitemap) se decide tras ver los conteos.");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message || err);
  process.exit(1);
});
