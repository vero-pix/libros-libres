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
  SHIPIT_DEFAULT_ORIGIN_RM,
  SHIPIT_REGION_RM,
} from "@/lib/shipit";
import { extractCommune } from "@/lib/chilexpress";
import { resolverOrigenEnvio } from "@/lib/shipping-quote";
import { sendEmail } from "@/lib/email";
import { VERO_INBOX } from "@/lib/veroInbox";
import { correoCompradorTracking, correoVendedorEtiqueta, REMITENTE_VERO, REPLY_TO_VERO } from "@/lib/shipit-emails";
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
 *   sandbox → igual que live pero con `sandbox: true` y referencia TEST-.
 *             Shipit lo activó por cuenta el 07-09-2026.
 *   live    → crea de verdad. sandbox y live exigen
 *             users.shipit_auto_enabled = true; el resto se registra como
 *             dry-run con note='shipit_auto_enabled=false'.
 *
 * Origen (D1 revisada): vendedor con shipit_origin_id → ese. Sin origen y en
 * la Región Metropolitana → origen compartido 100321 en dropoff. Sin origen
 * y fuera de la RM → needs_origin + gong.
 *
 * Pasos implementados en este archivo (PROMPT 1.2 d, e y f):
 *   pending → created       crear el envío
 *   created → label_ready   tracking + pack_pdf descargado al bucket privado `labels`
 *   label_ready → notified  correo al vendedor (etiqueta lista) y al comprador (tracking)
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
          resumen.push(await pasoEtiqueta(admin, fila, modo));
          break;
        case "label_ready":
          resumen.push(await pasoNotificar(admin, fila, modo));
          break;
        default:
          // notified: fase 1.5 (retiro). Se suelta para dentro de 6 horas.
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
      if (agotado && modo !== "dry-run") {
        await sendGong(`🔴 Envío ${escapeHtml(fila.reference)} falló ${intentos} veces: ${escapeHtml(msg)}`);
      }
      resumen.push({ reference: fila.reference, estado: fila.status, accion: agotado ? "failed" : "error", nota: msg });
    }
  }

  // Barrido de atascados: solo en live. En dry-run las filas se quedan en
  // pending a propósito, y eso no es un atasco.
  let stalled = 0;
  if (modo !== "dry-run") {
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
  const [qHead, qVendedor, qComprador, qItems] = await Promise.all([
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
  // Un select que falla (por ejemplo, PostgREST sin recargar el esquema tras
  // la migración) NO puede pasar por "vendedor sin origen": se corta acá.
  for (const [que, q] of [["orden cabeza", qHead], ["vendedor", qVendedor], ["comprador", qComprador]] as const) {
    if (q.error) throw new Error(`select ${que}: ${q.error.message}`);
  }
  const head = qHead.data;
  const vendedor = qVendedor.data;
  const comprador = qComprador.data;
  const items = qItems.count;

  if (!head?.buyer_address) throw new Error("la orden cabeza no tiene buyer_address");
  const listingAddress = (Array.isArray(head.listing) ? head.listing[0] : head.listing)?.address ?? null;

  const origen = resolverOrigenEnvio({
    listingAddress,
    sellerDefaultAddress: vendedor?.default_address,
  });
  if (!origen) throw new Error("sin dirección de origen (listing ni vendedor)");

  // D1 revisada: sin origen propio, un vendedor de la RM sale con el origen
  // compartido de tuslibros (dropoff). Fuera de la RM, needs_origin.
  const comunaOrigen = await findCommune(origen.commune);
  const enRM = comunaOrigen?.region_id === SHIPIT_REGION_RM;
  let originId: number | null = vendedor?.shipit_origin_id ?? null;
  let notaOrigen = "";
  if (!originId && enRM && fila.dispatch_mode === "dropoff") {
    originId = SHIPIT_DEFAULT_ORIGIN_RM;
    notaOrigen = ` · origen compartido ${SHIPIT_DEFAULT_ORIGIN_RM} (RM sin origen propio)`;
  }

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
    originId,
    sandbox: modo === "sandbox",
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
    origen: `${origen.commune} (${originId ?? "sin origin_id"})${notaOrigen}`,
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
      note: motivoDry + (originId ? "" : " · sin shipit_origin_id") + notaOrigen,
    });
    await reprogramarEnvio(admin, fila.id, 60);
    return { ...base, accion: "dry-run", nota: motivoDry };
  }

  // ── sandbox / live ────────────────────────────────────────────────────────
  if (!originId) {
    if (await transicionEnvio(admin, fila.id, "pending", "needs_origin")) {
      await sendGong(
        `🟠 ${escapeHtml(base.vendedor ?? "")} vendió con courier (${escapeHtml(fila.reference)}) desde ${escapeHtml(origen.commune)}, fuera de la RM, y no tiene origen en Shipit.\n` +
          `Crear el origen en el panel con estos datos y guardar users.shipit_origin_id:\n` +
          `${escapeHtml(vendedor?.full_name ?? "")} · ${escapeHtml(origen.address)} · ${escapeHtml(vendedor?.phone ?? "sin teléfono")} · ${escapeHtml(vendedor?.email ?? "sin correo")}`
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
    mode: modo,
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

/* ───────────────────────── created → label_ready ───────────────────────── */

/** Bucket privado; path = `shipments/{shipment.id}.pdf`. Sin policies: solo service role. */
const LABELS_BUCKET = "labels";

async function pasoEtiqueta(admin: Admin, fila: ShipmentRow, modo: ShipitMode): Promise<ResumenFila> {
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
    return { reference: fila.reference, estado: "created", accion: "esperando tracking/pack_pdf" };
  }

  // La URL de pack_pdf es un objeto público de S3 con nombre, dirección y
  // teléfono del comprador (verificado el 07-09-2026: 200 sin auth). Por eso
  // se baja acá, se guarda en el bucket privado y la URL de Shipit no se
  // persiste ni se manda a nadie (D3).
  const path = `shipments/${fila.id}.pdf`;
  const pdf = await descargarPdf(s.pack_pdf);
  const { error: upErr } = await admin.storage
    .from(LABELS_BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(`Storage upload: ${upErr.message}`);
  await registrarEventoShipit(admin, {
    shipmentId: fila.id,
    kind: "label",
    mode: modo,
    note: `${path} · ${pdf.byteLength} bytes`,
    httpStatus: 200,
  });

  const ok = await transicionEnvio(admin, fila.id, "created", "label_ready", {
    tracking_number: s.tracking_number,
    label_path: path,
    real_cost: s.total_price,
    courier: s.courier ?? fila.courier,
  });
  if (!ok) return { reference: fila.reference, estado: "created", accion: "ya en label_ready (otro proceso)" };

  // Espejo para /mis-ventas y /mis-pedidos. shipping_label_url queda null a
  // propósito: la etiqueta se sirve por /api/shipments/{id}/label con URL firmada.
  await admin
    .from("orders")
    .update({
      tracking_code: s.tracking_number,
      shipping_status: "label_ready",
      shipping_label_url: null,
      shipping_updated_at: new Date().toISOString(),
    })
    .eq("bundle_id", fila.bundle_id);

  return {
    reference: fila.reference,
    estado: "label_ready",
    accion: "etiqueta guardada",
    nota: `${s.tracking_number} · ${path}`,
  };
}

async function descargarPdf(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`pack_pdf HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 1024 || buf.subarray(0, 4).toString("latin1") !== "%PDF") {
      throw new Error(`pack_pdf no es un PDF válido (${buf.byteLength} bytes)`);
    }
    if (buf.byteLength > 2 * 1024 * 1024) throw new Error("pack_pdf supera 2 MB");
    return buf;
  } finally {
    clearTimeout(t);
  }
}

/* ───────────────────────── label_ready → notified ───────────────────────── */

/**
 * Un correo por destinatario, nunca dos. La guarda es la fila de
 * `shipit_events` (kind='email', note='vendedor' | 'comprador'): si ya existe,
 * no se vuelve a mandar aunque la corrida anterior haya muerto a medias. La
 * transición a notified se hace al final, cuando los dos salieron.
 */
async function pasoNotificar(admin: Admin, fila: ShipmentRow, modo: ShipitMode): Promise<ResumenFila> {
  if (modo === "dry-run") {
    // En dry-run no se escribe a nadie. La fila espera a que el modo cambie.
    await reprogramarEnvio(admin, fila.id, 6 * 60);
    return { reference: fila.reference, estado: "label_ready", accion: "dry-run: correos no enviados" };
  }
  if (!fila.tracking_number) throw new Error("label_ready sin tracking_number");

  const [qHead, qBundle, qVendedor, qComprador, qEnviados] = await Promise.all([
    admin.from("orders").select("buyer_address, listing:listings(address)").eq("id", fila.order_head_id).single(),
    admin
      .from("orders")
      .select("listing:listings(book:books(title))")
      .eq("bundle_id", fila.bundle_id)
      .order("created_at"),
    admin.from("users").select("full_name, email, default_address").eq("id", fila.seller_id).single(),
    admin.from("users").select("full_name, email").eq("id", fila.buyer_id).single(),
    admin.from("shipit_events").select("note").eq("shipment_id", fila.id).eq("kind", "email"),
  ]);
  for (const [que, q] of [["orden cabeza", qHead], ["bundle", qBundle], ["vendedor", qVendedor], ["comprador", qComprador]] as const) {
    if (q.error) throw new Error(`select ${que}: ${q.error.message}`);
  }
  const head = qHead.data!;
  const vendedor = qVendedor.data!;
  const comprador = qComprador.data!;
  const yaEnviados = new Set((qEnviados.data ?? []).map((e) => e.note));

  const titulos = (qBundle.data ?? [])
    .map((o: any) => (Array.isArray(o.listing) ? o.listing[0] : o.listing)?.book)
    .map((b: any) => (Array.isArray(b) ? b[0] : b)?.title)
    .filter((t: unknown): t is string => typeof t === "string" && t.length > 0);
  const listingAddress = (Array.isArray(head.listing) ? head.listing[0] : head.listing)?.address ?? null;
  const origen = resolverOrigenEnvio({ listingAddress, sellerDefaultAddress: vendedor.default_address });
  const comunaDestino = (await findCommune(extractCommune(head.buyer_address ?? "")))?.name ?? extractCommune(head.buyer_address ?? "");
  const comunaOrigenShipit = origen ? await findCommune(origen.commune) : null;

  const datos = {
    vendedorNombre: vendedor.full_name,
    compradorNombre: comprador.full_name,
    titulos,
    courier: fila.courier,
    tracking: fila.tracking_number,
    comunaDestino: capitalizar(comunaDestino),
    comunaOrigen: origen?.commune ?? "",
    direccionEntrega: head.buyer_address ?? "",
    enRM: comunaOrigenShipit?.region_id === SHIPIT_REGION_RM,
  };

  // Mientras Google Workspace esté caído, vero@tuslibros.cl no recibe: el
  // correo de vendedor de Vero va a su buzón real (VERO_INBOX). Sacar cuando
  // vuelva Workspace (ver lib/veroInbox.ts).
  const correoVendedor = vendedor.email === "vero@tuslibros.cl" ? VERO_INBOX : vendedor.email;
  const enviados: string[] = [];

  if (!yaEnviados.has("vendedor")) {
    if (!correoVendedor) throw new Error("vendedor sin correo");
    const m = correoVendedorEtiqueta(datos);
    const r = await sendEmail({ to: correoVendedor, from: REMITENTE_VERO, replyTo: REPLY_TO_VERO, subject: m.subject, html: m.html });
    if (!r?.id) throw new Error("Resend no aceptó el correo del vendedor");
    await registrarEventoShipit(admin, { shipmentId: fila.id, kind: "email", mode: modo, note: "vendedor", response: { resend_id: r.id, to: correoVendedor, subject: m.subject }, httpStatus: 200 });
    enviados.push(`vendedor ${r.id}`);
  }
  if (!yaEnviados.has("comprador")) {
    if (!comprador.email) throw new Error("comprador sin correo");
    const m = correoCompradorTracking(datos);
    const r = await sendEmail({ to: comprador.email, from: REMITENTE_VERO, replyTo: REPLY_TO_VERO, subject: m.subject, html: m.html });
    if (!r?.id) throw new Error("Resend no aceptó el correo del comprador");
    await registrarEventoShipit(admin, { shipmentId: fila.id, kind: "email", mode: modo, note: "comprador", response: { resend_id: r.id, to: comprador.email, subject: m.subject }, httpStatus: 200 });
    enviados.push(`comprador ${r.id}`);
  }

  const ok = await transicionEnvio(admin, fila.id, "label_ready", "notified");
  await admin
    .from("orders")
    .update({ shipping_status: "notified", shipping_updated_at: new Date().toISOString() })
    .eq("bundle_id", fila.bundle_id);
  return {
    reference: fila.reference,
    estado: ok ? "notified" : "label_ready",
    accion: enviados.length ? `correos enviados: ${enviados.join(", ")}` : "correos ya enviados antes",
  };
}

function capitalizar(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
