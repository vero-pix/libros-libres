/**
 * Indexación ficha por ficha vía urlInspection.index.inspect (Tarea 5 — opcional).
 *
 * SCAFFOLD. No implementado en el primer pase. Implementar solo cuando el setup
 * base (gsc-report) ya devuelva datos reales.
 *
 * Plan:
 *   - Leer las URLs canónicas de fichas desde Supabase (tabla listings, activas)
 *     en vez del sitemap, para tener la lista exacta de ~fichas vivas.
 *   - Llamar sc.urlInspection.index.inspect({ siteUrl, inspectionUrl }) 1 URL/llamada.
 *   - RESPETAR LA CUOTA: ~2.000 consultas/día, 1 URL por llamada. Throttling
 *     ~600 ms entre llamadas y guardar progreso en JSON para reanudar.
 *   - Por URL guardar: coverageState, indexingState, lastCrawlTime,
 *     robotsTxtState, pageFetchState.
 *   - Resumir: cuántas Indexed vs "Crawled - currently not indexed" vs Discovered.
 *
 * Uso futuro:  npm run seo:inspect -- --limit 200 --resume
 */
import { loadEnv } from "./_shared";

loadEnv();

// TODO(Tarea 5): implementar el barrido con throttling + reanudación.
console.log(
  "Tarea 5 (url-inspection) aún no implementada. Es un scaffold.\n" +
    "Implementar tras validar que npm run seo:gsc devuelve datos reales.\n" +
    "Recordar la cuota: 2.000 consultas/día, 1 URL por llamada, throttling ~600ms."
);
