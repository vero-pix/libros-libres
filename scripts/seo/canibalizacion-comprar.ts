/**
 * Canibalización del lado COMPRADOR.
 *
 * Hermano de `quien-rankea.ts` (que cubre el lado vendedor). Acá pelean cuatro
 * páginas por las mismas consultas: la home, /libros-usados,
 * /libros-usados-chile y /comprar-libros-usados. Consolidar tiene riesgo —
 * antes de mover nada hay que ver cuál gana HOY en cada consulta.
 *
 * Uso: npx tsx scripts/seo/canibalizacion-comprar.ts
 */
import { loadEnv, searchConsole, siteUrl, dateNDaysAgo } from "./_shared";
loadEnv();

const CLAVES = [
  "libros usados",
  "libros usados chile",
  "comprar libros usados",
  "donde comprar libros usados",
  "libros de segunda mano",
  "libros usados baratos",
  "libros baratos",
  "venta de libros",
  "compra de libros usados",
  "libreria de libros usados",
];

/** Páginas que compiten por el mismo intent de compra. */
const EN_DISPUTA = [
  "/",
  "/libros-usados",
  "/libros-usados-chile",
  "/comprar-libros-usados",
  "/libros-usados-baratos",
];

async function main() {
  const sc = await searchConsole();
  const res = await sc.searchanalytics.query({
    siteUrl: siteUrl(),
    requestBody: {
      startDate: dateNDaysAgo(31),
      endDate: dateNDaysAgo(3),
      dimensions: ["query", "page"],
      rowLimit: 5000,
    },
  });
  const rows = (res.data.rows ?? []) as any[];

  // Acumulado por página, para ver quién carga el peso real al final.
  const totales = new Map<string, { clicks: number; impr: number }>();

  for (const clave of CLAVES) {
    const rs = rows
      .filter((r) => r.keys[0] === clave)
      .sort((a, b) => b.impressions - a.impressions);

    if (!rs.length) {
      console.log(`\n"${clave}" — sin datos`);
      continue;
    }

    const disputada = rs.length > 1;
    console.log(`\n"${clave}"${disputada ? "  ⚠️  MÁS DE UNA PÁGINA" : ""}`);

    for (const r of rs) {
      const ruta = r.keys[1].replace("https://tuslibros.cl", "") || "/";
      const marca = EN_DISPUTA.includes(ruta) ? " ←" : "";
      console.log(
        `    ${String(r.clicks).padStart(3)}c ${String(r.impressions).padStart(4)}i` +
          `  pos ${r.position.toFixed(1).padStart(5)}   ${ruta}${marca}`
      );
      const acc = totales.get(ruta) ?? { clicks: 0, impr: 0 };
      acc.clicks += r.clicks;
      acc.impr += r.impressions;
      totales.set(ruta, acc);
    }
  }

  console.log("\n━━━ QUIÉN CARGA EL PESO (suma de las consultas de arriba) ━━━");
  const orden = Array.from(totales.entries()).sort(
    (a, b) => b[1].impr - a[1].impr
  );
  for (const [ruta, t] of orden) {
    const ctr = t.impr ? ((t.clicks / t.impr) * 100).toFixed(1) : "0.0";
    console.log(
      `  ${String(t.clicks).padStart(4)}c ${String(t.impr).padStart(5)}i  ctr ${ctr.padStart(5)}%   ${ruta}`
    );
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
