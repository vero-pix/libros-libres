import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  preferenceClient,
  sellerPreferenceClient,
  SERVICE_FEE,
  SHIPPING_COSTS,
  COURIER_BY_SPEED,
} from "@/lib/mercadopago";
import { calculateCommission } from "@/lib/commissions";
import { refreshSellerToken } from "@/lib/mercadopago-oauth";
import { sendGong, escapeHtml } from "@/lib/notifications";
import crypto from "crypto";

/**
 * POST /api/orders
 * Body (bundle):    { listing_ids: string[], shipping_speed, ... }
 * Body (singular):  { listing_id: string, shipping_speed, ... } — compat
 *
 * Crea N orders con un bundle_id compartido y una sola preferencia MP.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const body = await req.json();
  const { guest_info } = body;

  let user = authUser;

  // GUEST CHECKOUT LOGIC
  if (!user && guest_info) {
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1. Check if user already exists in public.users by email
    const { data: existingUser } = await adminSupabase
      .from("users")
      .select("id")
      .eq("email", guest_info.email.toLowerCase().trim())
      .single();

    if (existingUser) {
      user = { id: existingUser.id, email: guest_info.email } as any;
    } else {
      // 2. Create a new user in auth (shadow account)
      const { data: newAuthUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: guest_info.email.toLowerCase().trim(),
        password: crypto.randomBytes(12).toString("hex"),
        email_confirm: true,
        user_metadata: { full_name: guest_info.name }
      });

      if (createError) {
        return NextResponse.json({ error: "Error al crear cuenta de invitado: " + createError.message }, { status: 500 });
      }

      // 3. Create record in public.users
      await adminSupabase.from("users").insert({
        id: newAuthUser.user.id,
        email: guest_info.email.toLowerCase().trim(),
        full_name: guest_info.name,
        phone: guest_info.phone,
        city: body.buyer_address?.split(",").slice(-1)[0]?.trim() || null
      });

      user = newAuthUser.user as any;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const rawListingIds: string[] = Array.isArray(body.listing_ids)
    ? body.listing_ids
    : body.listing_id
      ? [body.listing_id]
      : [];

  const {
    shipping_speed,
    shipping_cost_override,
    shipping_service,
    shipping_courier,
    buyer_address,
  } = body as {
    shipping_speed: "standard" | "express";
    shipping_cost_override?: number;
    shipping_service?: string;
    shipping_courier?: string;
    buyer_address?: string;
  };

  if (rawListingIds.length === 0 || !shipping_speed) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  // Deduplicar
  const listingIds = Array.from(new Set(rawListingIds));

  // Fetch todos los listings del bundle
  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select(
      `*, book:books(*), seller:users(id, full_name, email, phone, mercadopago_access_token, mercadopago_user_id, plan)`
    )
    .in("id", listingIds)
    .eq("status", "active");

  if (listingsError || !listings || listings.length === 0) {
    return NextResponse.json(
      { error: "Publicaciones no encontradas o no disponibles" },
      { status: 404 }
    );
  }

  if (listings.length !== listingIds.length) {
    return NextResponse.json(
      {
        error:
          "Uno o más libros ya no están disponibles. Vuelve al carrito y verifica.",
      },
      { status: 409 }
    );
  }

  // Validar: todos del mismo vendedor
  const sellerIds = new Set(listings.map((l: any) => l.seller_id));
  if (sellerIds.size > 1) {
    return NextResponse.json(
      { error: "El bundle debe ser de un solo vendedor" },
      { status: 400 }
    );
  }

  const sellerId = listings[0].seller_id;

  // Validar: no puede comprar sus propios libros
  if (sellerId === user.id) {
    return NextResponse.json(
      { error: "No puedes comprar tus propios libros" },
      { status: 400 }
    );
  }

  const seller = listings[0].seller as {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    mercadopago_access_token: string | null;
    mercadopago_user_id: string | null;
    plan: "free" | "librero" | "libreria";
  };

  // Cálculos
  const totalBookPrice = listings.reduce(
    (sum: number, l: any) => sum + (l.price ?? 0),
    0
  );
  const shippingCost =
    shipping_cost_override ??
    SHIPPING_COSTS[shipping_speed] ??
    SHIPPING_COSTS.standard;
  const courier =
    shipping_service ?? COURIER_BY_SPEED[shipping_speed] ?? "Envío estándar";

  const useSplit = !!seller.mercadopago_access_token;
  const isInPerson =
    shipping_service === "Entrega en persona" ||
    shipping_service === "Punto de retiro";

  const { rate: commissionRate, commission } = useSplit
    ? calculateCommission(totalBookPrice, seller.plan ?? "free", "sale")
    : { rate: 0, commission: 0 };

  const serviceFee = isInPerson ? 0 : useSplit ? commission : SERVICE_FEE;
  const bundleGrandTotal = totalBookPrice + shippingCost + serviceFee;

  // Generar bundle_id (siempre, también para single-item)
  const bundleId = crypto.randomUUID();

  // Crear N orders, shipping/fee solo en la primera (prorrateo "cabeza del bundle")
  const orderRows = listings.map((l: any, idx: number) => {
    const isFirst = idx === 0;
    const itemShipping = isFirst ? shippingCost : 0;
    const itemFee = isFirst ? serviceFee : 0;
    const itemTotal = (l.price ?? 0) + itemShipping + itemFee;
    return {
      listing_id: l.id,
      buyer_id: user.id,
      seller_id: sellerId,
      book_price: l.price ?? 0,
      shipping_cost: itemShipping,
      service_fee: itemFee,
      total: itemTotal,
      status: "pending",
      shipping_speed,
      courier,
      buyer_address: buyer_address ?? null,
      bundle_id: bundleId,
    };
  });

  const { data: createdOrders, error: orderError } = await supabase
    .from("orders")
    .insert(orderRows)
    .select("id, listing_id");

  if (orderError || !createdOrders || createdOrders.length === 0) {
    return NextResponse.json(
      {
        error:
          "Error al crear las órdenes: " + (orderError?.message ?? "unknown"),
      },
      { status: 500 }
    );
  }

  const firstOrderId = createdOrders[0].id;

  // Preferencia MP
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const items = [
      ...listings.map((l: any) => ({
        id: l.id,
        title: `${l.book.title} — ${l.book.author}`,
        quantity: 1,
        unit_price: Math.round(l.price ?? 0),
        currency_id: "CLP",
      })),
      {
        id: `shipping-${bundleId}`,
        title: `Envío ${shipping_speed === "express" ? "rápido" : "estándar"} (${courier})`,
        quantity: 1,
        unit_price: Math.round(shippingCost),
        currency_id: "CLP",
      },
      {
        id: `fee-${bundleId}`,
        title: "Cargo por servicio tuslibros.cl",
        quantity: 1,
        unit_price: Math.round(serviceFee),
        currency_id: "CLP",
      },
    ];

    const backUrls = {
      success: `${siteUrl}/orders/${firstOrderId}?status=success`,
      failure: `${siteUrl}/orders/${firstOrderId}?status=failure`,
      pending: `${siteUrl}/orders/${firstOrderId}?status=pending`,
    };

    let preference;

    if (useSplit) {
      const collectorId = process.env.MERCADOPAGO_COLLECTOR_ID;
      if (!collectorId) {
        await supabase.from("orders").delete().eq("bundle_id", bundleId);
        return NextResponse.json(
          { error: "Configuración de marketplace incompleta" },
          { status: 500 }
        );
      }

      let sellerToken = seller.mercadopago_access_token!;
      const splitBody = {
        items,
        marketplace_fee: commission + shippingCost,
        marketplace: collectorId,
        back_urls: backUrls,
        auto_return: "approved" as const,
        external_reference: bundleId,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      };

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
      preference = await preferenceClient.create({
        body: {
          items,
          back_urls: backUrls,
          auto_return: "approved",
          external_reference: bundleId,
          notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        },
      });
    }

    // Guardar preference_id en todas las orders del bundle
    await supabase
      .from("orders")
      .update({ mercadopago_preference_id: preference.id })
      .eq("bundle_id", bundleId);

    // Una comisión por bundle
    if (useSplit) {
      await supabase.from("commissions").insert({
        order_id: firstOrderId,
        seller_id: sellerId,
        transaction_type: "sale",
        gross_amount: totalBookPrice,
        commission_rate: commissionRate,
        commission_amount: commission,
        seller_plan: seller.plan ?? "free",
      });
    }

    // Limpiar carrito: quitar los listings recién comprados
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .in("listing_id", listingIds);

    // GONG: Notificar intento de compra
    sendGong(
      `🛍️ <b>Nuevo intento de compra</b>\n\n` +
      `Items: ${listings.length}\n` +
      `Total: <b>$${bundleGrandTotal.toLocaleString("es-CL")}</b>\n` +
      `Vendedor: ${escapeHtml(seller.full_name)}\n` +
      `Comprador: ${escapeHtml(user.user_metadata?.full_name || user.email || "Alguien")}`
    ).catch(() => {});

    return NextResponse.json({
      bundle_id: bundleId,
      order_ids: createdOrders.map((o: any) => o.id),
      order_id: firstOrderId, // compat single-item
      init_point: preference.init_point,
      total: bundleGrandTotal,
    });
  } catch (err: unknown) {
    // Rollback: borrar orders del bundle si MP falla
    await supabase.from("orders").delete().eq("bundle_id", bundleId);
    const message = err instanceof Error ? err.message : "Error de MercadoPago";
    console.error(
      "MercadoPago error:",
      JSON.stringify(err, Object.getOwnPropertyNames(err))
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
