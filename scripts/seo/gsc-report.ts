/**
 * Reporte SEO vía Google Search Console API — Search Analytics + comparativa
 * contra la línea base congelada el 26 may 2026.
 *
 * Uso:
 *   npm run seo:gsc                          # últimos 28 días (hasta hace 3)
 *   npm run seo:gsc -- --start 2026-06-01 --end 2026-06-17
 *   npm run seo:gsc -- --dimension page      # solo tabla por página
 *
 * Salida:
 *   - consola: tabla por query/página + comparativa contra baseline
 *   - scripts/seo/output/gsc-<endDate>.json        (datos crudos)
 *   - scripts/seo/output/comparativa-<endDate>.csv (baseline vs actual)
 *
 * Requiere setup previo (service account + permiso en GSC). Ver README.
 */
import fs from "fs";
import {
  loadEnv,
  searchConsole,
  siteUrl,
  normalizeQuery,
  dateNDaysAgo,
  outputPath,
  csvCell,
} from "./_shared";
import { BASELINE_2026_05_26 } from "./baseline";

loadEnv();

type Row = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

function parseArgs(argv: string[]): {
  start?: string;
  end?: string;
  dimension?: "query" | "page" | "both";
} {
  const out: { start?: string; end?: string; dimension?: any } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--start") out.start = argv[++i];
    else if (a === "--end") out.end = argv[++i];
    else if (a === "--dimension") out.dimension = argv[++i];
  }
  return out;
}

