import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * ¿Este vendedor puede cobrar por transferencia?
 *
 * `users.acepta_transferencia` y `users.datos_transferencia` NO están
 * concedidas al rol `anon`: pedirlas dentro de la consulta de la ficha hacía
 * fallar la consulta entera y la ficha redirigía al home para cualquiera que no
 * hubiera iniciado sesión (16-09-2026). Por eso la bandera se resuelve aparte,
 * con el cliente de servicio, y solo se devuelve un booleano: los datos
 * bancarios no salen nunca de la página del pedido.
 */
export async function cobraPorTransferencia(sellerId: string): Promise<boolean> {
  try {
    const { data } = await createServiceRoleClient()
      .from("users")
      .select("acepta_transferencia, datos_transferencia")
      .eq("id", sellerId)
      .maybeSingle();
    return !!data?.acepta_transferencia && !!String(data?.datos_transferencia ?? "").trim();
  } catch {
    return false;
  }
}
