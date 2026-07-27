/**
 * Borrador de datos para una landing de comuna — NO escribe el texto.
 *
 * POR QUÉ COMUNA Y NO AUTOR. En GSC (90 días) las landings /libros-usados/*
 * rinden ~171 impresiones por URL contra ~8,5 de una ficha, y /pablo-neruda
 * rankea en posición 7,8 pero recibe apenas 10 impresiones. No es problema de
 * ranking sino de intención: quien busca "poemas de Neruda" quiere leer gratis,
 * quien busca "libros usados Providencia" quiere comprar. Comuna primero; autor
 * después y priorizando novela y ensayo sobre poesía.
 *
 * CÓMO SE MIDE UNA CANDIDATA. Por inventario ALCANZABLE por geo (Haversine sobre
 * listings.latitude/longitude dentro de radiusKm), que es lo que la página
 * realmente muestra — no por cuántas fichas dicen esa comuna en `address`.
 * Ranquear por inventario a secas es una trampa: elige Melipeuco, con 146 libros
 * de UN vendedor en una comuna de ~5.000 habitantes donde nadie busca. Por eso
 * cada candidata trae población como proxy de volumen de búsqueda.
 *
 * QUÉ NO HACE. No llama a ningún modelo. Extrae del catálogo datos verificables
 * (títulos, años, editoriales, rango de precios, vendedores, categorías) y
 * propone coordenadas y radio. El texto lo escribe una persona encima y pasa por
 * revisión antes de publicar: a escala de decenas automatizar no paga, y la
 * revisión humana es justamente lo que mantiene esto fuera de scaled content
 * abuse.
 *
 * Uso:
 *   npx tsx scripts/seo/borrador-landing-comuna.ts             # ranking de candidatas
 *   npx tsx scripts/seo/borrador-landing-comuna.ts --calibrar   # qué muestran las landings de hoy
 *   npx tsx scripts/seo/borrador-landing-comuna.ts puente-alto  # borrador de una
 *   npx tsx scripts/seo/borrador-landing-comuna.ts --top=3      # borrador de las 3 mejores
 *
 * Ojo: Array.from y NUNCA spread de iteradores. Los scripts .ts entran al
 * type-check de `next build` y eso ya tumbó un deploy antes.
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, outputPath } from "./_shared";
import { CIUDADES, COORDS } from "../../app/(main)/libros-usados/ciudades";

loadEnv();

/**
 * Candidatas sin landing. Coordenadas = hecho geográfico. `hab` es población
 * aproximada, proxy de volumen de búsqueda, no dato del catálogo.
 */
export const CANDIDATAS: Record<
  string,
  { label: string; lat: number; lng: number; radiusKm: number; hab: string }
> = {
  "estacion-central": { label: "Estación Central", lat: -33.461, lng: -70.696, radiusKm: 4, hab: "~206k" },
  "puente-alto": { label: "Puente Alto", lat: -33.6116, lng: -70.576, radiusKm: 7, hab: "~568k" },
  independencia: { label: "Independencia", lat: -33.415, lng: -70.664, radiusKm: 4, hab: "~100k" },
  recoleta: { label: "Recoleta", lat: -33.41, lng: -70.64, radiusKm: 4, hab: "~157k" },
  vitacura: { label: "Vitacura", lat: -33.39, lng: -70.575, radiusKm: 5, hab: "~85k" },
  maipu: { label: "Maipú", lat: -33.511, lng: -70.758, radiusKm: 7, hab: "~522k" },
  penalolen: { label: "Peñalolén", lat: -33.487, lng: -70.54, radiusKm: 5, hab: "~241k" },
  macul: { label: "Macul", lat: -33.489, lng: -70.598, radiusKm: 4, hab: "~117k" },
  "san-bernardo": { label: "San Bernardo", lat: -33.592, lng: -70.7, radiusKm: 7, hab: "~301k" },
  quilicura: { label: "Quilicura", lat: -33.367, lng: -70.729, radiusKm: 6, hab: "~254k" },
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  return (
    2 * R * Math.asin(Math.sqrt(Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2))
  );
}

