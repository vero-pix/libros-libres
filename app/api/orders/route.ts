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
import { calcularEnvioPromo } from "@/lib/shipping-promo";
import { buscarEnvioAbierto } from "@/lib/envio-pendiente";
import { resolverOrigenEnvio } from "@/lib/shipping-quote";
import { cargoServicio } from "@/lib/cargo-servicio";
import {
  COURIER_COORDINADO,
  ESTADO_COORDINADO_PENDIENTE,
  SERVICIO_COORDINADO,
  obtenerTarifasCoordinado,
  precioCoordinado,
} from "@/lib/shipping/coordinado";
import { preciosAcordados } from "@/lib/offers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { buscarOCrearConversacion } from "@/lib/conversations";
import { sendEmail } from "@/lib/email";
import { VERO_INBOX } from "@/lib/veroInbox";
import { reservarEjemplares, liberarReserva, RESERVA_MP_MINUTOS } from "@/lib/reservas";

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
        // La comuna elegida en el checkout. Antes salía del último tramo de
        // `buyer_address`, que casi siempre es "Chile" y en retiro en persona
        // guardaba el literal "in_person" como ciudad del comprador.
        city: body.buyer_commune?.trim() || null
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
    buyer_commune,
    payment_method,
    discount_code,
  } = body as {
    shipping_speed: "standard" | "express";
    shipping_cost_override?: number;
    shipping_service?: string;
    shipping_courier?: string;
    buyer_address?: string;
    /** Comuna del comprador, de la lista cerrada de lib/comunas.ts. */
    buyer_commune?: string;
    /** "transfer" para pagar por transferencia; cualquier otra cosa, MercadoPago. */
    payment_method?: string;
    discount_code?: string;
  };

  if (rawListingIds.length === 0 || !shipping_speed) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  // Deduplicar
  const listingIds = Array.from(new Set(rawListingIds));

  // Fetch todos los listings del bundle. Con service role: trae correo,
  // teléfono y dirección del vendedor, que no se conceden a authenticated
  // (20260923e) y no salen de esta ruta.
  const { data: listings, error: listingsError } = await createServiceRoleClient()
    .from("listings")
    .select(
      `*, book:books(*), seller:users(id, full_name, email, phone, mercadopago_user_id, on_vacation, acepta_transferencia, default_address, shipit_origin_commune)`
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

  // Bloquear compra si el vendedor está en modo vacaciones
  const vacationSeller = listings.find((l: any) => l.seller?.on_vacation);
  if (vacationSeller) {
    return NextResponse.json(
      {
        error: `${(vacationSeller as any).seller?.full_name ?? "El vendedor"} está en modo vacaciones. Sus libros volverán a estar disponibles cuando regrese.`,
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
    mercadopago_user_id: string | null;
    acepta_transferencia?: boolean | null;
  };

  // Transferencia directa al vendedor. Solo si ESE vendedor la tiene activada:
  // el método lo propone el cliente, pero acá se vuelve a comprobar contra la
  // base — si no, cualquiera podría saltarse el cobro mandando
  // `payment_method: "transfer"` con un curl. El sitio no guarda datos
  // bancarios (23-09-2026): el vendedor se los manda al comprador por mensaje.
  const porTransferencia = payment_method === "transfer" && !!seller.acepta_transferencia;

  // Ofertas aceptadas y vigentes de este comprador (lib/offers.ts). El precio
  // acordado sale de la base, nunca del navegador, y alimenta los TRES lugares
  // que suman plata más abajo —rawBookPrice, orderRows y los items de MP— para
  // que el cuadre de "precio exhibido = precio cobrado" no se rompa. Si el
  // vendedor bajó el precio por debajo de lo acordado, gana el más bajo.
  const acordados = await preciosAcordados(
    createServiceRoleClient(),
    user.id,
    listings.map((l: any) => l.id)
  );
  const precioDe = (l: any): number => {
    const publicado = l.price ?? 0;
    const acordado = acordados[l.id]?.amount;
    return acordado !== undefined && acordado < publicado ? acordado : publicado;
  };

  // Validar y aplicar código de descuento
  let discountPct = 0;
  let discountAmount = 0;
  if (discount_code) {
    const adminSb = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data: codeData } = await adminSb
      .from("discount_codes")
      .select("id, discount_pct, max_uses, uses_count, active, expires_at")
      .eq("code", discount_code.toUpperCase())
      .single();
    if (
      codeData &&
      codeData.active &&
      (!codeData.expires_at || new Date(codeData.expires_at) > new Date()) &&
      (codeData.max_uses === null || codeData.uses_count < codeData.max_uses)
    ) {
      discountPct = codeData.discount_pct;
      // Incrementar usos
      await adminSb
        .from("discount_codes")
        .update({ uses_count: codeData.uses_count + 1 })
        .eq("id", codeData.id);
    }
  }

  // Cálculos
  const rawBookPrice = listings.reduce(
    (sum: number, l: any) => sum + precioDe(l),
    0
  );
  discountAmount = Math.round(rawBookPrice * discountPct / 100);
  const totalBookPrice = rawBookPrice - discountAmount;
  // `shipping_cost_override` es la cotización REAL de Shipit que eligió el
  // comprador. Ojo: viene del cliente. Más abajo se valida contra un piso y la
  // promo de envío gratis se resuelve acá, en el servidor — si viviera solo en
  // el navegador, cualquiera podría pedir envío gratis con un curl.
  const fleteCotizado =
    shipping_cost_override ??
    SHIPPING_COSTS[shipping_speed] ??
    SHIPPING_COSTS.standard;
  // `shipping_courier` es el client real de Shipit ("starken", "chilexpress");
  // `shipping_service` es solo el nombre visible. Esta columna termina viajando
  // al webhook como `courier.client`, así que el client manda. Guardar el
  // nombre visible dejaba a Shipit con `courier.client: ""` y la orden atascada
  // en draft, sin etiqueta ni retiro. (5 ago 2026)
  const courier =
    shipping_courier ??
    shipping_service ??
    COURIER_BY_SPEED[shipping_speed] ??
    "Envío estándar";

  // mercadopago_user_id y no el access_token: la lectura del token quedó
  // revocada para anon/authenticated porque es una credencial. Es además el
  // mismo campo que decide si la ficha muestra el botón de comprar.
  const useSplit = !!seller.mercadopago_user_id;
  const isInPerson =
    shipping_service === "Entrega en persona" ||
    shipping_service === "Punto de retiro";

  // Despacho coordinado por el vendedor (lib/shipping/coordinado.ts). El precio
  // lo recalcula el servidor con la tabla de tarifas: el que manda el navegador
  // solo se acepta si coincide. Requiere que la plata le llegue al vendedor
  // (split de MP o transferencia), porque es él quien paga el courier.
  const esCoordinado = !isInPerson && shipping_courier === COURIER_COORDINADO;
  if (esCoordinado) {
    const origenCoord = resolverOrigenEnvio({
      listingAddress: (listings[0] as any).address,
      sellerDefaultAddress: (seller as any).default_address,
      shipitOriginCommune: (seller as any).shipit_origin_commune,
    });
    const precioServidor =
      useSplit || porTransferencia
        ? precioCoordinado(await obtenerTarifasCoordinado(supabase), origenCoord?.commune, buyer_commune)
        : null;
    if (!precioServidor || precioServidor !== Math.round(Number(shipping_cost_override))) {
      return NextResponse.json(
        { error: "La tarifa de despacho cambió. Vuelve a calcular el envío." },
        { status: 409 }
      );
    }
  }

  // Piso de flete: si es despacho por courier, nadie puede mandar un costo
  // menor al fallback. Sin esto, `shipping_cost_override: 0` en un curl daba
  // envío gratis en cualquier compra, de cualquier vendedor.
  if (!isInPerson && !esCoordinado && fleteCotizado < SHIPPING_COSTS.standard) {
    return NextResponse.json(
      { error: "El costo de despacho no es válido. Vuelve a cotizar el envío." },
      { status: 400 }
    );
  }

  // ¿Este comprador ya tiene un paquete armándose donde este vendedor? Entonces
  // no se le cobra el flete de nuevo: los libros nuevos van en el mismo bulto.
  // Se resuelve acá y no en el navegador por la misma razón que la promo — un
  // curl no puede reclamar envío gratis inventando un bundle previo.
  // Ver lib/envio-pendiente.ts (caso Don Luis, 09-09-2026).
  // El despacho coordinado no vive en `shipments`: no hay paquete abierto al que sumarse.
  const envioAbierto = isInPerson || esCoordinado
    ? null
    : await buscarEnvioAbierto(
        // Cliente de servicio: `shipments` no es legible por el comprador y
        // esta consulta decide plata, así que no puede depender de RLS.
        createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } }
        ),
        {
          buyerId: user.id,
          sellerId,
          direccion: buyer_address ?? null,
        }
      );

  // Envío gratis sobre el umbral: se decide acá, no en el navegador.
  // Ver lib/shipping-promo.ts (25 ago 2026).
  const promo = calcularEnvioPromo({
    sellerId,
    totalBookPrice,
    fleteCotizado,
    // El despacho coordinado lo paga el vendedor con el flete que recibe: no
    // hay subsidio de la promo que aplicar.
    esCourier: !isInPerson && !esCoordinado,
  });
  // El bulto tiene tope: si lo que se está comprando no cabe, este pedido
  // viaja por su cuenta y paga su flete. Ver MAX_LIBROS_POR_PAQUETE.
  const cabeEnElPaquete = !!envioAbierto && listings.length <= envioAbierto.cupo;
  const shippingCost = isInPerson || cabeEnElPaquete ? 0 : promo.cobrarAlComprador;
  // Sumarse a un paquete existente no le cuesta nada a Vero: el flete de ese
  // envío ya lo pagó el comprador en la compra anterior. No es un subsidio.
  const shippingSubsidy = isInPerson || cabeEnElPaquete ? 0 : promo.subsidio;

  const { rate: commissionRate, commission } = useSplit
    ? calculateCommission(totalBookPrice)
    : { rate: 0, commission: 0 };

  // Por transferencia no hay comisión: no existe el split que la retenga, y
  // cobrársela al comprador significaría que el vendedor la recibe y después
  // tendría que devolverla. La venta igual queda registrada en el sitio.
  // Misma función que usa el checkout para mostrar el total (lib/cargo-servicio.ts).
  const serviceFee = cargoServicio({
    enPersona: isInPerson,
    porTransferencia,
    vendedorConMP: useSplit,
    totalLibros: totalBookPrice,
  });
  const bundleGrandTotal = totalBookPrice + shippingCost + serviceFee;

  // Generar bundle_id (siempre, también para single-item)
  const bundleId = crypto.randomUUID();

  // Reserva de los ejemplares, todo el carrito o nada (lib/reservas.ts). Hasta
  // el 24-09-2026 no había reserva: dos compradores podían pagar el mismo libro.
  // Una reserva vigente del mismo comprador no bloquea, así que reintentar el
  // checkout nunca le da 409 a quien ya lo tenía reservado.
  const reserva = await reservarEjemplares(createServiceRoleClient(), {
    listingIds,
    bundleId,
    buyerId: user.id,
    metodo: porTransferencia ? "transfer" : "mercadopago",
  });
  if (!reserva.ok) {
    return NextResponse.json({ error: reserva.error }, { status: reserva.status });
  }

  // Crear N orders, shipping/fee solo en la primera (prorrateo "cabeza del bundle")
  const orderRows = listings.map((l: any, idx: number) => {
    const isFirst = idx === 0;
    const rawItemPrice = precioDe(l);
    const itemDiscount = isFirst ? discountAmount : 0;
    const discountedItemPrice = rawItemPrice - itemDiscount;
    const itemShipping = isFirst ? shippingCost : 0;
    const itemFee = isFirst ? serviceFee : 0;
    const itemTotal = discountedItemPrice + itemShipping + itemFee;
    return {
      listing_id: l.id,
      buyer_id: user.id,
      seller_id: sellerId,
      book_price: discountedItemPrice,
      shipping_cost: itemShipping,
      // Lo que Vero puso de su bolsillo por el envío gratis. `shipping_cost` es
      // lo que pagó el comprador; sin esta columna no hay forma de saber cuánto
      // costó la promo. Ver lib/shipping-promo.ts (25 ago 2026).
      shipping_subsidy: isFirst ? shippingSubsidy : 0,
      service_fee: itemFee,
      total: itemTotal,
      status: "pending",
      shipping_speed,
      courier,
      // Lo lee Mis Ventas para mostrar "Ya lo despaché" en vez de la etiqueta.
      shipping_status: esCoordinado ? ESTADO_COORDINADO_PENDIENTE : null,
      buyer_address: buyer_address ?? null,
      // Se guarda también cuando el retiro es en persona: es el único dato de
      // dónde está el comprador, porque ahí `buyer_address` dice "in_person".
      buyer_commune: buyer_commune?.trim() || null,
      bundle_id: bundleId,
      payment_method: porTransferencia ? "transfer" : "mercadopago",
      discount_code: discount_code?.toUpperCase() ?? null,
      discount_amount: itemDiscount,
      // Estos libros viajan en un paquete que el vendedor ya está armando.
      // Lo lee /mis-ventas y el correo del despacho para decirle que NO haga
      // una etiqueta nueva. Ver lib/envio-pendiente.ts.
      merged_into_bundle_id: cabeEnElPaquete ? envioAbierto!.bundleId : null,
      // De qué oferta salió el precio, si hubo una (lib/offers.ts).
      ...(acordados[l.id] && precioDe(l) < (l.price ?? 0) ? { offer_id: acordados[l.id].offerId } : {}),
    };
  });

  const { data: createdOrders, error: orderError } = await supabase
    .from("orders")
    .insert(orderRows)
    .select("id, listing_id");

  if (orderError || !createdOrders || createdOrders.length === 0) {
    await liberarReserva(createServiceRoleClient(), bundleId);
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

  // Transferencia: no hay pasarela que abrir. La orden ya está creada y queda
  // esperando que el vendedor confirme que la plata llegó, desde Mis Ventas.
  // El sitio NO guarda datos bancarios (regla de Vero, 23-09-2026): con la
  // compra ya en firme, se abre la conversación del libro con un mensaje del
  // comprador pidiendo los datos, y el vendedor recibe UN correo con el enlace.
  if (porTransferencia) {
    const titulos = listings.map((l: any) => l.book?.title).filter(Boolean) as string[];
    const que = titulos.length > 1 ? `${titulos.length} libros (${titulos.map((t) => `«${t}»`).join(", ")})` : `«${titulos[0] ?? "tu libro"}»`;
    const monto = `$${bundleGrandTotal.toLocaleString("es-CL")}`;
    let conversationId: string | null = null;
    try {
      const conv = await buscarOCrearConversacion(supabase, user.id, seller.id, listings[0].id);
      if ("id" in conv) {
        conversationId = conv.id;
        const { error: msgErr } = await supabase.from("messages").insert({
          conversation_id: conv.id,
          sender_id: user.id,
          body: `💸 Compré ${que} por ${monto} y elegí pagar por transferencia. ¿Me pasas tus datos para transferirte?`.slice(0, 2000),
        });
        if (msgErr) console.error("[orders] mensaje de transferencia:", msgErr.message);
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conv.id);
      } else {
        console.error("[orders] conversación de transferencia:", conv.error);
      }
    } catch (e) {
      console.error("[orders] conversación de transferencia:", e);
    }

    if (seller.email) {
      const enlace = conversationId ? `https://tuslibros.cl/mensajes/${conversationId}` : "https://tuslibros.cl/mensajes";
      const comprador = escapeHtml(user.user_metadata?.full_name || "Alguien");
      await sendEmail({
        to: seller.email,
        from: "Vero de tuslibros.cl <hola@tuslibros.cl>",
        replyTo: VERO_INBOX,
        subject: `Te compraron ${titulos.length > 1 ? `${titulos.length} libros` : titulos[0] ?? "un libro"} por transferencia`,
        html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6">
          <p><strong>${comprador} te compró ${escapeHtml(que)} por ${monto}</strong> y eligió pagarte por transferencia.</p>
          <p>Yo no guardo datos bancarios de nadie, así que te toca a ti: <strong>mándale tus datos de transferencia por mensaje.</strong></p>
          <p><a href="${enlace}" style="display:inline-block;background:#1a3da0;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Responderle con tus datos</a></p>
          <p>Cuando te llegue la plata, confírmalo en <a href="https://tuslibros.cl/mis-ventas">Mis Ventas</a> con "Me llegó la transferencia" y ahí despachas.</p>
          <p style="margin-top:28px">Vero<br/><span style="color:#777">tuslibros.cl</span></p>
        </div>`,
      }).catch(() => {});
    }

    sendGong(
      `\u{1F4B8} Pedido por TRANSFERENCIA — $${bundleGrandTotal.toLocaleString("es-CL")}\n` +
        `Vendedor: ${escapeHtml(seller.full_name ?? "—")}\n` +
        `Comprador: ${escapeHtml(user.user_metadata?.full_name || user.email || "Alguien")}\n` +
        `Queda pendiente hasta que confirme el pago en Mis Ventas.`
    ).catch(() => {});

    return NextResponse.json({
      bundle_id: bundleId,
      order_ids: createdOrders.map((o: any) => o.id),
      order_id: firstOrderId,
      payment_method: "transfer",
      conversation_id: conversationId,
      redirect_to: `/orders/${firstOrderId}?pago=transferencia`,
      total: bundleGrandTotal,
    });
  }

  try {
    const items = [
      // El descuento se aplica al PRIMER item, igual que en `orderRows` de más
      // arriba: los dos números salen del mismo request y tienen que cuadrar.
      //
      // Hasta el 2 sept 2026 acá iba `l.price` pelado, sin restar el descuento.
      // Resultado: la orden se guardaba con el precio rebajado y MercadoPago
      // cobraba el precio lleno. En la venta del 1 de septiembre (Álgebra de
      // Baldor, cupón MIDESCUENTO del 20%) la orden decía $12.314 y MP cobró
      // $13.514: el comprador pagó los $1.200 del descuento que creía tener.
      // No lo absorbía la plataforma ni salía del marketplace_fee — el
      // descuento sencillamente no llegaba nunca al cobro.
      ...listings.map((l: any, idx: number) => ({
        id: l.id,
        title: `${l.book.title} — ${l.book.author}`,
        quantity: 1,
        unit_price: Math.round(precioDe(l) - (idx === 0 ? discountAmount : 0)),
        currency_id: "CLP",
      })),
      {
        id: `shipping-${bundleId}`,
        title: esCoordinado
          ? SERVICIO_COORDINADO
          : `Envío ${shipping_speed === "express" ? "rápido" : "estándar"} (${courier})`,
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

    // El precio exhibido tiene que ser idéntico al cobrado. Si la suma de lo que
    // se le manda a MercadoPago no cuadra con el total de la orden, se corta acá
    // antes de generar la preferencia: es preferible que la compra falle a que
    // alguien pague un monto distinto al que vio en pantalla.
    const sumaItems = items.reduce((a, it) => a + it.unit_price * it.quantity, 0);
    if (sumaItems !== bundleGrandTotal) {
      console.error(
        `[orders] Descuadre precio exhibido vs cobrado en bundle ${bundleId}: ` +
          `items=${sumaItems} orden=${bundleGrandTotal} (descuento ${discountAmount}, código ${discount_code ?? "—"})`
      );
      await supabase.from("orders").delete().eq("bundle_id", bundleId);
      await liberarReserva(createServiceRoleClient(), bundleId);
      return NextResponse.json(
        { error: "No pudimos generar el cobro con el precio correcto. Escríbenos y lo resolvemos." },
        { status: 500 }
      );
    }

    const backUrls = {
      success: `${siteUrl}/orders/${firstOrderId}?status=success`,
      failure: `${siteUrl}/orders/${firstOrderId}?status=failure`,
      pending: `${siteUrl}/orders/${firstOrderId}?status=pending`,
    };

    // El link de pago vence junto con la reserva: si no, alguien podía pagar un
    // link viejo cuando el libro ya estaba reservado o vendido a otra persona.
    const vencimiento = {
      expires: true,
      expiration_date_to: new Date(Date.now() + RESERVA_MP_MINUTOS * 60_000).toISOString(),
    };

    let preference;

    if (useSplit) {
      const collectorId = process.env.MERCADOPAGO_COLLECTOR_ID;
      if (!collectorId) {
        await supabase.from("orders").delete().eq("bundle_id", bundleId);
        await liberarReserva(createServiceRoleClient(), bundleId);
        return NextResponse.json(
          { error: "Configuración de marketplace incompleta" },
          { status: 500 }
        );
      }

      // Los tokens del vendedor SOLO se leen con service role: son credenciales y
      // anon/authenticated ya no tienen SELECT sobre esas columnas.
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
        await supabase.from("orders").delete().eq("bundle_id", bundleId);
        await liberarReserva(createServiceRoleClient(), bundleId);
        return NextResponse.json(
          { error: "El vendedor no tiene MercadoPago conectado" },
          { status: 409 }
        );
      }
      let sellerToken = sellerCreds.access_token;
      const splitBody = {
        items,
        // En despacho coordinado el flete NO se retiene: le llega al vendedor,
        // que es quien paga el courier (lib/shipping/coordinado.ts).
        marketplace_fee: commission + (esCoordinado ? 0 : shippingCost),
        marketplace: collectorId,
        back_urls: backUrls,
        auto_return: "approved" as const,
        external_reference: bundleId,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        ...vencimiento,
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
          external_reference: bundleId,
          notification_url: `${siteUrl}/api/webhooks/mercadopago`,
          ...vencimiento,
        },
      });
    }

    // Guardar preference_id en todas las orders del bundle.
    //
    // Va con service role a propósito: `orders` no tiene policy de UPDATE para
    // authenticated (ver 20260402_create_orders.sql, "webhook uses service_role
    // key"), así que con el cliente del usuario RLS descartaba la escritura,
    // PostgREST respondía 0 filas y ningún error, y nadie se enteraba. Las 24
    // órdenes de la BD tenían mercadopago_preference_id en null, incluidas las
    // pagadas. Sin ese dato no se puede distinguir "no llegó a MercadoPago" de
    // "abandonó en la pantalla de pago", que es justo lo que hay que saber para
    // diagnosticar la fuga del checkout. (27 ago 2026)
    const adminSbPref = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { error: prefErr } = await adminSbPref
      .from("orders")
      .update({ mercadopago_preference_id: preference.id })
      .eq("bundle_id", bundleId);
    if (prefErr) {
      // No se aborta la compra por esto: el comprador ya puede pagar. Pero
      // queda en los logs, porque sin el id la orden es huérfana para conciliar.
      console.error(`[orders] no se guardó preference_id del bundle ${bundleId}: ${prefErr.message}`);
    }

    // La comisión NO se registra acá.
    //
    // Hasta el 25 ago 2026 se insertaba en este punto, al generar la preferencia
    // de pago — o sea antes de que el comprador pagara. Quedaban registradas
    // comisiones de órdenes pendientes que nunca se concretaron y de reintentos
    // cancelados: agosto figuraba con $4.800 cuando lo real eran $800, y los
    // vendedores veían en /mis-ventas plata que nunca se les cobró.
    //
    // Ahora se registra en el webhook de MercadoPago, cuando el pago queda
    // aprobado: `registrarComisionVenta()` en lib/commissions.ts.

    // Limpiar carrito: quitar los listings recién comprados
    await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .in("listing_id", listingIds);

    // GONG: alguien abrió el checkout. NO es una venta, y el aviso tiene que
    // decirlo: con el formato anterior ("🛍️ Nuevo intento de compra", mismos
    // cuatro campos que el de venta pagada) se leía como si hubiera plata.
    // Vero lo confundió el 18-09 con una venta de Buhardilla que nunca se pagó.
    sendGong(
      `⏳ <b>Alguien está en el checkout</b> — todavía sin pagar\n\n` +
      `Items: ${listings.length}\n` +
      `Sería: $${bundleGrandTotal.toLocaleString("es-CL")}\n` +
      `Vendedor: ${escapeHtml(seller.full_name)}\n` +
      `Comprador: ${escapeHtml(user.user_metadata?.full_name || user.email || "Alguien")}\n\n` +
      `Si paga, llega otro aviso que dice "Venta pagada". Si no llega, no hubo venta.`
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
    await liberarReserva(createServiceRoleClient(), bundleId);
    const message = err instanceof Error ? err.message : "Error de MercadoPago";
    console.error(
      "MercadoPago error:",
      JSON.stringify(err, Object.getOwnPropertyNames(err))
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
