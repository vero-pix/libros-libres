/**
 * Qué número de ventas se muestra en el perfil y en la ficha de cada vendedor.
 *
 * Hay dos cifras posibles y NO miden lo mismo:
 *
 * - `seller_stats.paid_total` — órdenes pagadas por MercadoPago dentro del
 *   sitio. Es exacta y verificable, pero deja fuera todo lo que se cerró por
 *   transferencia, por WhatsApp o en mano.
 * - listings en estado `completed` — libros que el vendedor marcó como
 *   vendidos. Incluye lo anterior y lo demás… siempre que el vendedor use ese
 *   estado para decir "lo vendí" y no para decir "lo retiré".
 *
 * El 18-09-2026 se midió la diferencia: cimlibros tiene 210 `completed` contra
 * 2 pagadas, buhardilla 89 contra 4, scarlett 62 contra 3. Esos números son
 * demasiado altos para ser todos ventas, y publicarlos sería inventarles una
 * cifra que nadie verificó.
 *
 * Vero SÍ confirmó los suyos uno por uno (22 libros vendidos, 7 de ellos por
 * MercadoPago), así que por ahora el contador de libros vendidos es solo para
 * su tienda. Para sumar a otro vendedor hay que preguntarle primero cómo usa
 * el estado `completed` — no basta con mirar la tabla.
 */

/** Cuenta del usuario de Vero (username `vero`). */
export const VENDEDORES_CON_LIBROS_VENDIDOS = new Set<string>([
  "2201d163-4423-4971-91f0-f6cebd00d1bd",
]);

/**
 * El panel de seguimiento de la ficha (visitas, días publicado, ritmo) lo ve
 * CUALQUIER vendedor sobre sus propios libros — se abrió a todos el 18-09-2026,
 * después de probarlo. No expone nada a terceros: el endpoint exige ser el
 * dueño del listing.
 *
 * `VERO` además puede mirar el catálogo completo, no solo lo suyo: es la dueña
 * del sitio y necesita comparar entre tiendas para encontrar hallazgos.
 */
export const VERO = "2201d163-4423-4971-91f0-f6cebd00d1bd";

export function veTodoElCatalogo(userId: string | null | undefined): boolean {
  return userId === VERO;
}

export function muestraLibrosVendidos(sellerId: string | null | undefined): boolean {
  return !!sellerId && VENDEDORES_CON_LIBROS_VENDIDOS.has(sellerId);
}
