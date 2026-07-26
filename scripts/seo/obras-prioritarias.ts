/**
 * ¿DÓNDE conviene escribir contexto editorial de obra?
 *
 * No en las 1.859 obras del catálogo: generar texto masivo para todas es
 * exactamente el patrón que Google penaliza como scaled content abuse. La idea es
 * escribir donde ya hay demanda demostrada y la ficha no la está capturando.
 *
 * Criterio: fichas de libro (/libro/[username]/[slug]) que YA reciben impresiones
 * en Google y consiguen pocos o ningún clic. Google las muestra, nadie las abre —
 * ahí un texto único de contexto sí puede mover la aguja.
 *
 * Agrupa por OBRA (books.id), no por ficha, porque book_reviews vive a nivel de
 * obra y una editorial se muestra en TODAS las copias del mismo libro. Dos
 * vendedores con el mismo título suman su demanda.
 *
 * Excluye las obras que ya tienen editorial (índice único: una por obra).
 *
 * ── QUÉ ENCONTRÓ ESTE SCRIPT (26 jul 2026) ──
 * La respuesta fue "casi ninguna": en 90 días las fichas de listings ACTIVOS
 * suman 763 impresiones repartidas en 232 URLs — ~3 impresiones por ficha por
 * trimestre. No hay demanda que capturar ahí, así que escribir contexto por
 * obra no paga el esfuerzo hoy.
 * Ojo con el espejismo: una sola URL legacy de WordPress
 * (/libro/veinte-poemas-...-neruda/) acumula 1.531 impresiones, pero está en
 * POSICIÓN MEDIA 70 (página 7) y sobre consultas informativas —gente que quiere
 * leer el poema, no comprar el libro—. Cero clics ahí es lo normal, no una fuga.
 * Donde sí hay densidad: /libros-usados/* (15 URLs, 2.569 impresiones = ~171
 * cada una) y las landings de autor (/pablo-neruda rankea en posición 7,8).
 * Conclusión: contenido generado rinde en LANDINGS, no en fichas.
 *
 * Uso:
 *   npx tsx scripts/seo/obras-prioritarias.ts            # últimos 90 días
 *   npx tsx scripts/seo/obras-prioritarias.ts --dias=28
 *   npx tsx scripts/seo/obras-prioritarias.ts --top=80
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, siteUrl, searchConsole, dateNDaysAgo, outputPath, csvCell } from "./_shared";

loadEnv();

const arg = (name: string, def: number): number => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  const n = hit ? Number(hit.split("=")[1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
};
const DIAS = arg("dias", 90);
const TOP = arg("top", 60);

type Fila = { page: string; clicks: number; impressions: number; ctr: number; position: number };

async function filasGsc(): Promise<Fila[]> {
  const sc = searchConsole();
  const out: Fila[] = [];
  // La API tope 25.000 filas por request: paginamos con startRow.
  for (let startRow = 0; ; startRow += 25000) {
    const res = await sc.searchanalytics.query({
      siteUrl: siteUrl(),
      requestBody: {
        startDate: dateNDaysAgo(DIAS),
        endDate: dateNDaysAgo(1),
        dimensions: ["page"],
        rowLimit: 25000,
        startRow,
        dimensionFilterGroups: [
          { filters: [{ dimension: "page", operator: "contains", expression: "/libro/" }] },
        ],
      },
    });
    const rows = res.data.rows ?? [];
    for (const r of rows) {
      out.push({
        page: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }
    if (rows.length < 25000) break;
  }
  return out;
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  console.log(`GSC: fichas /libro/ · ${dateNDaysAgo(DIAS)} → ${dateNDaysAgo(1)}\n`);
  const filas = await filasGsc();
  if (!filas.length) {
    console.log("GSC no devolvió filas para /libro/. ¿Propiedad correcta? ¿Rango muy corto?");
    return;
  }

  // slug → fila de GSC. La URL amigable es /libro/[username]/[slug].
  const porSlug = new Map<string, Fila>();
  for (const f of filas) {
    // Hay que sacar el query string ANTES de comparar: el redirect de
    // librolibre.cl agrega ?utm_source=librolibre y si no se limpia, la ficha
    // parece inexistente aunque el listing esté vivo.
    const slug = decodeURIComponent(f.page)
      .split("?")[0]
      .split("#")[0]
      .split("/libro/")[1]
      ?.split("/")[1]
      ?.replace(/\/$/, "");
    if (!slug) continue;
    const prev = porSlug.get(slug);
    // Si la misma obra aparece con varias URLs, acumulamos.
    if (prev) {
      prev.clicks += f.clicks;
      prev.impressions += f.impressions;
    } else {
      porSlug.set(slug, { ...f });
    }
  }

  // listings (paginado: Supabase corta en 1000) → book_id + título
  const listings: any[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data } = await supabase
      .from("listings")
      .select("id, slug, book_id, status, price, book:books(id, title, author, published_year, description)")
      .eq("status", "active")
      .range(desde, desde + 999);
    if (!data?.length) break;
    listings.push(...data);
    if (data.length < 1000) break;
  }

  // Obras que ya tienen editorial → fuera
  const { data: yaTienen } = await supabase
    .from("book_reviews")
    .select("book_id")
    .eq("is_editorial", true);
  const conEditorial = new Set((yaTienen ?? []).map((r: any) => r.book_id));

  // Agrupar demanda por OBRA
  type Obra = {
    book_id: string;
    titulo: string;
    autor: string;
    anio: number | null;
    tiene_sinopsis: boolean;
    copias: number;
    clicks: number;
    impressions: number;
    mejor_posicion: number;
    slugs: string[];
  };
  const obras = new Map<string, Obra>();

  for (const l of listings) {
    const f = l.slug ? porSlug.get(l.slug) : undefined;
    if (!f) continue;
    const bid = l.book?.id ?? l.book_id;
    if (!bid || conEditorial.has(bid)) continue;
    const prev = obras.get(bid);
    if (prev) {
      prev.copias++;
      prev.clicks += f.clicks;
      prev.impressions += f.impressions;
      prev.mejor_posicion = Math.min(prev.mejor_posicion, f.position);
      prev.slugs.push(l.slug);
    } else {
      obras.set(bid, {
        book_id: bid,
        titulo: l.book?.title ?? "(sin título)",
        autor: l.book?.author ?? "",
        anio: l.book?.published_year ?? null,
        tiene_sinopsis: !!l.book?.description?.trim(),
        copias: 1,
        clicks: f.clicks,
        impressions: f.impressions,
        mejor_posicion: f.position,
        slugs: [l.slug],
      });
    }
  }

  // Array.from y NO spread: `[...map.values()]` rompe `next build` con el target
  // del tsconfig (los scripts .ts entran al type-check). Ya tumbó un deploy antes.
  const todas = Array.from(obras.values());
  // Prioridad: mucha impresión, poco clic. Sin clics primero, luego por impresiones.
  const candidatas = todas
    .filter((o) => o.impressions > 0)
    .sort((a, b) => {
      if (a.clicks === 0 && b.clicks > 0) return -1;
      if (b.clicks === 0 && a.clicks > 0) return 1;
      return b.impressions - a.impressions;
    });

  const sinClics = candidatas.filter((o) => o.clicks === 0);
  const totalImpr = candidatas.reduce((s, o) => s + o.impressions, 0);
  const imprSinClics = sinClics.reduce((s, o) => s + o.impressions, 0);

  console.log(`Fichas /libro/ con datos en GSC: ${filas.length}`);
  console.log(`Obras activas alcanzadas: ${todas.length} · con impresiones: ${candidatas.length}`);
  console.log(`Obras con impresiones y CERO clics: ${sinClics.length}`);
  console.log(`Impresiones totales: ${totalImpr.toLocaleString("es-CL")} · desperdiciadas (0 clics): ${imprSinClics.toLocaleString("es-CL")} (${((imprSinClics / totalImpr) * 100).toFixed(1)}%)`);
  console.log(`Obras que ya tienen editorial: ${conEditorial.size}\n`);

  const lista = candidatas.slice(0, TOP);
  console.log(`── TOP ${lista.length} donde conviene escribir ──`);
  console.log("impr  clics  pos   copias  sinopsis  obra");
  for (const o of lista) {
    console.log(
      `${String(o.impressions).padStart(4)}  ${String(o.clicks).padStart(5)}  ${o.mejor_posicion.toFixed(1).padStart(5)}  ${String(o.copias).padStart(6)}  ${(o.tiene_sinopsis ? "sí" : "NO").padStart(8)}  ${o.titulo.slice(0, 58)}${o.autor ? ` — ${o.autor.slice(0, 26)}` : ""}`
    );
  }

  const csv = [
    "book_id,titulo,autor,anio,tiene_sinopsis,copias,impresiones,clicks,mejor_posicion,slug",
    ...lista.map((o) =>
      [o.book_id, o.titulo, o.autor, o.anio ?? "", o.tiene_sinopsis ? "si" : "no", o.copias, o.impressions, o.clicks, o.mejor_posicion.toFixed(1), o.slugs[0]]
        .map(csvCell)
        .join(",")
    ),
  ].join("\n");
  const file = outputPath(`obras-prioritarias-${dateNDaysAgo(1)}.csv`);
  fs.writeFileSync(file, csv, "utf-8");
  console.log(`\nCSV: ${file}`);
  console.log(`Estas ${lista.length} obras son el universo a escribir. NO las 1.859.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
