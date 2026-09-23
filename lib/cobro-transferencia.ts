import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * ¿Este vendedor puede cobrar por transferencia?
 *
 * `users.acepta_transferencia` NO está concedida al rol `anon`: pedirla dentro
 * de la consulta de la ficha hacía fallar la consulta entera y la ficha
 * redirigía al home para cualquiera que no hubiera iniciado sesión
 * (16-09-2026). Por eso la bandera se resuelve aparte, con el cliente de
 * servicio, y solo se devuelve un booleano.
 *
 * Desde el 23-09-2026 el sitio NO guarda datos bancarios de nadie: basta con
 * que el vendedor acepte transferencia, y los datos se los manda él al
 * comprador por mensaje una vez hecho el pedido (app/api/orders/route.ts).
 */
export async function cobraPorTransferencia(sellerId: string): Promise<boolean> {
  try {
    const { data } = await createServiceRoleClient()
      .from("users")
      .select("acepta_transferencia")
      .eq("id", sellerId)
      .maybeSingle();
    return !!data?.acepta_transferencia;
  } catch {
    return false;
  }
}

/**
 * ¿El vendedor cobra dentro del sitio? MercadoPago o transferencia. Es lo que
 * pide "Hacer oferta" desde el 1-10-2026 (lib/offers.ts). Si ya se sabe que
 * tiene MP, no consulta la base.
 */
export async function cobraDentroDelSitio(sellerId: string, tieneMP: boolean): Promise<boolean> {
  return tieneMP || (await cobraPorTransferencia(sellerId));
}
