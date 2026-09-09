import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DROPOFF_COURIERS, estimateBookPackageSize, getShipitQuotes } from "@/lib/shipit";
import { extractCommune } from "@/lib/chilexpress";
import {
  aplicarColchon,
  obtenerColchonCotizacionPct,
  resolverOrigenEnvio,
} from "@/lib/shipping-quote";

/**
 * POST /api/shipping/quote
 * Cotiza envío con Shipit (múltiples couriers).
 *
 * Body: { listing_id, buyer_address, item_count? }
 * Returns: { quotes: ShippingQuote[], unavailable, origin, destination, sizes, buffer_pct }
 *
 * Tres reglas que antes no estaban y le costaban plata a la casa
 * (PROMPT 0.1 de docs/prompts/shipit-automatico-v2.md, 07-09-2026):
 *
 * 1. El ORIGEN se resuelve con la misma regla que usa la creación del envío
 *    (lib/shipping-quote.ts), no solo con `listings.address`.
 * 2. Las MEDIDAS son las mismas con las que después se crea el envío
 *    (`estimateBookPackageSize(item_count)`). Con los defaults de 22×15×5 el
 *    checkout cotizaba $5.433 a Temuco y Shipit cobraba $5.986: Starken
 *    tarifica por peso volumétrico y la caja real era más grande.
 * 3. Un COLCHÓN (site_stats / env, default 10%) sobre el precio de Shipit.
 *
 * Y la modalidad de despacho (D7 revisada): en fase 1 todo vendedor despacha
 * en modalidad `dropoff` — deja el paquete en la sucursal del courier — y
 * eso solo lo aceptan Chilexpress, Starken y Bluexpress. Cuando exista
 * `users.shipit_dispatch_mode` (migración de fase 1), un vendedor en `pickup`
 * cotiza sin filtro.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { listing_id, buyer_address, item_count } = (await req.json()) as {
    listing_id: string;
    buyer_address: string;
    item_count?: number;
  };

  if (!listing_id || !buyer_address) {
    return NextResponse.json(
      { error: "Faltan listing_id o buyer_address" },
      { status: 400 }
    );
  }

  // Origen: listing + vendedor. `users.default_address` es legible por
  // `authenticated` (no por anon), y esta ruta exige sesión.
  const { data: listing } = await supabase
    .from("listings")
    .select("address, seller_id, seller:users(default_address, shipit_origin_commune)")
    .eq("id", listing_id)
    .single();

  const seller = (Array.isArray(listing?.seller) ? listing?.seller[0] : listing?.seller) as
    | { default_address: string | null; shipit_origin_commune: string | null }
    | null
    | undefined;

  // `shipit_origin_commune` manda cuando el vendedor despacha desde una comuna
  // distinta a la del libro. Sin esto se cotizaba desde la dirección del
  // listing: el libro de Bárbara está en Algarrobo, donde ningún courier
  // retira, y ella deja los paquetes en San Antonio. El checkout ofrecía
  // courier —porque ya tenía shipit_origin_id— y después Shipit respondía que
  // no hay servicio, dejando la compra trabada. (09-09-2026)
  const origen = resolverOrigenEnvio({
    listingAddress: listing?.address,
    sellerDefaultAddress: seller?.default_address,
    shipitOriginCommune: seller?.shipit_origin_commune,
  });

  if (!origen) {
    return NextResponse.json(
      { error: "El listing no tiene dirección de origen" },
      { status: 400 }
    );
  }

  const originCommune = origen.commune;
  const destCommune = extractCommune(buyer_address);

  // Medidas reales del paquete: las mismas que usa la creación del envío.
  const items = Math.max(1, Math.min(20, Math.round(Number(item_count) || 1)));
  const sizes = estimateBookPackageSize(items);

  // Modalidad (D7 revisada). Fase 1: dropoff para todos. Cuando exista la
  // columna `users.shipit_dispatch_mode`, leerla acá y dejar `allowedCouriers`
  // en undefined para los vendedores en `pickup`.
  const dispatchMode: "dropoff" | "pickup" = "dropoff";
  const allowedCouriers = dispatchMode === "dropoff" ? DROPOFF_COURIERS : undefined;

  const [{ quotes: cotizadas, unavailable, reason }, bufferPct] = await Promise.all([
    getShipitQuotes(
      originCommune,
      destCommune,
      sizes.weight,
      sizes.height,
      sizes.width,
      sizes.length,
      undefined,
      { allowedCouriers }
    ),
    obtenerColchonCotizacionPct(),
  ]);

  const quotes = cotizadas.map((q) => ({ ...q, price: aplicarColchon(q.price, bufferPct) }));

  // Una línea por cotización: es lo que permite verificar contra el panel de
  // Shipit (criterio de aceptación del PROMPT 0.1) y ver cuánto cuesta el
  // colchón. `shipit=` es el precio crudo; `ofrecido=` lo que ve el comprador.
  console.info(
    `[quote] ${originCommune} (${origen.fuente}) → ${destCommune} · ${items} libro(s) ` +
      `${sizes.length}×${sizes.width}×${sizes.height}cm ${sizes.weight}kg · modo=${dispatchMode} · colchón=${bufferPct}% · ` +
      (cotizadas.length
        ? cotizadas
            .map((q, i) => `${q.courier} shipit=${q.price} ofrecido=${quotes[i].price}`)
            .join(" | ")
        : `sin cotización (${unavailable ? "sin servicio" : reason ?? "falla"})`)
  );

  if (!quotes.length) {
    // Se registra aparte el caso "no cotizamos pero SÍ hay servicio", porque
    // ahí el checkout cobra la tarifa de referencia de $2.900 y la diferencia
    // con el costo real la paga la casa. Buscar esta línea en los logs de
    // Vercel dice cuánto está costando el fallback.
    if (!unavailable) {
      console.error(
        `[quote] FALLBACK $2.900 aplicado — ${originCommune} → ${destCommune} (${reason ?? "sin razón"})`
      );
    }
    return NextResponse.json(
      {
        error:
          reason ??
          `No se encontraron opciones de envío de ${originCommune} a ${destCommune}`,
        quotes: [],
        // `unavailable: true` ⇒ Shipit dijo que no hay servicio para este par de
        // comunas (o ningún courier de sucursal llega). El checkout NO debe
        // ofrecer la tarifa de referencia: se vendería un despacho que nadie
        // puede hacer (Melipeuco, 5 ago 2026).
        unavailable,
        origin: { commune: originCommune, source: origen.fuente },
        destination: { commune: destCommune },
        sizes,
        buffer_pct: bufferPct,
      },
      { status: 200 } // 200 con quotes vacío para que el checkout decida
    );
  }

  return NextResponse.json({
    quotes,
    unavailable: false,
    origin: { commune: originCommune, source: origen.fuente },
    destination: { commune: destCommune },
    sizes,
    buffer_pct: bufferPct,
    dispatch_mode: dispatchMode,
  });
}
