/**
 * ¿El "Se busca" cierra el círculo o solo avisa?
 *
 * Un pedido "cumplido" hoy significa una sola cosa: alguien publicó un libro
 * que calzaba y se mandó el aviso. No dice si el libro se vendió, y mucho menos
 * si se lo llevó quien lo pidió. Esa es la diferencia entre una función que
 * avisa y una que cierra ventas (ver reference_matching_se_busca).
 *
 * Imprime, sobre book_requests con fulfilled=true:
 *   cumplidos            → pedidos marcados como cumplidos
 *   con orden            → el listing que los cumplió tuvo alguna orden pagada
 *   al solicitante       → esa orden la hizo la misma persona que pidió el libro
 *
 * Uso: node scripts/sebusca_cierre.mjs [--dias=90]
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

for (const line of (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf-8") : "").split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DIAS = Number((process.argv.find((a) => a.startsWith("--dias=")) || "--dias=0").split("=")[1]);

export async function medirCierreSeBusca(client = s, dias = 0) {
  let q = client
    .from("book_requests")
    .select("id, title, author, requester_user_id, requester_email, fulfilled_at, fulfilled_listing_id")
    .eq("fulfilled", true)
    .not("fulfilled_listing_id", "is", null);
  if (dias > 0) {
    q = q.gte("fulfilled_at", new Date(Date.now() - dias * 86400000).toISOString());
  }
  const { data: pedidos, error } = await q;
  if (error) throw new Error(error.message);
  if (!pedidos?.length) return { cumplidos: 0, conOrden: 0, alSolicitante: 0, detalle: [] };

  // Las órdenes pagadas de esos listings, de una sola pasada.
  const listingIds = [...new Set(pedidos.map((p) => p.fulfilled_listing_id))];
  const ordenes = [];
  for (let i = 0; i < listingIds.length; i += 100) {
    const { data } = await client
      .from("orders")
      .select("id, listing_id, buyer_id, status, created_at, buyer:users!buyer_id(email)")
      .in("listing_id", listingIds.slice(i, i + 100))
      .in("status", ["paid", "shipped", "delivered", "completed"]);
    ordenes.push(...(data ?? []));
  }
  const porListing = new Map();
  for (const o of ordenes) {
    if (!porListing.has(o.listing_id)) porListing.set(o.listing_id, []);
    porListing.get(o.listing_id).push(o);
  }

  const detalle = pedidos.map((p) => {
    const suyas = porListing.get(p.fulfilled_listing_id) ?? [];
    // Solo cuentan las órdenes posteriores al cumplimiento: una compra anterior
    // no la gatilló el aviso.
    const posteriores = suyas.filter(
      (o) => !p.fulfilled_at || new Date(o.created_at) >= new Date(p.fulfilled_at)
    );
    const correoPedido = (p.requester_email || "").trim().toLowerCase();
    const delSolicitante = posteriores.find(
      (o) =>
        (p.requester_user_id && o.buyer_id === p.requester_user_id) ||
        (correoPedido && (o.buyer?.email || "").toLowerCase() === correoPedido)
    );
    return {
      titulo: p.title,
      autor: p.author,
      cumplido_el: p.fulfilled_at,
      conOrden: posteriores.length > 0,
      alSolicitante: !!delSolicitante,
    };
  });

  return {
    cumplidos: pedidos.length,
    conOrden: detalle.filter((d) => d.conOrden).length,
    alSolicitante: detalle.filter((d) => d.alSolicitante).length,
    detalle,
  };
}

// Solo imprime cuando se corre a mano; importado desde el cron no hace nada.
if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await medirCierreSeBusca(s, DIAS);
  const ventana = DIAS > 0 ? `últimos ${DIAS} días` : "todo el historial";
  console.log(`\nSe busca — cierre del círculo (${ventana})\n${"─".repeat(58)}`);
  console.log(`  cumplidos       ${r.cumplidos}`);
  console.log(`  con orden       ${r.conOrden}`);
  console.log(`  al solicitante  ${r.alSolicitante}`);
  if (r.detalle.length) {
    console.log(`\n${"TÍTULO".padEnd(42)}ORDEN  SOLICITANTE`);
    for (const d of r.detalle) {
      console.log(
        (d.titulo || "—").slice(0, 40).padEnd(42) +
          (d.conOrden ? "sí" : "no").padEnd(7) +
          (d.alSolicitante ? "sí" : "no")
      );
    }
  }
  console.log(
    `\nSe busca: ${r.cumplidos} cumplidos / ${r.conOrden} vendidos / ${r.alSolicitante} al solicitante\n`
  );
}
