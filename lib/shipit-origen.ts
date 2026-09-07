import type { SupabaseClient } from "@supabase/supabase-js";
import { sendGong, escapeHtml } from "./notifications";
import { extractCommune } from "./chilexpress";
import { findCommune, SHIPIT_REGION_RM } from "./shipit";

/**
 * D1 revisada (07-09-2026): quién puede vender con courier y qué pasa si no.
 *
 * - Vendedor de la Región Metropolitana: siempre puede. Sin origen propio sale
 *   con el origen compartido 100321 en modo dropoff.
 * - Vendedor fuera de la RM: necesita `users.shipit_origin_id`. Mientras no lo
 *   tenga, el checkout no ofrece courier y Vero recibe un gong con los seis
 *   datos que hay que pegar en el panel de Shipit para crear el origen.
 */

type Admin = SupabaseClient<any, any, any>;

export interface EstadoOrigen {
  enRM: boolean;
  tieneOrigen: boolean;
  /** Puede vender con courier hoy. */
  courierDisponible: boolean;
  comuna: string | null;
  vendedor: {
    id: string;
    username: string | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    default_address: string | null;
    shipit_origin_id: number | null;
    shipit_origin_notified_at: string | null;
  } | null;
}

export async function estadoOrigenVendedor(admin: Admin, sellerId: string): Promise<EstadoOrigen> {
  const { data: v } = await admin
    .from("users")
    .select("id, username, full_name, email, phone, default_address, shipit_origin_id, shipit_origin_notified_at")
    .eq("id", sellerId)
    .maybeSingle();
  if (!v) return { enRM: false, tieneOrigen: false, courierDisponible: false, comuna: null, vendedor: null };

  const comunaCruda = v.default_address ? extractCommune(v.default_address) : "";
  const comuna = comunaCruda ? await findCommune(comunaCruda) : null;
  // Sin dirección no se puede saber la región: se trata como fuera de la RM,
  // que es el caso conservador (no se ofrece courier hasta tener origen).
  const enRM = comuna?.region_id === SHIPIT_REGION_RM;
  const tieneOrigen = typeof v.shipit_origin_id === "number" && v.shipit_origin_id > 0;
  return {
    enRM,
    tieneOrigen,
    courierDisponible: enRM || tieneOrigen,
    comuna: comuna?.name ?? (comunaCruda || null),
    vendedor: v,
  };
}

/** Calle y número del primer tramo de la dirección ("General Bulnes 749"). */
function calleYNumero(address: string | null | undefined): { calle: string; numero: string } | null {
  const tramo = (address ?? "").split(",")[0]?.trim() ?? "";
  const m = tramo.match(/^(.+?)\s+(\d+[a-zA-Z]?)\s*$/) ?? tramo.match(/^(.+?)\s+(\d+[a-zA-Z]?)\b/);
  return m ? { calle: m[1].trim(), numero: m[2] } : null;
}

/**
 * Gong a Vero pidiendo crear el origen del vendedor en Shipit. Solo para
 * vendedores fuera de la RM sin origen. Máximo uno cada 24 h por vendedor
 * (`users.shipit_origin_notified_at`). Nunca lanza.
 *
 * @param motivo qué lo disparó: "conectó MercadoPago" | "un comprador abrió el checkout" …
 */
export async function avisarOrigenFaltante(admin: Admin, sellerId: string, motivo: string): Promise<boolean> {
  try {
    const e = await estadoOrigenVendedor(admin, sellerId);
    if (!e.vendedor || e.courierDisponible) return false;

    const ultimo = e.vendedor.shipit_origin_notified_at ? new Date(e.vendedor.shipit_origin_notified_at).getTime() : 0;
    if (Date.now() - ultimo < 24 * 3600_000) return false;

    const cn = calleYNumero(e.vendedor.default_address);
    const faltan: string[] = [];
    if (!cn) faltan.push("calle y número");
    if (!e.comuna) faltan.push("comuna");
    if (!e.vendedor.phone) faltan.push("teléfono");
    if (!e.vendedor.email) faltan.push("correo");

    const quien = e.vendedor.username ?? e.vendedor.full_name ?? sellerId;
    const lineas = [
      `🟠 <b>${escapeHtml(quien)}</b> ${escapeHtml(motivo)} y está fuera de la RM sin origen en Shipit.`,
      `Crear el origen en el panel y guardar users.shipit_origin_id (scripts/shipit-origenes.mjs --set ${sellerId} &lt;origin_id&gt;):`,
      `• Nombre: ${escapeHtml(e.vendedor.full_name ?? "—")}`,
      `• Calle: ${escapeHtml(cn?.calle ?? "—")}`,
      `• Número: ${escapeHtml(cn?.numero ?? "—")}`,
      `• Comuna: ${escapeHtml(e.comuna ?? "—")}`,
      `• Teléfono: ${escapeHtml(e.vendedor.phone ?? "—")}`,
      `• Correo: ${escapeHtml(e.vendedor.email ?? "—")}`,
    ];
    if (faltan.length) {
      lineas.push(`⚠️ A su perfil le falta: ${escapeHtml(faltan.join(", "))}. Pedírselo antes de crear el origen.`);
    }
    await sendGong(lineas.join("\n"));
    await admin.from("users").update({ shipit_origin_notified_at: new Date().toISOString() }).eq("id", sellerId);
    return true;
  } catch (err) {
    console.error("[shipit-origen] aviso falló:", err);
    return false;
  }
}
