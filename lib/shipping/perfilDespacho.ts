/**
 * Lectura del perfil de despacho del vendedor (07-10-2026). Solo servidor.
 *
 * Las columnas viven en `users` y no se conceden a anon ni a authenticated
 * (20261007b_users_perfil_despacho.sql): pedirlas con la sesión tumba la
 * consulta entera, como pasó con "Mis compras" del 04 al 07-10. Por eso esto
 * recibe un cliente con service role y nunca se llama desde el navegador.
 *
 * Si la migración todavía no está aplicada, la consulta falla por columna
 * inexistente y se devuelve el perfil vacío: el checkout queda como antes.
 */
import {
  leerTarifasPropias,
  obtenerTarifasCoordinado,
  tarifasEfectivas,
  PERFIL_DESPACHO_VACIO,
  COURIERS_PERFIL,
  DIAS_DESPACHO_MIN,
  DIAS_DESPACHO_MAX,
  type PerfilDespacho,
  type TarifasCoordinado,
} from "@/lib/shipping/coordinado";

type Cliente = { from: (t: string) => any };

export const COLUMNAS_PERFIL_DESPACHO = "despacho_couriers, despacho_dias, coordinado_activo, coordinado_tarifas";

const COURIERS_VALIDOS = new Set<string>(COURIERS_PERFIL.map((c) => c.value));

/** Normaliza una fila de `users` al perfil. Lo que venga roto cae al valor por defecto. */
export function normalizarPerfilDespacho(fila: Record<string, unknown> | null | undefined): PerfilDespacho {
  if (!fila) return PERFIL_DESPACHO_VACIO;
  const couriers = Array.isArray(fila.despacho_couriers)
    ? (fila.despacho_couriers as unknown[]).filter((c): c is string => typeof c === "string" && COURIERS_VALIDOS.has(c))
    : [];
  const diasCrudo = Number(fila.despacho_dias);
  const dias =
    Number.isInteger(diasCrudo) && diasCrudo >= DIAS_DESPACHO_MIN && diasCrudo <= DIAS_DESPACHO_MAX
      ? diasCrudo
      : PERFIL_DESPACHO_VACIO.dias;
  return {
    couriers,
    dias,
    coordinadoActivo: fila.coordinado_activo !== false,
    tarifasPropias: leerTarifasPropias(fila.coordinado_tarifas),
  };
}

/**
 * El perfil y si las columnas existen. `disponible: false` = migración sin
 * aplicar (o la base no respondió): el perfil se trata como vacío.
 */
export async function leerPerfilDespachoConEstado(
  admin: Cliente,
  sellerId: string | null | undefined
): Promise<{ perfil: PerfilDespacho; disponible: boolean }> {
  if (!sellerId) return { perfil: PERFIL_DESPACHO_VACIO, disponible: false };
  try {
    const { data, error } = await admin.from("users").select(COLUMNAS_PERFIL_DESPACHO).eq("id", sellerId).maybeSingle();
    if (error) return { perfil: PERFIL_DESPACHO_VACIO, disponible: false };
    return { perfil: normalizarPerfilDespacho(data), disponible: true };
  } catch {
    return { perfil: PERFIL_DESPACHO_VACIO, disponible: false };
  }
}

/** Solo el perfil. Nunca lanza. */
export async function leerPerfilDespacho(admin: Cliente, sellerId: string | null | undefined): Promise<PerfilDespacho> {
  return (await leerPerfilDespachoConEstado(admin, sellerId)).perfil;
}

/**
 * Tarifas del sitio y las efectivas de un vendedor, en una llamada. `sitio` se
 * sigue necesitando aparte para `apagar_shipit`, que es del sitio.
 */
export async function tarifasDelVendedor(
  admin: Cliente,
  sellerId: string | null | undefined
): Promise<{ sitio: TarifasCoordinado | null; efectivas: TarifasCoordinado | null }> {
  const [sitio, perfil] = await Promise.all([obtenerTarifasCoordinado(admin), leerPerfilDespacho(admin, sellerId)]);
  return { sitio, efectivas: tarifasEfectivas(sitio, perfil) };
}
