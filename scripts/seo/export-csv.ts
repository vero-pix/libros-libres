/**
 * Exporta de Search Console lo mismo que se bajaría a mano desde
 * Rendimiento → Exportar, pero por API y sin tocar el navegador:
 *
 *   scripts/seo/output/gsc-consultas-<desde>_<hasta>.csv
 *   scripts/seo/output/gsc-paginas-<desde>_<hasta>.csv
 *
 * Columnas: clics, impresiones, CTR y posición — la materia prima del reporte.
 *
 *   npm run seo:export                 # últimos 90 días (hasta hace 3)
 *   npm run seo:export -- --dias 180   # otro rango
 *
 * Ojo con el techo de la UI: la exportación manual de GSC corta en 1.000 filas.
 * Acá se pagina hasta traer todo, así que los totales pueden no cuadrar con lo
 * que muestra la pantalla — estos son más completos.
 */
import fs from "fs";
import { loadEnv, searchConsole, siteUrl, outputPath, csvCell } from "./_shared";

loadEnv();

/** GSC consolida con 2-3 días de atraso; pedir hasta ayer devuelve datos a medias. */
const LAG_DIAS = 3;
const MAX_FILAS = 25000; // tope por llamada de la API

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function arg(nombre: string): string | undefined {
  const i = process.argv.indexOf(`--${nombre}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function extraer(
  dimension: "query" | "page",
  startDate: string,
  endDate: string
): Promise<{ clave: string; clicks: number; impressions: number; ctr: number; position: number }[]> {
  const sc = searchConsole();
  const filas: any[] = [];
  let startRow = 0;

  while (true) {
    const { data } = await sc.searchanalytics.query({
      siteUrl: siteUrl(),
      requestBody: {
        startDate,
        endDate,
        dimensions: [dimension],
        rowLimit: MAX_FILAS,
        startRow,
        dataState: "final",
      },
    });
    const lote = data.rows ?? [];
    filas.push(...lote);
    process.stdout.write(`\r  ${dimension}: ${filas.length} filas…`);
    if (lote.length < MAX_FILAS) break;
    startRow += MAX_FILAS;
  }
  process.stdout.write("\n");

  return filas.map((r) => ({
    clave: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

function escribirCsv(
  archivo: string,
  encabezadoClave: string,
  filas: { clave: string; clicks: number; impressions: number; ctr: number; position: number }[]
): void {
  const lineas = [
    `${encabezadoClave},Clics,Impresiones,CTR,Posicion`,
    ...filas.map((f) =>
      [
        csvCell(f.clave),
        f.clicks,
        f.impressions,
        // Mismo formato que exporta la UI de GSC: porcentaje con dos decimales.
        `${(f.ctr * 100).toFixed(2)}%`,
        f.position.toFixed(2),
      ].join(",")
    ),
  ];
  fs.writeFileSync(archivo, lineas.join("\n") + "\n", "utf-8");
}

async function main() {
  const dias = Number(arg("dias") ?? 90);
  const hasta = new Date();
  hasta.setDate(hasta.getDate() - LAG_DIAS);
  const desde = new Date(hasta);
  desde.setDate(desde.getDate() - dias);

  const startDate = ymd(desde);
  const endDate = ymd(hasta);

  console.log(`\n📊 Search Console — ${siteUrl()}`);
  console.log(`   rango: ${startDate} → ${endDate} (${dias} días)\n`);

  const consultas = await extraer("query", startDate, endDate);
  const paginas = await extraer("page", startDate, endDate);

  const fConsultas = outputPath(`gsc-consultas-${startDate}_${endDate}.csv`);
  const fPaginas = outputPath(`gsc-paginas-${startDate}_${endDate}.csv`);
  escribirCsv(fConsultas, "Consulta", consultas);
  escribirCsv(fPaginas, "Pagina", paginas);

  const suma = (xs: { clicks: number; impressions: number }[]) => ({
    clics: xs.reduce((a, b) => a + b.clicks, 0),
    impr: xs.reduce((a, b) => a + b.impressions, 0),
  });
  const c = suma(consultas);
  const p = suma(paginas);

  console.log(`\n✓ ${consultas.length} consultas · ${c.clics} clics · ${c.impr} impresiones`);
  console.log(`   → ${fConsultas}`);
  console.log(`✓ ${paginas.length} páginas · ${p.clics} clics · ${p.impr} impresiones`);
  console.log(`   → ${fPaginas}`);
  console.log(
    `\nNota: GSC no reporta las consultas de bajo volumen por privacidad, así que` +
      `\nla suma de clics por consulta (${c.clics}) queda bajo la de páginas (${p.clics}).\n`
  );
}

main().catch((e) => {
  console.error("\n✗", e?.message ?? e);
  process.exit(1);
});
