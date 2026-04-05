import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  preferenceClient,
  sellerPreferenceClient,
  SERVICE_FEE,
  SHIPPING_COSTS,
  COURIER_BY_SPEED,
} from "@/lib/mercadopago";
import { calculateCommission } from "@/lib/commissions";
import { refreshSellerToken } from "@/lib/mercadopago-oauth";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    listing_id,
    shipping_speed,
    shipping_cost_override,
    shipping_service,
    buyer_address,
  } = body as {
    listing_id: string;
    shipping_speed: "standard" | "express";
    shipping_cost_override?: number;
    shipping_service?: string;
    buyer_address?: string;
  };

  if (!listing_id || !shipping_speed) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  // Fetch listing with book and seller (incluyendo datos MP para split)
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select(
      `*, book:books(*), seller:users(id, full_name, email, phone, mercadopago_access_token, mercadopago_user_id, plan)`
    )
    .eq("id", listing_id)
    .eq("status", "active")
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { error: "Publicación no encontrada o no disponible" },
      { status: 404 }
    );
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json(
      { error: "No puedes comprar tu propio libro" },
      { status: 400 }
    );
  }

  const seller = listing.seller as {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    mercadopago_access_token: string | null;
    mercadopago_user_id: string | null;
    plan: "free" | "librero" | "libreria";
  };

  const bookPrice = listing.price ?? 0;
  // Usar precio real de Chilexpress si viene, sino fallback fijo
  const shippingCost = shipping_cost_override ?? SHIPPING_COSTS[shipping_speed] ?? SHIPPING_COSTS.standard;
  const courier = shipping_service ?? COURIER_BY_SPEED[shipping_speed] ?? "Chilexpress";

  // Calcular comisión según plan del vendedor
  const useSplit = !!seller.mercadopago_access_token;
  const { rate: commissionRate, commission } = useSplit
    ? calculateCommission(bookPrice, seller.plan ?? "free", "sale")
    : { rate: 0, commission: 0 };

  // Sin split: fee fijo. Con split: comisión sobre precio del libro
  const serviceFee = useSplit ? commission : SERVICE_FEE;
  const total = bookPrice + shippingCost + serviceFee;

  // Create order in Supabase
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      book_price: bookPrice,
      shipping_cost: shippingCost,
      service_fee: serviceFee,
      total,
      status: "pending",
      shipping_speed,
      courier,
      buyer_address: buyer_address ?? null,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Error al crear la orden: " + (orderError?.message ?? "unknown") },
      { status: 500 }
    );
  }

  // Create MercadoPago preference
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const book = listing.book as { title: string; author: string };

  try {
    const items = [
      {
        id: listing_id,
        title: `${book.title} — ${book.author}`,
        quantity: 1,
        unit_price: Math.round(bookPrice),
        currency_id: "CLP",
      },
      {
        id: `shipping-${order.id}`,
        title: `Envío ${shipping_speed === "express" ? "rápido" : "estándar"} (${courier})`,
        quantity: 1,
        unit_price: Math.round(shippingCost),
        currency_id: "CLP",
      },
      {
        id: `fee-${order.id}`,
        title: "Cargo por servicio tuslibros.cl",
        quantity: 1,
        unit_price: Math.round(serviceFee),
        currency_id: "CLP",
      },
    ];

    const backUrls = {
      success: `${siteUrl}/orders/${order.id}?status=success`,
      failure: `${siteUrl}/orders/${order.id}?status=failure`,
      pending: `${siteUrl}/orders/${order.id}?status=pending`,
    };

    let preference;

    if (useSplit) {
      // ── SPLIT PAYMENT ──
      const collectorId = process.env.MERCADOPAGO_COLLECTOR_ID;
      if (!collectorId) {
        await supabase.from("orders").delete().eq("id", order.id);
        return NextResponse.json({ error: "Configuración de marketplace incompleta" }, { status: 500 });
      }
      let sellerToken = seller.mercadopago_access_token!;
      const splitBody = {
        items,
        marketplace_fee: commission + shippingCost,
        marketplace: collectorId,
        back_urls: backUrls,
        auto_return: "approved" as const,
        external_reference: order.id,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      };

      // Get refresh token upfront
      const { data: sellerTokenData } = await supabase
        .from("users")
        .select("mercadopago_refresh_token")
        .eq("id", seller.id)
        .single();
      const refreshToken = sellerTokenData?.mercadopago_refresh_token ?? "";

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
      // ── SIN SPLIT (vendedor sin MP conectado) ──
      // Todo llega a tuslibros, se transfiere manualmente después.
      preference = await preferenceClient.create({
        body: {
          items,
          back_urls: backUrls,
          auto_return: "approved",
          external_reference: order.id,
          notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        },
      });
    }

    // Update order with preference ID
    await supabase
      .from("orders")
      .update({ mercadopago_preference_id: preference.id })
      .eq("id", order.id);

    // Registrar comisión si es split
    if (useSplit) {
      await supabase.from("commissions").insert({
        order_id: order.id,
        seller_id: listing.seller_id,
        transaction_type: "sale",
        gross_amount: bookPrice,
        commission_rate: commissionRate,
        commission_amount: commission,
        seller_plan: seller.plan ?? "free",
      });
    }

    return NextResponse.json({
      order_id: order.id,
      init_point: preference.init_point,
    });
  } catch (err: unknown) {
    // Clean up the order if MP fails
    await supabase.from("orders").delete().eq("id", order.id);
    let message = "Error de MercadoPago";
    if (err instanceof Error) {
      message = err.message;
    }
    console.error("MercadoPago error:", JSON.stringify(err, null, 2));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
