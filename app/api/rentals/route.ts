import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  sellerPreferenceClient,
  preferenceClient,
} from "@/lib/mercadopago";
import { calculateCommission } from "@/lib/commissions";
import { refreshSellerToken } from "@/lib/mercadopago-oauth";

/**
 * POST /api/rentals — Crear un arriendo
 * Body: { listing_id, period_days, delivery_method, delivery_address? }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { listing_id, period_days, delivery_method, delivery_address } = body as {
    listing_id: string;
    period_days: 7 | 14 | 30;
    delivery_method: "in_person" | "pickup_point" | "courier";
    delivery_address?: string;
  };

  if (!listing_id || !period_days || !delivery_method) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  if (![7, 14, 30].includes(period_days)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  // Fetch listing con datos del dueño
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select(
      `*, book:books(title, author), seller:users(id, full_name, mercadopago_user_id)`
    )
    .eq("id", listing_id)
    .eq("status", "active")
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "No puedes arrendar tu propio libro" }, { status: 400 });
  }

  if (!listing.rental_price) {
    return NextResponse.json({ error: "Este libro no está disponible para arriendo" }, { status: 400 });
  }

  const seller = listing.seller as {
    id: string;
    full_name: string;
    mercadopago_user_id: string | null;
  };

  const rentalPrice = Number(listing.rental_price);
  const deposit = Number(listing.rental_deposit ?? 0);

  // Comisión
  // Ver orders/route.ts: los tokens son credenciales y solo se leen con service role.
  const useSplit = !!seller.mercadopago_user_id;
  const { rate: commissionRate, commission } = useSplit
    ? calculateCommission(rentalPrice)
    : { rate: 0, commission: 0 };

  const total = rentalPrice + deposit + commission;

  // Crear rental en DB
  const { data: rental, error: rentalError } = await supabase
    .from("rentals")
    .insert({
      listing_id,
      renter_id: user.id,
      owner_id: listing.seller_id,
      period_days,
      rental_price: rentalPrice,
      deposit,
      commission,
      total,
      status: "pending",
      delivery_method,
      delivery_address: delivery_address ?? null,
    })
    .select()
    .single();

  if (rentalError || !rental) {
    return NextResponse.json(
      { error: "Error al crear arriendo: " + (rentalError?.message ?? "unknown") },
      { status: 500 }
    );
  }

  // Crear preferencia MercadoPago
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const book = listing.book as { title: string; author: string };

  try {
    const items = [
      {
        id: `rental-${rental.id}`,
        title: `Arriendo: ${book.title} — ${book.author} (${period_days} días)`,
        quantity: 1,
        unit_price: Math.round(rentalPrice),
        currency_id: "CLP",
      },
    ];

    if (deposit > 0) {
      items.push({
        id: `deposit-${rental.id}`,
        title: "Garantía reembolsable",
        quantity: 1,
        unit_price: Math.round(deposit),
        currency_id: "CLP",
      });
    }

    if (commission > 0) {
      items.push({
        id: `fee-${rental.id}`,
        title: "Cargo por servicio tuslibros.cl",
        quantity: 1,
        unit_price: Math.round(commission),
        currency_id: "CLP",
      });
    }

    const backUrls = {
      success: `${siteUrl}/mis-arriendos?status=success&rental=${rental.id}`,
      failure: `${siteUrl}/mis-arriendos?status=failure`,
      pending: `${siteUrl}/mis-arriendos?status=pending`,
    };

    let preference;

    if (useSplit) {
      const collectorId = process.env.MERCADOPAGO_COLLECTOR_ID;
      if (!collectorId) {
        await supabase.from("rentals").delete().eq("id", rental.id);
        return NextResponse.json({ error: "Configuración de marketplace incompleta" }, { status: 500 });
      }
      const adminSbToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      );
      const { data: sellerCreds } = await adminSbToken
        .from("mp_credentials")
        .select("access_token, refresh_token")
        .eq("user_id", seller.id)
        .maybeSingle();
      if (!sellerCreds?.access_token) {
        await supabase.from("rentals").delete().eq("id", rental.id);
        return NextResponse.json({ error: "El dueño no tiene MercadoPago conectado" }, { status: 409 });
      }
      let sellerToken = sellerCreds.access_token;
      const splitBody = {
        items,
        marketplace_fee: commission,
        marketplace: collectorId,
        back_urls: backUrls,
        auto_return: "approved" as const,
        external_reference: rental.id,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      };

      const refreshToken = sellerCreds.refresh_token ?? "";

      try {
        const sellerPref = sellerPreferenceClient(sellerToken);
        preference = await sellerPref.create({ body: splitBody });
      } catch (splitErr) {
        if (!refreshToken) throw splitErr;
        const freshToken = await refreshSellerToken(seller.id, refreshToken);
        if (!freshToken) throw splitErr;

        sellerToken = freshToken;
        const sellerPref = sellerPreferenceClient(sellerToken);
        preference = await sellerPref.create({ body: splitBody });
      }
    } else {
      preference = await preferenceClient.create({
        body: {
          items,
          back_urls: backUrls,
          auto_return: "approved",
          external_reference: rental.id,
          notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        },
      });
    }

    // Actualizar rental con ID de preferencia
    await supabase
      .from("rentals")
      .update({ mercadopago_preference_id: preference.id })
      .eq("id", rental.id);

    // Registrar comisión
    if (useSplit) {
      await supabase.from("commissions").insert({
        rental_id: rental.id,
        seller_id: listing.seller_id,
        transaction_type: "rental",
        gross_amount: rentalPrice,
        commission_rate: commissionRate,
        commission_amount: commission,
        // Columna heredada de los tramos por plan: es NOT NULL en la BD, así que se
        // escribe fija en "free" hasta aplicar la migración que la vuelve nullable.
        seller_plan: "free",
      });
    }

    return NextResponse.json({
      rental_id: rental.id,
      init_point: preference.init_point,
    });
  } catch (err: unknown) {
    await supabase.from("rentals").delete().eq("id", rental.id);
    const message = err instanceof Error ? err.message : "Error de MercadoPago";
    console.error("MercadoPago rental error:", JSON.stringify(err, null, 2));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
