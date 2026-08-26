/**
 * Traer TODAS las filas de una consulta, sin el techo de 1.000.
 *
 * Supabase corta en 1.000 filas por defecto y **no avisa**: la consulta
 * devuelve `error: null` y mil filas, así que el bug se ve como un número bajo,
 * no como una falla. Ya mordió tres veces:
 *
 *  - el contador de vendedores del login (commit b306871),
 *  - "0 visitas en tus libros los últimos 7 días" en /mis-libros, cuando eran 43,
 *  - el panel de admin, que mostraba 467 sesiones en 30 días cuando eran 8.107.
 *
 * Uso:
 *
 *   const filas = await paginar((desde, hasta) =>
 *     supabase.from("page_views").select("session_id").gte("created_at", d30).range(desde, hasta)
 *   );
 *
 * La consulta que se pasa DEBE aplicar `.range(desde, hasta)` con los argumentos
 * que recibe; de lo contrario esto gira sobre las mismas mil filas.
 *
 * Ojo: para contar filas sin necesitar su contenido es más barato
 * `.select("*", { count: "exact", head: true })`, que no trae ninguna. Este
 * helper es para cuando se necesitan los datos (agrupar, deduplicar sesiones…).
 */
export async function paginar<T>(
  consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  opciones: { tamanoPagina?: number; maxFilas?: number } = {}
): Promise<T[]> {
  const tamano = opciones.tamanoPagina ?? 1000;
  // Tope de seguridad: si una tabla crece sin control, mejor devolver mucho que
  // colgar el endpoint para siempre.
  const max = opciones.maxFilas ?? 100_000;

  const filas: T[] = [];
  for (let desde = 0; desde < max; desde += tamano) {
    const { data, error } = await consulta(desde, desde + tamano - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    filas.push(...data);
    if (data.length < tamano) break;
  }
  return filas;
}