async function queryGsc(
  dimension: "query" | "page",
  startDate: string,
  endDate: string
): Promise<Row[]> {
  const sc = searchConsole();
  const res = await sc.searchanalytics.query({
    siteUrl: siteUrl(),
    requestBody: {
      startDate,
      endDate,
      dimensions: [dimension],
      rowLimit: 1000,
      dataState: "final",
    },
  });
  return (res.data.rows ?? []).map((r) => ({
    keys: r.keys ?? [],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

function printTable(title: string, rows: Row[], limit = 30): void {
  console.log(`\n━━━ ${title} (top ${Math.min(limit, rows.length)} por impresiones) ━━━`);
  console.log(
    "pos".padStart(6) +
      "  " +
      "clicks".padStart(7) +
      "  " +
      "impr".padStart(7) +
      "  ctr".padStart(8) +
      "  clave"
  );
  for (const r of rows.slice(0, limit)) {
    console.log(
      r.position.toFixed(1).padStart(6) +
        "  " +
        String(r.clicks).padStart(7) +
        "  " +
        String(r.impressions).padStart(7) +
        "  " +
        (r.ctr * 100).toFixed(1).padStart(5) +
        "%  " +
        r.keys.join(" / ")
    );
  }
}

function compareBaseline(queryRows: Row[], endDate: string): void {
  // Mapa normalizado de posición actual por query.
  const current = new Map<string, Row>();
  for (const r of queryRows) {
    current.set(normalizeQuery(r.keys[0] ?? ""), r);
  }

  type CompRow = {
    keyword: string;
    posBase: number | null;
    posActual: number | null;
    delta: number | null;
    estado: string;
    clicks: number;
    impressions: number;
  };
  const comp: CompRow[] = [];
  const baselineKeys = new Set<string>();

  for (const [kw, posBase] of Object.entries(BASELINE_2026_05_26)) {
    const norm = normalizeQuery(kw);
    baselineKeys.add(norm);
    const row = current.get(norm);
    if (!row) {
      // OJO: el reporte trae el top 1000 por impresiones. Una keyword de muy bajo
      // volumen puede quedar FUERA de ese corte sin estar realmente perdida.
      // Para confirmar si desapareció de verdad, consultar GSC con filtro directo
      // por esa query (operator "contains"). No asumir pérdida desde acá.
      comp.push({
        keyword: kw,
        posBase,
        posActual: null,
        delta: null,
        estado: "fuera del top 1000 (vol. bajo — verificar con filtro)",
        clicks: 0,
        impressions: 0,
      });
      continue;
    }
    const posActual = row.position;
    const delta = posBase - posActual; // + = mejoró (subió)
    comp.push({
      keyword: kw,
      posBase,
      posActual,
      delta,
      estado: delta > 0 ? "MEJORÓ" : delta < 0 ? "EMPEORÓ" : "IGUAL",
      clicks: row.clicks,
      impressions: row.impressions,
    });
  }

  // Keywords nuevas relevantes (no en baseline) por impresiones.
  const nuevas = queryRows
    .filter((r) => !baselineKeys.has(normalizeQuery(r.keys[0] ?? "")))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  // Tabla en consola
  console.log("\n━━━ COMPARATIVA vs línea base 26-may-2026 ━━━");
  console.log(
    "keyword".padEnd(48) +
      "base".padStart(6) +
      "actual".padStart(8) +
      "delta".padStart(7) +
      "  estado"
  );
  for (const c of comp.sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999))) {
    console.log(
      c.keyword.slice(0, 47).padEnd(48) +
        String(c.posBase ?? "—").padStart(6) +
        (c.posActual != null ? c.posActual.toFixed(1) : "—").padStart(8) +
        (c.delta != null ? (c.delta > 0 ? "+" : "") + c.delta.toFixed(1) : "—").padStart(7) +
        "  " +
        c.estado
    );
  }

  const mejoraron = comp.filter((c) => c.estado === "MEJORÓ").length;
  const empeoraron = comp.filter((c) => c.estado === "EMPEORÓ").length;
  const fueraTop = comp.filter((c) => c.estado.startsWith("fuera del top")).length;
  console.log(
    `\nResumen: ${mejoraron} mejoraron · ${empeoraron} empeoraron · ${fueraTop} fuera del top 1000 (vol. bajo) · ${nuevas.length} nuevas relevantes`
  );

  if (nuevas.length) {
    console.log("\n━━━ KEYWORDS NUEVAS (no estaban en baseline, top por impresiones) ━━━");
    for (const r of nuevas) {
      console.log(
        `  pos ${r.position.toFixed(1).padStart(5)} · ${String(r.impressions).padStart(6)} impr · ${r.keys[0]}`
      );
    }
  }

  // CSV
  const csvLines = [
    "keyword,pos_26may,pos_actual,delta,estado,clicks,impresiones",
    ...comp.map((c) =>
      [
        csvCell(c.keyword),
        c.posBase ?? "",
        c.posActual != null ? c.posActual.toFixed(1) : "",
        c.delta != null ? c.delta.toFixed(1) : "",
        csvCell(c.estado),
        c.clicks,
        c.impressions,
      ].join(",")
    ),
    "",
    "# Keywords nuevas (no en baseline)",
    "keyword,pos_actual,clicks,impresiones",
    ...nuevas.map((r) =>
      [csvCell(r.keys[0]), r.position.toFixed(1), r.clicks, r.impressions].join(",")
    ),
  ];
  const csvFile = outputPath(`comparativa-${endDate}.csv`);
  fs.writeFileSync(csvFile, csvLines.join("\n"), "utf-8");
  console.log(`\n📄 Comparativa guardada en ${csvFile}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  // Default: últimos 28 días, terminando hace 3 (lag de datos de GSC).
  const endDate = args.end ?? dateNDaysAgo(3);
  const startDate = args.start ?? dateNDaysAgo(3 + 28);
  const dimension = args.dimension ?? "both";

  console.log(`Propiedad: ${siteUrl()}`);
  console.log(`Rango: ${startDate} → ${endDate} (dataState: final)`);

  const raw: Record<string, Row[]> = {};

  if (dimension === "query" || dimension === "both") {
    const queryRows = (await queryGsc("query", startDate, endDate)).sort(
      (a, b) => b.impressions - a.impressions
    );
    raw.query = queryRows;
    printTable("CONSULTAS", queryRows);
    compareBaseline(queryRows, endDate);
  }

  if (dimension === "page" || dimension === "both") {
    const pageRows = (await queryGsc("page", startDate, endDate)).sort(
      (a, b) => b.impressions - a.impressions
    );
    raw.page = pageRows;
    printTable("PÁGINAS", pageRows);
  }

  const jsonFile = outputPath(`gsc-${endDate}.json`);
  fs.writeFileSync(
    jsonFile,
    JSON.stringify({ siteUrl: siteUrl(), startDate, endDate, ...raw }, null, 2),
    "utf-8"
  );
  console.log(`\n📦 Datos crudos guardados en ${jsonFile}`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message || err);
  console.error(
    "\nSi vuelve vacío o falla auth, revisa: (1) GSC_SITE_URL (dominio vs prefijo), " +
      "(2) que el service account esté agregado como usuario en GSC, " +
      "(3) GOOGLE_APPLICATION_CREDENTIALS apunta al JSON correcto."
  );
  process.exit(1);
});
