import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendGong, escapeHtml } from "@/lib/notifications";
import {
  armarBodyShipit,
  createShipitShipment,
  estimateBookPackageSize,
  findCommune,
  getShipitShipment,
  DROPOFF_COURIERS,
} from "@/lib/shipit";
import { extractCommune } from "@/lib/chilexpress";
import { resolverOrigenEnvio } from "@/lib/shipping-quote";
import {
  BACKOFF_MIN,
  MAX_ATTEMPTS,
  getShipitMode,
  registrarEventoShipit,
  reprogramarEnvio,
  transicionEnvio,
  type ShipitMode,
  type ShipmentRow,
} from "@/lib/shipments";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/shipments — worker de envíos Shipit (fase 1).
 *
 * Cada 5 minutos (vercel.json). Toma hasta 10 filas de `shipments` con
 * `claim_shipments` (FOR UPDATE SKIP LOCKED: dos corridas simultáneas nunca
 * toman la misma fila) y avanza cada una un paso según su estado.
 *
 * Modos (`SHIPIT_MODE`, ausente = dry-run; `?dry=1` fuerza dry-run):
 *   dry-run → arma el body exacto de POST /v/shipments y lo registra en
 *             shipit_events (kind='dry-run'). No llama a Shipit, no manda
 *             correos ni gong, no cambia de estado.
 *   live    → crea de verdad, pero SOLO para vendedores con
 *             users.shipit_auto_enabled = true; el resto se registra como
 *             dry-run con note='shipit_auto_enabled=false'.
 *
 * Pasos implementados en este archivo (PROMPT 1.2 d):
 *   pending → created            crear el envío
 *   created → (sigue en created) consultar tracking/costo y espejarlos en orders
 * Los pasos e) etiqueta a Storage y f) correos van aparte y NO están acá.
 *
 * Diseño completo: docs/shipit/PROMPT_1.1_diseno_2026-09-07.md
 */

type Admin = ReturnType<typeof createServiceRoleClient>;

interface ResumenFila {
  reference: string;
  estado: string;
  accion: string;
  vendedor?: string;
  origen?: string;
  courier?: string | null;
  destino?: string;
  costo_cotizado?: number | null;
  nota?: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const modo: ShipitMode = url.searchParams.get("dry") === "1" ? "dry-run" : getShipitMode();
  const max = Math.min(20, Number(url.searchParams.get("max")) || 10);

  const admin = createServiceRoleClient();
  const { data: filas, error } = await admin.rpc("claim_shipments", { max_rows: max });
  if (error) {
    return NextResponse.json({ error: `claim_shipments: ${error.message}` }, { status: 500 });
  }

