import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  preferenceClient,
  SERVICE_FEE,
  SHIPPING_COSTS,
  COURIER_BY_SPEED,
} from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { listing_id, shipping_speed, buyer_address } = body as {
    listing_id: string;
    shipping_speed: "standard" | "express";
    buyer_address?: string;
  };

  if (!listing_id || !shipping_speed) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  // Fetch listing with book and seller
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select(
      `*, book:books(*), seller:users(id, full_name, email, phone)`
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

  const bookPrice = listing.price ?? 0;
  const shippingCost = SHIPPING_COSTS[shipping_speed] ?? SHIPPING_COSTS.standard;
  const serviceFee = SERVICE_FEE;
  const total = bookPrice + shippingCost + serviceFee;
  const courier = COURIER_BY_SPEED[shipping_speed] ?? "Chilexpress";

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
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: listing_id,
            title: `${book.title} — ${book.author}`,
            quantity: 1,
            unit_price: bookPrice,
            currency_id: "CLP",
          },
          {
            id: `shipping-${order.id}`,
            title: `Envío ${shipping_speed === "express" ? "rápido" : "estándar"} (${courier})`,
            quantity: 1,
            unit_price: shippingCost,
            currency_id: "CLP",
          },
          {
            id: `fee-${order.id}`,
            title: "Cargo por servicio",
            quantity: 1,
            unit_price: serviceFee,
            currency_id: "CLP",
          },
        ],
        back_urls: {
          success: `${siteUrl}/orders/${order.id}?status=success`,
          failure: `${siteUrl}/orders/${order.id}?status=failure`,
          pending: `${siteUrl}/orders/${order.id}?status=pending`,
        },
        auto_return: "approved",
        external_reference: order.id,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      },
    });

    // Update order with preference ID
    await supabase
      .from("orders")
      .update({ mercadopago_preference_id: preference.id })
      .eq("id", order.id);

    return NextResponse.json({
      order_id: order.id,
      init_point: preference.init_point,
    });
  } catch (err) {
    // Clean up the order if MP fails
    await supabase.from("orders").delete().eq("id", order.id);
    const message = err instanceof Error ? err.message : "Error de MercadoPago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
