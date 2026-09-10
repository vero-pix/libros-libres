/**
 * Qué anda buscando la gente en el sitio, cruzado con lo que sí tenemos.
 *
 * La vitrina del home se armaba a mano (`listings.featured`). Esto la
 * complementa con la única señal de intención que existe de verdad: lo que la
 * gente escribe en el buscador. Las visitas por ficha no sirven para decidir
 * —el libro más visto tuvo 19 sesiones en 30 días, que es ruido— pero las
 * búsquedas sí tienen volumen: "stephen king" 30 veces, "alice kellen" 28.
 *
 * Diagnóstico del 09-09-2026.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface LibroBuscado {
  listingId: string;
  titulo: string;
  autor: string | null;
  precio: number | null;
  slug: string | null;
  vendedorUsername: string | null;
  vendedorNombre: string | null;
  coverUrl: string | null;
  condicion: string | null;
  /** El término que la gente escribió, tal cual. */
  termino: string;
  /** Cuántas veces lo buscaron en la ventana. */
  busquedas: number;
}

/**
 * Ruido que hay que sacar antes de mirar nada: UUIDs de búsquedas internas,
 * el placeholder `{search_term_string}` del schema de SEO, números sueltos
 * (ISBN, códigos) y los pegotes larguísimos que deja la carga masiva.
 */
function esBasura(q: string): boolean {
  if (q.length < 3 || q.length > 40) return true;
  if (q.startsWith("{")) return true;
  if (/^[0-9]+$/.test(q)) return true;
  if (/^[0-9a-f]{8}[ -]/.test(q)) return true;
  // Términos que son categorías del propio sitio, no intención de un autor.
  return ["varios", "varios autores", "nn nn", "historia", "ficcion", "ficción"].includes(q);
}

/** Normaliza para comparar contra título/autor: sin tildes, minúsculas. */
function limpiar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Devuelve hasta `cuantos` libros que la gente está buscando y que están a la
 * venta ahora mismo, ordenados por cuánto se buscan. Nunca repite título ni
 * vendedor: una vitrina con tres libros del mismo vendedor no es una vitrina.
 */
export async function librosMasBuscados(
  sb: SupabaseClient,
  opts: { dias?: number; cuantos?: number } = {}
): Promise<LibroBuscado[]> {
  const dias = opts.dias ?? 30;
  const cuantos = opts.cuantos ?? 4;

  // La agregación va en SQL, no acá: bajar las filas para contarlas en JS
  // daba un ranking falso porque Supabase corta el resultado, y con 43.000
  // búsquedas la muestra que llegaba decía "ajedrez 8" en vez de
  // "stephen king 30". Ver la función `top_busquedas`.
  const { data: crudo, error } = await sb.rpc("top_busquedas", { dias, cuantos: 25 });

  // Sin búsquedas no hay vitrina: el home cae a la fila curada de siempre.
  if (error || !crudo?.length) return [];

  const ranking: [string, number][] = (crudo as { termino: string; veces: number }[])
    .filter((r) => !esBasura((r.termino ?? "").trim()))
    .map((r) => [r.termino.trim(), Number(r.veces)]);

  const elegidos: LibroBuscado[] = [];
  const titulosUsados = new Set<string>();
  const vendedoresUsados = new Set<string>();

  for (const [termino, busquedas] of ranking) {
    if (elegidos.length >= cuantos) break;

    // El término suele ser un autor ("stephen king"); si no pega por autor se
    // prueba por título ("crimen y castigo").
    const porAutor = await sb
      .from("listings")
      .select(
        "id, price, slug, cover_image_url, condition, seller_id, book:books!inner(title, author, cover_url), seller:users(username, full_name)"
      )
      .eq("status", "active")
      .neq("deprioritized", true)
      .ilike("book.author", `%${termino}%`)
      .order("price", { ascending: true })
      .limit(6);

    let candidatos = porAutor.data ?? [];
    if (candidatos.length === 0) {
      const porTitulo = await sb
        .from("listings")
        .select(
          "id, price, slug, cover_image_url, condition, seller_id, book:books!inner(title, author, cover_url), seller:users(username, full_name)"
        )
        .eq("status", "active")
        .neq("deprioritized", true)
        .ilike("book.title", `%${termino}%`)
        .order("price", { ascending: true })
        .limit(6);
      candidatos = porTitulo.data ?? [];
    }

    for (const c of candidatos as any[]) {
      const book = Array.isArray(c.book) ? c.book[0] : c.book;
      const seller = Array.isArray(c.seller) ? c.seller[0] : c.seller;
      const cover = c.cover_image_url ?? book?.cover_url ?? null;
      // Sin portada no entra: es una vitrina, se mira antes de leerse.
      if (!book?.title || !cover) continue;

      const claveTitulo = limpiar(book.title);
      if (titulosUsados.has(claveTitulo)) continue;
      if (c.seller_id && vendedoresUsados.has(c.seller_id)) continue;

      titulosUsados.add(claveTitulo);
      if (c.seller_id) vendedoresUsados.add(c.seller_id);
      elegidos.push({
        listingId: c.id,
        titulo: book.title,
        autor: book.author ?? null,
        precio: c.price ?? null,
        slug: c.slug ?? null,
        vendedorUsername: seller?.username ?? null,
        vendedorNombre: seller?.full_name ?? null,
        coverUrl: cover,
        condicion: c.condition ?? null,
        termino,
        busquedas,
      });
      break;
    }
  }

  return elegidos;
}
