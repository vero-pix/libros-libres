import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // Supabase corta en 1.000 filas por consulta. Con 3.924 activos, el mapa
  // recibía solo las 1.000 más nuevas —todo lo publicado desde el 29-08— y
  // 862 de esas caían en un mismo punto del centro de Santiago. Resultado:
  // el mapa se abría sobre la ubicación del visitante y no había una sola
  // burbuja; los 241 libros de Providencia, por ejemplo, nunca llegaban.
  // Se pagina con .range(), igual que el contador del diario. (09-09-2026)
  //
  // El select trae SOLO lo que el mapa dibuja y lo que el sidebar y el popup
  // muestran: con los campos que había antes (notes, address, isbn, género,
  // avatar) las 3.924 filas pesaban del orden de 4 MB en el navegador.
  // `slug` y `seller.username` son nuevos y hacen falta para libroUrl: sin
  // ellos todos los enlaces del mapa caían al fallback /listings/<uuid>.
  const columnas = `
      id,
      slug,
      modality,
      price,
      latitude,
      longitude,
      featured,
      is_collectible,
      cover_image_url,
      book:books (
        title,
        author,
        cover_url
      ),
      seller:users (
        username,
        full_name
      )
    `;

  const filas: unknown[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase
      .from("listings")
      .select(columnas)
      .eq("status", "active")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("deprioritized", { ascending: true })
      .order("created_at", { ascending: false })
      .range(desde, desde + 999);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  return NextResponse.json(filas, {
    headers: { "Cache-Control": "no-store" },
  });
}
