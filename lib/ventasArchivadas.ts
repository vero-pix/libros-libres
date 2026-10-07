/**
 * Ventas y carritos que el vendedor archivó en "Mis ventas" (07-10-2026).
 *
 * Archivar solo esconde la fila: la orden y el carrito siguen intactos. La
 * tabla `ventas_archivadas` (20261007c) no se concede a authenticated, así que
 * esto se lee con service role y siempre acotado al vendedor de la sesión.
 */

/** Solo se archiva lo que ya no tiene nada pendiente. */
export const ESTADOS_ARCHIVABLES = ["delivered", "cancelled"] as const;

export type TipoArchivo = "orden" | "carrito";

/** Clave única de una fila en el cliente: "orden:<id>" o "carrito:<buyer_id>". */
export function claveArchivo(tipo: TipoArchivo, ref: string): string {
  return `${tipo}:${ref}`;
}

type Cliente = { from: (t: string) => any };

/**
 * Lo archivado por este vendedor. `disponible: false` = la tabla no existe
 * (migración sin aplicar) o la base no respondió: no se ofrece archivar.
 * Nunca lanza.
 */
export async function leerArchivadas(
  admin: Cliente,
  sellerId: string
): Promise<{ disponible: boolean; ordenes: Set<string>; carritos: Map<string, string> }> {
  const vacio = { disponible: false, ordenes: new Set<string>(), carritos: new Map<string, string>() };
  try {
    const { data, error } = await admin
      .from("ventas_archivadas")
      .select("tipo, ref, created_at")
      .eq("seller_id", sellerId);
    if (error) return vacio;
    const ordenes = new Set<string>();
    const carritos = new Map<string, string>();
    for (const fila of (data ?? []) as { tipo: string; ref: string; created_at: string }[]) {
      if (fila.tipo === "orden") ordenes.add(fila.ref);
      else if (fila.tipo === "carrito") carritos.set(fila.ref, fila.created_at);
    }
    return { disponible: true, ordenes, carritos };
  } catch {
    return vacio;
  }
}

/**
 * Un carrito archivado sigue archivado mientras el comprador no agregue otro
 * libro del vendedor después de archivarlo. Si agregó, vuelve a la vista: es
 * una señal nueva que el vendedor tiene que ver.
 */
export function carritoSigueArchivado(archivadoEn: string | undefined, ultimoAgregado: string): boolean {
  if (!archivadoEn) return false;
  return new Date(ultimoAgregado).getTime() <= new Date(archivadoEn).getTime();
}
