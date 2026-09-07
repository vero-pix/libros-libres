import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cola de envíos Shipit (tabla `shipments`) y su auditoría (`shipit_events`).
 * Migración: supabase/migrations/20260908_shipments.sql. Diseño:
 * docs/shipit/PROMPT_1.1_diseno_2026-09-07.md.
 *
 * Quién escribe acá: el webhook de MercadoPago (encola) y el worker
 * app/api/cron/shipments (avanza). Siempre con service role.
 */

export type ShipitMode = "dry-run" | "sandbox" | "live";

/**
 * `SHIPIT_MODE` ausente o con cualquier otro valor ⇒ dry-run.
 * `sandbox`: Shipit lo activó por cuenta el 07-09-2026 (desde la suite). Los
 * envíos van con `sandbox: true` y referencia `TEST-…`; los del panel siguen
 * con `is_sandbox: false` (verificado sobre 6 envíos reales el mismo día).
 */
export function getShipitMode(): ShipitMode {
  const m = process.env.SHIPIT_MODE;
  return m === "live" || m === "sandbox" ? m : "dry-run";
}

/** Prefijo obligatorio de la referencia en sandbox: nunca `TL-` (15 chars máx). */
export function referenciaSandbox(reference: string): string {
  return "TEST-" + reference.replace(/^TL-/, "").slice(0, 10);
}

export const SHIPMENT_STATUSES = [
  "pending",
  "created",
  "label_ready",
  "notified",
  "pickup_scheduled",
  "in_transit",
  "delivered",
  "needs_origin",
  "stalled",
  "failed",
  "canceled",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export type DispatchMode = "dropoff" | "pickup";

export interface ShipmentRow {
  id: string;
  bundle_id: string;
  order_head_id: string;
  seller_id: string;
  buyer_id: string;
  status: ShipmentStatus;
  dispatch_mode: DispatchMode;
  pickup_requested_at: string | null;
  shipit_id: number | null;
  reference: string;
  courier: string | null;
  tracking_number: string | null;
  label_path: string | null;
  pickup_date: string | null;
  pickup_window: string | null;
  quoted_cost: number | null;
  real_cost: number | null;
  attempts: number;
  last_error: string | null;
  locked_until: string | null;
  next_attempt_at: string;
  created_at: string;
  updated_at: string;
}

export type ShipitEventKind =
  | "create"
  | "get"
  | "delete"
  | "label"
  | "email"
  | "gong"
  | "webhook"
  | "dry-run"
  | "transition"
  | "error";

/** Minutos de espera según el número de intentos fallidos. */
export const BACKOFF_MIN = [1, 5, 15, 60, 240] as const;
export const MAX_ATTEMPTS = 5;

/** `TL-` + 12 chars del bundle_id sin guiones = 15 caracteres, el tope de Shipit. */
export function referenciaShipit(bundleId: string): string {
  return "TL-" + bundleId.replace(/-/g, "").slice(0, 12);
}

type Admin = SupabaseClient<any, any, any>;

/**
 * Encola el envío de un bundle pagado con courier. Idempotente: si ya existe
 * una fila para ese `bundle_id` no hace nada (ON CONFLICT DO NOTHING vía
 * `ignoreDuplicates`). Nunca lanza: un fallo acá no puede tumbar el webhook
 * que acaba de marcar la venta como pagada.
 */
export async function encolarEnvio(
  admin: Admin,
  input: {
    bundleId: string;
    orderHeadId: string;
    sellerId: string;
    buyerId: string;
    /** Lo que cotizó el checkout: `shipping_cost` + `shipping_subsidy` de la cabeza. */
    quotedCost: number;
  }
): Promise<{ id: string | null; inserted: boolean; error?: string }> {
  try {
    const { data: vendedor } = await admin
      .from("users")
      .select("shipit_dispatch_mode")
      .eq("id", input.sellerId)
      .maybeSingle();
    const dispatchMode: DispatchMode =
      vendedor?.shipit_dispatch_mode === "pickup" ? "pickup" : "dropoff";

    const { data, error } = await admin
      .from("shipments")
      .upsert(
        {
          bundle_id: input.bundleId,
          order_head_id: input.orderHeadId,
          seller_id: input.sellerId,
          buyer_id: input.buyerId,
          reference: referenciaShipit(input.bundleId),
          quoted_cost: input.quotedCost,
          dispatch_mode: dispatchMode,
        },
        { onConflict: "bundle_id", ignoreDuplicates: true }
      )
      .select("id");

    if (error) {
      console.error("[shipments] no se pudo encolar", input.bundleId, error.message);
      return { id: null, inserted: false, error: error.message };
    }
    const row = data?.[0];
    return { id: row?.id ?? null, inserted: !!row };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[shipments] encolar falló", input.bundleId, msg);
    return { id: null, inserted: false, error: msg };
  }
}

/**
 * Deja rastro en `shipit_events`. Nunca lanza: un fallo de auditoría no puede
 * frenar un envío (mismo criterio que `logWebhook` del webhook de MP).
 */
export async function registrarEventoShipit(
  admin: Admin,
  ev: {
    shipmentId: string;
    kind: ShipitEventKind;
    mode: ShipitMode;
    request?: unknown;
    response?: unknown;
    httpStatus?: number | null;
    cost?: number | null;
    note?: string | null;
  }
): Promise<void> {
  try {
    const { error } = await admin.from("shipit_events").insert({
      shipment_id: ev.shipmentId,
      kind: ev.kind,
      mode: ev.mode,
      request: ev.request ?? null,
      response: ev.response ?? null,
      http_status: ev.httpStatus ?? null,
      cost: ev.cost ?? null,
      note: ev.note ?? null,
    });
    if (error) console.error("[shipments] no se pudo registrar el evento:", error.message);
  } catch (e) {
    console.error("[shipments] registro falló:", e);
  }
}

/**
 * Transición condicional (RPC `transition_shipment`): avanza solo si la fila
 * sigue en `from`. `true` si cambió. Es la guarda antes de cada llamada externa.
 */
export async function transicionEnvio(
  admin: Admin,
  id: string,
  from: ShipmentStatus,
  to: ShipmentStatus,
  patch: Record<string, unknown> = {}
): Promise<boolean> {
  const { data, error } = await admin.rpc("transition_shipment", {
    p_id: id,
    p_from: from,
    p_to: to,
    p_patch: patch,
  });
  if (error) throw new Error(`transition_shipment ${from}→${to}: ${error.message}`);
  return data === true;
}

/** Programa el próximo intento sin cambiar de estado (y suelta el lock). */
export async function reprogramarEnvio(
  admin: Admin,
  id: string,
  minutos: number,
  extra: Partial<Pick<ShipmentRow, "attempts" | "last_error" | "status">> = {}
): Promise<void> {
  const { error } = await admin
    .from("shipments")
    .update({
      ...extra,
      locked_until: null,
      next_attempt_at: new Date(Date.now() + minutos * 60_000).toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`reprogramar: ${error.message}`);
}
