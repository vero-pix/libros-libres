import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findCoverageCode,
  getShippingRates,
  extractCommune,
} from "@/lib/chilexpress";

/**
 * POST /api/shipping/quote
 * Cotiza envío con Chilexpress basado en dirección origen (listing) y destino (comprador).
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

  // Obtener dirección del listing (origen)
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

  // Extraer comunas
  const originCommune = extractCommune(listing.address);
  const destCommune = extractCommune(buyer_address);

  // Buscar códigos de cobertura en paralelo
  const [originCoverage, destCoverage] = await Promise.all([
    findCoverageCode(originCommune),
    findCoverageCode(destCommune),
  ]);

  if (!originCoverage) {
    return NextResponse.json(
      { error: `No se encontró cobertura para origen: ${originCommune}` },
      { status: 400 }
    );
  }
  if (!destCoverage) {
    return NextResponse.json(
      { error: `No se encontró cobertura para destino: ${destCommune}` },
      { status: 400 }
    );
  }

  // Cotizar (peso promedio de un libro: 0.5 kg, dimensiones estándar)
  const quotes = await getShippingRates(
    originCoverage.coverageCityId,
    destCoverage.coverageCityId
  );

  if (!quotes.length) {
    return NextResponse.json(
      { error: "Chilexpress no tiene servicios disponibles para esta ruta" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    quotes,
    origin: {
      commune: originCoverage.countyName,
      code: originCoverage.coverageCityId,
    },
    destination: {
      commune: destCoverage.countyName,
      code: destCoverage.coverageCityId,
    },
  });
}
