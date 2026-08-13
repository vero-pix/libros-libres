/**
 * paises.ts — de dónde viene el tráfico de búsqueda, por país.
 *
 * Muestra el top de países (últimos 90 días) y luego, para los países
 * definidos en PAISES_DETALLE, qué consultas y qué páginas ven.
 * Sirve para responder "¿hay mercado fuera de Chile?" con datos, no con intuición.
 *
 * Correr: npm run seo:paises
 */
import { loadEnv, searchConsole, siteUrl, dateNDaysAgo } from "./_shared";

loadEnv();

/** Códigos ISO-3 de los países que se abren en detalle (consultas + páginas). */
const PAISES_DETALLE = ["bra", "arg", "per"];

async function main() {
  const sc = searchConsole();
  const start = dateNDaysAgo(93);
  const end = dateNDaysAgo(3);
  console.log(`Rango: ${start} → ${end}\n`);

  const porPais = await sc.searchanalytics.query({
    siteUrl: siteUrl(),
    requestBody: { startDate: start, endDate: end, dimensions: ["country"], rowLimit: 25 },
  });

  console.log("=== TOP PAÍSES ===");
  for (const r of porPais.data.rows ?? []) {
    console.log(
      `${r.keys?.[0]}\tclics=${r.clicks}\timpr=${r.impressions}\tctr=${((r.ctr ?? 0) * 100).toFixed(2)}%\tpos=${(r.position ?? 0).toFixed(1)}`
    );
  }

  for (const pais of PAISES_DETALLE) {
    const q = await sc.searchanalytics.query({
      siteUrl: siteUrl(),
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["query"],
        dimensionFilterGroups: [
          { filters: [{ dimension: "country", operator: "equals", expression: pais }] },
        ],
        rowLimit: 30,
      },
    });
    console.log(`\n=== CONSULTAS DESDE ${pais.toUpperCase()} ===`);
    for (const r of q.data.rows ?? []) {
      console.log(
        `${r.keys?.[0]}\tclics=${r.clicks}\timpr=${r.impressions}\tpos=${(r.position ?? 0).toFixed(1)}`
      );
    }

    const pag = await sc.searchanalytics.query({
      siteUrl: siteUrl(),
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["page"],
        dimensionFilterGroups: [
          { filters: [{ dimension: "country", operator: "equals", expression: pais }] },
        ],
        rowLimit: 20,
      },
    });
    console.log(`\n=== PÁGINAS VISTAS DESDE ${pais.toUpperCase()} ===`);
    for (const r of pag.data.rows ?? []) {
      console.log(`${r.keys?.[0]}\tclics=${r.clicks}\timpr=${r.impressions}`);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
