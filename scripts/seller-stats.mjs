#!/usr/bin/env node
/**
 * Validación de `seller_stats` — paso b) de docs/prompts/librerias-confianza-resenas.md.
 *
 *   node scripts/seller-stats.mjs            imprime el ranking de is_trusted
 *   node scripts/seller-stats.mjs --refresh  refresca antes de imprimir
 *   node scripts/seller-stats.mjs --todos    incluye a los que NO califican y dice por qué
 *
 * Sirve para contrastar contra la tabla del PROMPT 1: las 8 tiendas que
 * califican con el criterio C1 de lanzamiento (MP + 1 venta pagada en 90 días
 * + 5 libros activos), sin exigir `delivered` todavía.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const args = process.argv.slice(2);

if (args.includes("--refresh")) {
  const t0 = Date.now();
  const { data, error } = await admin.rpc("refresh_seller_stats", { p_seller_id: null });
  if (error) {
    console.error("Error al refrescar:", error.message);
    process.exit(1);
  }
  console.log(`Refrescadas ${data} filas en ${Date.now() - t0} ms.\n`);
}

const { data, error } = await admin
  .from("seller_stats")
  .select(
    "seller_id, paid_90d, delivered_90d, active_listings, mp_connected, reviews_count, reviews_avg, trust_score, is_trusted, top_listing_ids, seller:users(username, city, featured_seller_blocked)"
  )
  .order("trust_score", { ascending: false })
  .limit(1000);

if (error) {
  console.error("Error al leer seller_stats:", error.message);
  process.exit(1);
}

const u = (r) => (Array.isArray(r.seller) ? r.seller[0] : r.seller) ?? {};
const confiables = data.filter((r) => r.is_trusted);

console.log(`LIBRERÍAS DE CONFIANZA — ${confiables.length} tiendas califican de ${data.length} vendedores\n`);
console.log("  #  vendedor                comuna            90d  entr  activos  reseñas  score  portadas");
console.log("  ─────────────────────────────────────────────────────────────────────────────────────────");
confiables.forEach((r, i) => {
  const s = u(r);
  console.log(
    `  ${String(i + 1).padStart(2)}  ${(s.username ?? "?").padEnd(22).slice(0, 22)}  ${(s.city ?? "—").padEnd(16).slice(0, 16)}  ` +
      `${String(r.paid_90d).padStart(3)}  ${String(r.delivered_90d).padStart(4)}  ${String(r.active_listings).padStart(7)}  ` +
      `${String(r.reviews_count).padStart(7)}  ${String(r.trust_score).padStart(5)}  ${String(r.top_listing_ids?.length ?? 0).padStart(8)}`
  );
});

// El promedio solo se muestra públicamente con 3 o más reseñas (decisión C5).
const conPromedio = confiables.filter((r) => r.reviews_count >= 3).length;
console.log(`\n  Con promedio visible (>= 3 reseñas): ${conPromedio} de ${confiables.length}`);
const sinPortadas = confiables.filter((r) => (r.top_listing_ids?.length ?? 0) < 3);
if (sinPortadas.length) {
  console.log(`  ⚠️  Sin 3 portadas: ${sinPortadas.map((r) => u(r).username).join(", ")}`);
}

if (args.includes("--todos")) {
  console.log("\nNO CALIFICAN (motivo del primer filtro que falla):\n");
  data
    .filter((r) => !r.is_trusted)
    .slice(0, 40)
    .forEach((r) => {
      const s = u(r);
      const motivo = s.featured_seller_blocked
        ? "bloqueado a mano"
        : s.username === "vero"
        ? "excluida por decisión C3"
        : !r.mp_connected
        ? "sin MercadoPago"
        : r.paid_90d < 1
        ? "sin ventas pagadas en 90 días"
        : r.active_listings < 5
        ? `solo ${r.active_listings} libros activos`
        : "?";
      console.log(`  ${(s.username ?? r.seller_id).padEnd(24).slice(0, 24)} ${motivo}`);
    });
}
