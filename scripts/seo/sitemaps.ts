/**
 * Estado de los sitemaps enviados a Google Search Console (Tarea 3).
 *
 * Uso:  npm run seo:sitemaps
 *
 * Reporta por cada sitemap: cuándo se envió/descargó, si está pendiente,
 * warnings/errors, y el conteo de URLs declaradas (submitted) vs indexadas
 * cuando la API lo expone.
 *
 * LÍMITE CONOCIDO: el reporte agregado "Páginas" de GSC (indexadas vs excluidas
 * CON EL MOTIVO de exclusión) NO está expuesto por la API. Eso se lee a mano en
 * la UI de Search Console. Acá solo medimos cobertura a nivel de sitemap.
 */
import { loadEnv, searchConsole, siteUrl } from "./_shared";

loadEnv();

async function main() {
  const sc = searchConsole();
  const site = siteUrl();
  console.log(`Propiedad: ${site}\n`);

  const list = await sc.sitemaps.list({ siteUrl: site });
  const sitemaps = list.data.sitemap ?? [];
  if (sitemaps.length === 0) {
    console.log("⚠️  No hay sitemaps enviados en esta propiedad.");
    console.log("   Envía https://tuslibros.cl/sitemap.xml desde GSC → Sitemaps.");
    return;
  }

  let totalSubmitted = 0;
  let totalIndexed = 0;

  for (const s of sitemaps) {
    console.log(`━━━ ${s.path} ━━━`);
    console.log(`  Enviado:     ${s.lastSubmitted ?? "—"}`);
    console.log(`  Descargado:  ${s.lastDownloaded ?? "—"}`);
    console.log(`  Pendiente:   ${s.isPending ? "sí" : "no"}`);
    console.log(`  Warnings:    ${s.warnings ?? 0}   Errors: ${s.errors ?? 0}`);

    // Detalle por tipo de contenido (web, image, etc.)
    for (const c of s.contents ?? []) {
      const submitted = Number(c.submitted ?? 0);
      const indexed = Number(c.indexed ?? 0);
      totalSubmitted += submitted;
      totalIndexed += indexed;
      const pct = submitted > 0 ? ((indexed / submitted) * 100).toFixed(1) : "—";
      console.log(
        `    [${c.type}] declaradas: ${submitted}  ·  indexadas (según API): ${indexed}  ·  ${pct}%`
      );
    }
    console.log("");
  }

  console.log("━━━ TOTAL ━━━");
  console.log(`  URLs declaradas en sitemaps: ${totalSubmitted}`);
  if (totalIndexed > 0) {
    const pct = ((totalIndexed / totalSubmitted) * 100).toFixed(1);
    console.log(`  URLs indexadas (según API):  ${totalIndexed}  (${pct}%)`);
    console.log(`  Línea base de cobertura era 9% (26 may). Comparar contra eso.`);
  } else {
    console.log(
      "  ℹ️  La API no devolvió conteo de indexadas para estos sitemaps " +
        "(es común). Para indexadas vs excluidas con motivo, usar la UI: " +
        "GSC → Páginas."
    );
  }
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message || err);
  process.exit(1);
});