  const resumen: ResumenFila[] = [];
  for (const fila of (filas ?? []) as ShipmentRow[]) {
    try {
      switch (fila.status) {
        case "pending":
          resumen.push(await pasoCrear(admin, fila, modo));
          break;
        case "created":
          resumen.push(await pasoConsultar(admin, fila, modo));
          break;
        default:
          // label_ready / notified: pasos e) y f), todavía no implementados.
          // Se sueltan para dentro de 6 horas para no recorrerlos cada 5 min.
          await reprogramarEnvio(admin, fila.id, 6 * 60);
          resumen.push({ reference: fila.reference, estado: fila.status, accion: "sin paso implementado" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const intentos = fila.attempts + 1;
      await registrarEventoShipit(admin, { shipmentId: fila.id, kind: "error", mode: modo, note: msg });
      const agotado = intentos >= MAX_ATTEMPTS;
      await reprogramarEnvio(admin, fila.id, BACKOFF_MIN[Math.min(intentos, BACKOFF_MIN.length) - 1], {
        attempts: intentos,
        last_error: msg,
        ...(agotado ? { status: "failed" as const } : {}),
      });
      if (agotado && modo === "live") {
        await sendGong(`🔴 Envío ${escapeHtml(fila.reference)} falló ${intentos} veces: ${escapeHtml(msg)}`);
      }
      resumen.push({ reference: fila.reference, estado: fila.status, accion: agotado ? "failed" : "error", nota: msg });
    }
  }

  // Barrido de atascados: solo en live. En dry-run las filas se quedan en
  // pending a propósito, y eso no es un atasco.
  let stalled = 0;
  if (modo === "live") {
    const { data } = await admin
      .from("shipments")
      .update({ status: "stalled" })
      .in("status", ["pending", "created", "label_ready", "notified"])
      .lt("updated_at", new Date(Date.now() - 24 * 3600_000).toISOString())
      .select("reference");
    stalled = data?.length ?? 0;
    for (const s of data ?? []) {
      await sendGong(`🟠 Envío ${escapeHtml(s.reference)} lleva más de 24 h sin avanzar`);
    }
  }

  return NextResponse.json({ modo, procesados: resumen.length, stalled, resumen });
}

/* ───────────────────────── pending → created ───────────────────────── */

async function pasoCrear(admin: Admin, fila: ShipmentRow, modo: ShipitMode): Promise<ResumenFila> {
  const [{ data: head }, { data: vendedor }, { data: comprador }, { count: items }] = await Promise.all([
    admin
      .from("orders")
      .select("id, listing_id, buyer_address, courier, listing:listings(address)")
      .eq("id", fila.order_head_id)
      .single(),
    admin
      .from("users")
      .select("username, full_name, email, phone, default_address, shipit_origin_id, shipit_auto_enabled")
      .eq("id", fila.seller_id)
      .single(),
    admin.from("users").select("full_name, email, phone").eq("id", fila.buyer_id).single(),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("bundle_id", fila.bundle_id),
  ]);

  if (!head?.buyer_address) throw new Error("la orden cabeza no tiene buyer_address");
  const listingAddress = (Array.isArray(head.listing) ? head.listing[0] : head.listing)?.address ?? null;

  const origen = resolverOrigenEnvio({
    listingAddress,
    sellerDefaultAddress: vendedor?.default_address,
  });
  if (!origen) throw new Error("sin dirección de origen (listing ni vendedor)");

  const destCrudo = extractCommune(head.buyer_address);
  const comunaDestino = await findCommune(destCrudo);
  if (!comunaDestino) throw new Error(`Shipit no reconoce la comuna de destino: ${destCrudo}`);
  const destCommune = comunaDestino.name;
  const destCommuneId = comunaDestino.id;

  const calle = head.buyer_address.split(",")[0]?.trim() ?? "";
  const m = calle.match(/^(.+?)\s+(\d+[a-zA-Z]?)\s*(.*)$/);
  const courier = String(head.courier ?? "").toLowerCase();
  const n = Math.max(1, items ?? 1);

  const body = armarBodyShipit({
    reference: fila.reference,
    originId: vendedor?.shipit_origin_id ?? null,
    items: n,
    sizes: estimateBookPackageSize(n),
    courier,
    destiny: {
      street: m?.[1] ?? calle,
      number: m?.[2] ?? "0",
      complement: m?.[3] ?? "",
      commune_id: destCommuneId,
      commune_name: destCommune,
      full_name: comprador?.full_name ?? "Comprador",
      email: comprador?.email ?? "",
      phone: comprador?.phone ?? "",
    },
    sellerRef: vendedor?.username ?? fila.seller_id,
  });

  const base: ResumenFila = {
    reference: fila.reference,
    estado: "pending",
    accion: "",
    vendedor: vendedor?.username ?? vendedor?.full_name ?? fila.seller_id,
    origen: `${origen.commune} (${vendedor?.shipit_origin_id ?? "sin origin_id"})`,
    courier,
    destino: destCommune,
    costo_cotizado: fila.quoted_cost,
  };

  // Modalidad dropoff: el courier tiene que aceptar el paquete en sucursal.
  if (fila.dispatch_mode === "dropoff" && !(DROPOFF_COURIERS as readonly string[]).includes(courier)) {
    throw new Error(`courier "${courier}" no acepta entrega en sucursal (modo dropoff)`);
  }

  // ── dry-run (global o por vendedor) ─────────────────────────────────────
  const motivoDry =
    modo === "dry-run" ? "SHIPIT_MODE=dry-run" : !vendedor?.shipit_auto_enabled ? "shipit_auto_enabled=false" : null;
  if (motivoDry) {
    await registrarEventoShipit(admin, {
      shipmentId: fila.id,
      kind: "dry-run",
      mode: "dry-run",
      request: body,
      note: motivoDry + (vendedor?.shipit_origin_id ? "" : " · sin shipit_origin_id"),
    });
    await reprogramarEnvio(admin, fila.id, 60);
    return { ...base, accion: "dry-run", nota: motivoDry };
  }

  // ── live ─────────────────────────────────────────────────────────────────
  if (!vendedor?.shipit_origin_id) {
    if (await transicionEnvio(admin, fila.id, "pending", "needs_origin")) {
      await sendGong(
        `🟠 ${escapeHtml(base.vendedor ?? "")} vendió con courier (${escapeHtml(fila.reference)}) y no tiene origen en Shipit. Crear el origen y guardar users.shipit_origin_id.`
      );
    }
    return { ...base, accion: "needs_origin" };
  }

  // Segunda capa de idempotencia: si un intento anterior ya creó el envío y la
  // transición falló después, el id está en shipit_events. No se crea de nuevo.
  if (fila.attempts > 0) {
    const { data: previo } = await admin
      .from("shipit_events")
      .select("response")
      .eq("shipment_id", fila.id)
      .eq("kind", "create")
      .not("response->id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const idPrevio = (previo?.response as any)?.id;
    if (typeof idPrevio === "number") {
      await transicionEnvio(admin, fila.id, "pending", "created", { shipit_id: idPrevio, courier });
      return { ...base, accion: "recuperado", nota: `shipit_id ${idPrevio} de un intento anterior` };
    }
  }

  // Transición ANTES de llamar: si otro proceso ya la hizo, este no crea.
  if (!(await transicionEnvio(admin, fila.id, "pending", "created"))) {
    return { ...base, accion: "ya en created (otro proceso)" };
  }

  const res = await createShipitShipment(body);
  await registrarEventoShipit(admin, {
    shipmentId: fila.id,
    kind: "create",
    mode: "live",
    request: body,
    response: res.raw,
    httpStatus: res.httpStatus,
    cost: res.total_price,
  });

  if (res.error || !res.id) {
    // La transición fue optimista: volver a pending con backoff.
    const intentos = fila.attempts + 1;
    await admin
      .from("shipments")
      .update({
        status: "pending",
        attempts: intentos,
        last_error: res.error ?? "sin id",
        locked_until: null,
        next_attempt_at: new Date(Date.now() + BACKOFF_MIN[Math.min(intentos, BACKOFF_MIN.length) - 1] * 60_000).toISOString(),
      })
      .eq("id", fila.id);
    throw new Error(`POST /v/shipments: ${res.error ?? "sin id"}`);
  }

  await admin
    .from("shipments")
    .update({ shipit_id: res.id, courier: res.courier ?? courier, real_cost: res.total_price })
    .eq("id", fila.id);
  await admin
    .from("orders")
    .update({ shipit_order_id: res.id, shipping_status: "created", shipping_updated_at: new Date().toISOString() })
    .eq("bundle_id", fila.bundle_id);

  return { ...base, estado: "created", accion: "creado", nota: `shipit_id ${res.id}` };
}

/* ───────────────────────── created → (tracking) ───────────────────────── */

async function pasoConsultar(admin: Admin, fila: ShipmentRow, modo: ShipitMode): Promise<ResumenFila> {
  if (!fila.shipit_id) throw new Error("fila en created sin shipit_id");
  const s = await getShipitShipment(fila.shipit_id);
  await registrarEventoShipit(admin, {
    shipmentId: fila.id,
    kind: "get",
    mode: modo,
    response: s.raw,
    httpStatus: s.httpStatus,
    cost: s.total_price,
  });
  if (s.error) throw new Error(`GET /v/shipments/${fila.shipit_id}: ${s.error}`);

  if (!s.tracking_number || !s.pack_pdf) {
    // Shipit tarda ~20 s en completar. Reintento suave, sin contar como fallo.
    await reprogramarEnvio(admin, fila.id, 5);
    return { reference: fila.reference, estado: "created", accion: "esperando tracking" };
  }

  await admin
    .from("shipments")
    .update({ tracking_number: s.tracking_number, courier: s.courier ?? fila.courier, real_cost: s.total_price })
    .eq("id", fila.id);
  await admin
    .from("orders")
    .update({ tracking_code: s.tracking_number, shipping_updated_at: new Date().toISOString() })
    .eq("bundle_id", fila.bundle_id);

  // El paso e) (descargar pack_pdf a Storage y pasar a label_ready) no está
  // implementado todavía. Hasta entonces la fila se queda en created y se
  // vuelve a mirar cada 6 horas.
  await reprogramarEnvio(admin, fila.id, 6 * 60);
  return {
    reference: fila.reference,
    estado: "created",
    accion: "tracking guardado; etiqueta pendiente (paso e)",
    nota: s.tracking_number,
  };
}
