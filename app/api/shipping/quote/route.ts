import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShipitQuotes } from "@/lib/shipit";
import { extractCommune } from "@/lib/chilexpress";

/**
 * POST /api/shipping/quote
 * Cotiza envío con Shipit (múltiples couriers).
 * Extrae comuna de origen (listing) y destino (comprador).
 *
 * Body: { listing_id, buyer_address }
 * Returns: { quotes: ShippingQuote[] }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { listing_id, buyer_address } = (await req.json()) as {
    listing_id: string;
    buyer_address: string;
  };

  if (!listing_id || !buyer_address) {
    return NextResponse.json(
      { error: "Faltan listing_id o buyer_address" },
      { status: 400 }
    );
  }

  // Get listing address (origin)
  const { data: listing } = await supabase
    .from("listings")
    .select("address")
    .eq("id", listing_id)
    .single();

  if (!listing?.address) {
    return NextResponse.json(
      { error: "El listing no tiene dirección de origen" },
      { status: 400 }
    );
  }

  // Extract communes
  const originCommune = extractCommune(listing.address);
  const destCommune = extractCommune(buyer_address);

  // Get quotes from Shipit
  const { quotes, unavailable, reason } = await getShipitQuotes(
    originCommune,
    destCommune
  );

  if (!quotes.length) {
    return NextResponse.json(
      {
        error:
          reason ??
          `No se encontraron opciones de envío de ${originCommune} a ${destCommune}`,
        quotes: [],
        // `unavailable: true` ⇒ Shipit dijo que no hay servicio para este par de
        // comunas. El checkout NO debe ofrecer la tarifa de referencia: se
        // vendería un despacho que nadie puede hacer (Melipeuco, 5 ago 2026).
        unavailable,
        origin: { commune: originCommune },
        destination: { commune: destCommune },
      },
      { status: 200 } // 200 con quotes vacío para que el checkout decida
    );
  }

  return NextResponse.json({
    quotes,
    unavailable: false,
    origin: { commune: originCommune },
    destination: { commune: destCommune },
  });
}
