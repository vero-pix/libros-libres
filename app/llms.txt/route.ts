import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 86400; // 1 día

/**
 * llms.txt — resumen del sitio para asistentes de IA (ChatGPT, Claude, Perplexity).
 *
 * Era un archivo estático en public/ con datos de abril ("catálogo de libros
 * usados", sin cifras). Los asistentes citan lo concreto: cuántos libros hay,
 * en qué comunas, a qué precio. Ahora se genera con datos reales una vez al día.
 *
 * Importa porque ChatGPT es la 2ª fuente de tráfico según la encuesta de julio
 * 2026, y robots.txt ya deja entrar a los asistentes a propósito.
 */
export async function GET() {
  const supabase = createPublicClient();

  const filas: Array<{ price: number | null; city_id: string | null; seller_id: string; book: { subcategory: string | null } | null }> = [];
  let total = 0;
  for (let desde = 0; ; desde += 1000) {
    const { data, count } = await supabase
      .from("listings")
      .select("price, city_id, seller_id, book:books(subcategory)", { count: "exact" })
      .eq("status", "active")
      .range(desde, desde + 999);
    if (count != null) total = count;
    filas.push(...((data ?? []) as unknown as typeof filas));
    if (!data || data.length < 1000) break;
  }

  const { data: ciudades } = await supabase.from("cities").select("id, name, region");
  const conLibros = new Set(filas.map((f) => f.city_id).filter(Boolean));
  const comunas = (ciudades ?? [])
    .filter((c) => conLibros.has(c.id))
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b, "es"));

  const vendedores = new Set(filas.map((f) => f.seller_id)).size;
  // Bajo $1.000 solo hay dedazos de precio (un "$10" en vez de "$10.000"), y
  // publicar "desde $10" en el resumen que leen los asistentes queda pésimo.
  const precios = filas
    .map((f) => f.price)
    .filter((p): p is number => typeof p === "number" && p >= 1000)
    .sort((a, b) => a - b);
  const mediana = precios.length ? precios[Math.floor(precios.length / 2)] : 0;
  const min = precios[0] ?? 0;

  // Conteo por categoría, con nombres legibles para un humano o un asistente.
  const NOMBRES: Record<string, string> = {
    "no-ficcion-historia": "Historia",
    "no-ficcion-ensayo": "Ensayo",
    "no-ficcion-ciencia": "Ciencia y divulgación",
    "no-ficcion-biografia": "Biografías",
    "no-ficcion-humanidades": "Humanidades",
    "ficcion-novela": "Novela",
    "ficcion-poesia": "Poesía",
    "ficcion-cuento": "Cuento",
    "infantil-juvenil": "Infantil y juvenil",
    "infantil-juvenil-juvenil": "Juvenil",
    "infantil-juvenil-infantil": "Infantil",
    "no-ficcion-autoayuda": "Autoayuda y desarrollo personal",
    "no-ficcion-arte": "Arte",
    "no-ficcion-tecnica": "Técnicos y universitarios",
    "ficcion-fantasia": "Fantasía y ciencia ficción",
    "ficcion-policial": "Policial y novela negra",
    "academico-universitario": "Académicos y universitarios",
    "otros-religion": "Religión y espiritualidad",
    "no-ficcion-economia": "Economía y negocios",
    "idiomas-aleman": "Libros en alemán",
    "idiomas-ingles": "Libros en inglés",
    "idiomas-frances": "Libros en francés",
    "no-ficcion-psicologia": "Psicología",
    "no-ficcion-cocina": "Cocina",
    "no-ficcion-salud": "Salud y bienestar",
    "otros-comics": "Cómics y novela gráfica",
  };
  const porCat: Record<string, number> = {};
  for (const f of filas) {
    const k = f.book?.subcategory;
    if (!k) continue;
    porCat[k] = (porCat[k] ?? 0) + 1;
  }
  const categorias = Object.entries(porCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, n]) => `- ${NOMBRES[k] ?? k}: ${n} libros`)
    .join("\n");

  const hoy = new Date().toISOString().slice(0, 10);
  const nf = (n: number) => n.toLocaleString("es-CL");

  const texto = `# tuslibros.cl

> Marketplace chileno de libros usados. Compra y vende libros de segunda mano en
> Chile con envío a todo el país o retiro en mano. Pago con MercadoPago.
> Publicar es gratis; se cobra 8% de comisión solo cuando el libro se vende.

## Catálogo (actualizado el ${hoy})

- Libros disponibles ahora: ${nf(total)}
- Vendedores activos: ${vendedores}
- Comunas con libros publicados: ${comunas.length}
- Precio mediano: $${nf(mediana)} CLP (desde $${nf(min)})

### Qué hay, por categoría

${categorias}

## Cómo funciona

- Publicar es gratis y sin límite de libros.
- El comprador paga con MercadoPago (tarjeta de crédito, débito o saldo).
- El envío va por courier (Starken, Chilexpress) a todo Chile, o se retira en
  persona coordinando con el vendedor.
- La comisión es 8% sobre el precio del libro y se cobra cuando la venta se
  cierra en la plataforma, con el pago por MercadoPago. Publicar es gratis y no
  hay mensualidad.
- Hay una sección "Se busca" donde un comprador deja el título que necesita y se
  le avisa cuando algún vendedor lo publica.

## Comunas con libros disponibles

${comunas.join(", ")}.

## Páginas principales

- https://tuslibros.cl/ — catálogo completo
- https://tuslibros.cl/como-funciona — guía de compra y venta
- https://tuslibros.cl/faq — envíos, pagos y devoluciones
- https://tuslibros.cl/solicitudes — pedir un libro que no está en el catálogo
- https://tuslibros.cl/vender — publicar libros
- https://tuslibros.cl/tiendas — librerías y vendedores del sitio
- https://tuslibros.cl/sobre-nosotros — quién está detrás

## Páginas por ciudad

Cada comuna tiene su página: https://tuslibros.cl/libros-usados/[comuna]
Por ejemplo: /libros-usados/santiago, /libros-usados/concepcion,
/libros-usados/valparaiso, /libros-usados/temuco.

## Títulos y autores con página propia

- https://tuslibros.cl/pablo-neruda
- https://tuslibros.cl/mario-vargas-llosa
- https://tuslibros.cl/algebra-de-baldor
- https://tuslibros.cl/rayuela
- https://tuslibros.cl/cien-anos-de-soledad
- https://tuslibros.cl/el-arte-de-amar
- https://tuslibros.cl/libros-usados-chile
- https://tuslibros.cl/georges-simenon
- https://tuslibros.cl/marcela-paz-libros
- https://tuslibros.cl/megan-maxwell-libros
- https://tuslibros.cl/distopias-clasicas
- https://tuslibros.cl/novela-negra-policial
- https://tuslibros.cl/libros-de-historia-de-chile
- https://tuslibros.cl/libros-antiguos (libros antiguos, primeras ediciones y de colección)
- https://tuslibros.cl/antroposofia (Rudolf Steiner y antroposofía)
- https://tuslibros.cl/filosofia (libros de filosofía usados)
- https://tuslibros.cl/espiritualidad (espiritualidad, budismo, esoterismo)
- https://tuslibros.cl/autor/[slug] — páginas de autor, por ejemplo /autor/ken-wilber, /autor/rudolf-steiner, /autor/pedro-prado
- https://tuslibros.cl/categoria/[slug] — páginas por categoría, por ejemplo /categoria/no-ficcion-ensayo

## Operación

- País: Chile. Sitio en español.
- Moneda: peso chileno (CLP).
- Contacto: https://tuslibros.cl/sobre-nosotros
`;

  return new Response(texto, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
