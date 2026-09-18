/**
 * ¿Google indexó esto o solo lo declaramos? — URL Inspection API de Search
 * Console. Es la diferencia entre "está en el sitemap" (lo decimos nosotros) y
 * "está en el índice" (lo dice Google).
 *
 * Uso:
 *   npm run seo:indexadas                     # páginas clave + 20 fichas recientes
 *   npm run seo:indexadas -- --fichas 60      # más fichas
 *   npm run seo:indexadas -- --urls https://tuslibros.cl/vender,https://tuslibros.cl/
 *   npm run seo:indexadas -- --vendedor vero  # solo las fichas de un vendedor
 *
 * Salida:
 *   - consola: una línea por URL, agrupadas por estado
 *   - scripts/seo/output/indexadas-<fecha>.json
 *
 * Cuota de la API: 2.000 inspecciones al día y 600 por minuto, por propiedad.
 * Por eso el script pausa entre llamadas y limita cuántas fichas mira.
 *
 * Requiere el mismo setup que seo:gsc (service account con permiso en GSC,
 * GOOGLE_APPLICATION_CREDENTIALS y GSC_SITE_URL en .env.local).
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, searchConsole, siteUrl, outputPath } from "./_shared";

loadEnv();

const PAUSA_MS = 150; // ~400 por minuto, bajo el techo de 600
const BASE = "https://tuslibros.cl";

/** Las que cambian de contenido y conviene vigilar siempre. */
const PAGINAS_CLAVE = [
  "/",
  "/vender",
  "/como-funciona",
  "/ayuda/comprar",
  "/libros-antiguos",
  "/tiendas",
  "/categoria",
];

type Args = { fichas: number; urls: string[]; vendedor?: string };

function parseArgs(argv: string[]): Args {
  const out: Args = { fichas: 20, urls: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--fichas") out.fichas = Number(argv[++i]) || 20;
    else if (a === "--urls") out.urls = (argv[++i] ?? "").split(",").map((u) => u.trim()).filter(Boolean);
    else if (a === "--vendedor") out.vendedor = argv[++i];
  }
  return out;
}

/** Las fichas publicadas más recientemente, que son las que están en duda. */
async function fichasRecientes(cuantas: number, vendedor?: string): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const sb = createClient(url, key);
  let q = sb
    .from("listings")
    .select("slug, created_at, seller:users!inner(username)")
    .eq("status", "active")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(cuantas);
  if (vendedor) q = q.eq("seller.username", vendedor);

  const { data, error } = await q;
  if (error || !data) return [];

  const urls: string[] = [];
  for (const fila of data as unknown as { slug: string; seller: { username: string | null } | null }[]) {
    const usuario = fila.seller?.username;
    if (usuario && fila.slug) urls.push(`${BASE}/libro/${usuario}/${fila.slug}`);
  }
  return urls;
}

type Resultado = {
  url: string;
  veredicto: string;
  estado: string;
  ultimoRastreo: string | null;
  canonicaGoogle: string | null;
  robots: string | null;
};

function esperar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function inspeccionar(urls: string[]): Promise<Resultado[]> {
  const sc = searchConsole();
  const sitio = siteUrl();
  const salida: Resultado[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`\r  inspeccionando ${i + 1}/${urls.length}…`);
    try {
      const res = await sc.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl: sitio, languageCode: "es-CL" },
      });
      const r = res.data.inspectionResult?.indexStatusResult ?? {};
      salida.push({
        url,
        veredicto: r.verdict ?? "SIN DATO",
        estado: r.coverageState ?? "—",
        ultimoRastreo: r.lastCrawlTime ?? null,
        canonicaGoogle: r.googleCanonical ?? null,
        robots: r.robotsTxtState ?? null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      salida.push({
        url,
        veredicto: "ERROR",
        estado: msg.slice(0, 120),
        ultimoRastreo: null,
        canonicaGoogle: null,
        robots: null,
      });
    }
    await esperar(PAUSA_MS);
  }
  process.stdout.write("\r".padEnd(40) + "\r");
  return salida;
}

/** "Submitted and indexed" y similares vs. todo lo demás. */
function estaIndexada(r: Resultado): boolean {
  return r.veredicto === "PASS";
}

function fecha(iso: string | null): string {
  if (!iso) return "nunca rastreada";
  const d = new Date(iso);
  // Por días de calendario en hora de Chile, no por horas redondeadas: con
  // Math.round, un rastreo de ayer a las 22:00 salía como "hoy".
  const enChile = (x: Date) => new Date(x.toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const a = enChile(d);
  const b = enChile(new Date());
  const dias = Math.floor(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000
  );
  const cuando = d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", timeZone: "America/Santiago" });
  return dias === 0 ? `hoy (${cuando})` : dias === 1 ? `ayer (${cuando})` : `hace ${dias} días (${cuando})`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let urls: string[] = [];
  if (args.urls.length) {
    urls = args.urls;
  } else {
    const fichas = await fichasRecientes(args.fichas, args.vendedor);
    urls = args.vendedor ? fichas : [...PAGINAS_CLAVE.map((p) => BASE + p), ...fichas];
  }

  if (!urls.length) {
    console.log("No hay URLs que inspeccionar.");
    return;
  }

  console.log(`Propiedad: ${siteUrl()}`);
  console.log(`Inspeccionando ${urls.length} URLs (cuota diaria: 2.000)\n`);

  const resultados = await inspeccionar(urls);
  const indexadas = resultados.filter(estaIndexada);
  const fuera = resultados.filter((r) => !estaIndexada(r));

  console.log(`━━━ EN EL ÍNDICE DE GOOGLE: ${indexadas.length} de ${resultados.length} ━━━`);
  for (const r of indexadas) {
    const ruta = r.url.replace(BASE, "");
    const corta = ruta.length > 58 ? ruta.slice(0, 57) + "…" : ruta;
    console.log(`  ✓ ${corta}`.padEnd(64) + `último rastreo: ${fecha(r.ultimoRastreo)}`);
  }

  if (fuera.length) {
    console.log(`\n━━━ TODAVÍA NO: ${fuera.length} ━━━`);
    for (const r of fuera) {
      console.log(`  ✗ ${r.url.replace(BASE, "")}`);
      console.log(`      ${r.estado}${r.ultimoRastreo ? ` · ${fecha(r.ultimoRastreo)}` : " · nunca rastreada"}`);
      if (r.canonicaGoogle && r.canonicaGoogle !== r.url) {
        console.log(`      ⚠️  Google la agrupa bajo: ${r.canonicaGoogle}`);
      }
    }
    console.log(
      "\n  Una ficha nueva sin rastrear no es un problema: Google llega solo,\n" +
        "  y tarda de días a semanas. Sí lo es una vieja que dice 'Excluded'."
    );
  }

  const archivo = outputPath(`indexadas-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(archivo, JSON.stringify(resultados, null, 2));
  console.log(`\n📦 Detalle guardado en ${archivo}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