/** Comuna de una ficha: segundo campo de address, igual que lo hace la UI. */
function comunaDe(address: string | null): string | null {
  const c = address?.split(",")[1]?.trim();
  return c && c.length > 2 ? c : null;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const CLP = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

type Ficha = {
  price: number | null;
  latitude: number;
  longitude: number;
  address: string | null;
  seller_id: string;
  seller_username: string | null;
  titulo: string;
  autor: string;
  anio: number | null;
  editorial: string | null;
  categoria: string | null;
};

async function cargar(): Promise<Ficha[]> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const filas: any[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await sb
      .from("listings")
      .select(
        "price, latitude, longitude, address, seller_id, seller:users(username), book:books(title, author, published_year, publisher, category)"
      )
      .eq("status", "active")
      .range(desde, desde + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    filas.push(...data);
    if (data.length < 1000) break;
  }
  return filas
    .filter((l) => l.latitude != null && l.longitude != null)
    .map((l) => ({
      price: l.price,
      latitude: l.latitude,
      longitude: l.longitude,
      address: l.address,
      seller_id: l.seller_id,
      seller_username: l.seller?.username ?? null,
      titulo: l.book?.title ?? "",
      autor: l.book?.author ?? "",
      anio: l.book?.published_year ?? null,
      editorial: l.book?.publisher ?? null,
      categoria: l.book?.category ?? null,
    }));
}

const dentroDe = (fichas: Ficha[], lat: number, lng: number, r: number) =>
  fichas.filter((f) => haversineKm(lat, lng, f.latitude, f.longitude) <= r);

function topDe(fichas: Ficha[], key: (f: Ficha) => string | null, limite: number) {
  const m = new Map<string, number>();
  for (const f of fichas) {
    const k = key(f);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite);
}

function borrador(slug: string, fichas: Ficha[]): string {
  const c = CANDIDATAS[slug];
  const dentro = dentroDe(fichas, c.lat, c.lng, c.radiusKm);
  const locales = dentro.filter((f) => {
    const cm = comunaDe(f.address);
    return cm && norm(cm) === norm(c.label);
  });

  const precios = dentro.filter((f) => f.price != null).map((f) => f.price as number).sort((a, b) => a - b);
  const mediana = precios.length ? precios[Math.floor(precios.length / 2)] : 0;
  const vendedores = topDe(dentro, (f) => f.seller_username ?? f.seller_id.slice(0, 8), 8);
  const cats = topDe(dentro, (f) => f.categoria, 6);
  const eds = topDe(dentro, (f) => f.editorial?.trim() || null, 6);
  const comunas = topDe(dentro, (f) => comunaDe(f.address), 6);
  const anios = dentro.map((f) => f.anio).filter((a): a is number => !!a && a > 1400).sort((a, b) => a - b);
  const antiguos = dentro.filter((f) => f.anio && f.anio < 1980).sort((a, b) => (a.anio ?? 0) - (b.anio ?? 0)).slice(0, 8);
  const caros = dentro.filter((f) => f.price != null).sort((a, b) => (b.price ?? 0) - (a.price ?? 0)).slice(0, 8);

  const L: string[] = [];
  L.push(`# Borrador · /libros-usados/${slug}`);
  L.push(``);
  L.push(`**${c.label}** · población ${c.hab} (proxy de volumen de búsqueda, no dato del catálogo)`);
  L.push(``);
  L.push(`## Entrada para ciudades.ts`);
  L.push(``);
  L.push("```ts");
  L.push(`"${slug}": { lat: ${c.lat}, lng: ${c.lng}, radiusKm: ${c.radiusKm} },`);
  L.push("```");
  L.push(``);
  L.push(`## Datos verificables del catálogo`);
  L.push(``);
  L.push(`- **Fichas alcanzables** (lo que la página va a mostrar): ${dentro.length}`);
  L.push(`- **De ellas, con dirección en ${c.label}**: ${locales.length}${dentro.length ? ` (${((locales.length / dentro.length) * 100).toFixed(0)}%)` : ""}`);
  L.push(`- **Vendedores distintos:** ${new Set(dentro.map((f) => f.seller_id)).size}`);
  if (precios.length) L.push(`- **Precio:** ${CLP(precios[0])} a ${CLP(precios[precios.length - 1])} · mediana ${CLP(mediana)}`);
  if (anios.length) L.push(`- **Años de edición:** ${anios[0]}–${anios[anios.length - 1]} (${anios.length} con año declarado)`);
  L.push(``);
  L.push(`**Comunas que aporta el radio de ${c.radiusKm} km:**`);
  for (const [k, n] of comunas) L.push(`- ${k} — ${n}`);
  L.push(``);
  L.push(`**Vendedores con más stock:**`);
  for (const [k, n] of vendedores) L.push(`- ${k} — ${n}`);
  L.push(``);
  L.push(`**Categorías dominantes:**`);
  for (const [k, n] of cats) L.push(`- ${k} — ${n}`);
  if (eds.length) {
    L.push(``);
    L.push(`**Editoriales más presentes:**`);
    for (const [k, n] of eds) L.push(`- ${k} — ${n}`);
  }
  if (antiguos.length) {
    L.push(``);
    L.push(`**Ejemplares antiguos (gancho de libro raro):**`);
    for (const f of antiguos) L.push(`- ${f.anio} · ${f.titulo}${f.autor ? ` — ${f.autor}` : ""}${f.price ? ` · ${CLP(f.price)}` : ""}`);
  }
  L.push(``);
  L.push(`**Los más caros (señal de catálogo de colección):**`);
  for (const f of caros) L.push(`- ${CLP(f.price ?? 0)} · ${f.titulo}${f.autor ? ` — ${f.autor}` : ""}`);
  L.push(``);
  L.push(`## Qué se escribe a mano encima`);
  L.push(``);
  L.push(`- \`heroSub\`: una línea, voz de Vero en primera persona.`);
  L.push(`- \`intro\`: un párrafo único, SOLO con datos de arriba. Cero opinión inventada.`);
  L.push(`- \`faqs\`: 3–4 preguntas propias de la comuna (retiro, referencias locales, despacho).`);
  L.push(`- Español de Chile, nunca voseo. Revisar antes de publicar.`);
  L.push(``);
  return L.join("\n");
}

async function main() {
  const fichas = await cargar();
  const args = process.argv.slice(2);
  const pedida = args.find((a) => !a.startsWith("--"));
  const topArg = args.find((a) => a.startsWith("--top="));

  if (args.includes("--calibrar")) {
    console.log(`Qué muestra cada landing existente hoy (${fichas.length} fichas activas con geo)\n`);
    console.log("alcanz.  local  %local  vend.  radio  landing");
    const rows = Object.entries(COORDS)
      .map(([slug, c]) => {
        const dentro = dentroDe(fichas, c.lat, c.lng, c.radiusKm);
        const label = norm(CIUDADES[slug]?.label ?? slug);
        const local = dentro.filter((f) => {
          const cm = comunaDe(f.address);
          return cm && norm(cm) === label;
        }).length;
        return { slug, n: dentro.length, local, v: new Set(dentro.map((f) => f.seller_id)).size, r: c.radiusKm };
      })
      .sort((a, b) => b.n - a.n);
    for (const r of rows) {
      const pct = r.n ? ((r.local / r.n) * 100).toFixed(0) : "0";
      console.log(`${String(r.n).padStart(7)}  ${String(r.local).padStart(5)}  ${pct.padStart(5)}%  ${String(r.v).padStart(5)}  ${String(r.r).padStart(4)}k  ${r.slug}`);
    }
    const ns = rows.map((r) => r.n).sort((a, b) => a - b);
    console.log(`\nMediana de fichas alcanzables entre las landings de hoy: ${ns[Math.floor(ns.length / 2)]}`);
    console.log(`Sirve de piso: una candidata nueva no debería quedar bajo eso.`);
    return;
  }

  const ranking = Object.keys(CANDIDATAS)
    .filter((slug) => !CIUDADES[slug])
    .map((slug) => {
      const c = CANDIDATAS[slug];
      const dentro = dentroDe(fichas, c.lat, c.lng, c.radiusKm);
      return { slug, c, n: dentro.length, v: new Set(dentro.map((f) => f.seller_id)).size };
    })
    .sort((a, b) => b.n - a.n);

  if (!pedida && !topArg) {
    console.log(`Candidatas sin landing (${fichas.length} fichas activas con geo)\n`);
    console.log("alcanz.  vend.  radio  población  candidata");
    for (const r of ranking) {
      console.log(`${String(r.n).padStart(7)}  ${String(r.v).padStart(5)}  ${String(r.c.radiusKm).padStart(4)}k  ${r.c.hab.padStart(9)}  ${r.c.label}`);
    }
    console.log(`\nLandings existentes: ${Object.keys(CIUDADES).length}`);
    console.log(`Comparar con --calibrar antes de elegir. Ojo: mucho inventario con UN`);
    console.log(`vendedor es frágil, y mucha población con cero inventario es thin content.`);
    return;
  }

  const objetivo = pedida
    ? ranking.filter((r) => r.slug === pedida || norm(r.c.label) === norm(pedida))
    : ranking.slice(0, Number(topArg!.split("=")[1]) || 3);

  if (!objetivo.length) {
    console.log(`Sin candidata "${pedida}". Opciones: ${Object.keys(CANDIDATAS).join(", ")}`);
    return;
  }

  for (const r of objetivo) {
    const md = borrador(r.slug, fichas);
    const file = outputPath(`borrador-${r.slug}.md`);
    fs.writeFileSync(file, md, "utf-8");
    console.log(`→ ${file}`);
  }
  console.log(`\n${objetivo.length} borrador(es) escrito(s). Revisar antes de redactar el copy.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
