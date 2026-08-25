import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import {
  construirItems,
  serializarXml,
  SELECT_FEED,
  type CanalFeed,
  type FilaListing,
} from "@/lib/product-feed";

/**
 * Feed de producto — RSS 2.0 con namespace de Google.
 *
 *   /feeds/merchant.xml  → Google Merchant Center (utm_source=merchant)
 *   /feeds/meta.xml      → catálogo de Meta        (utm_source=meta)
 *
 * OJO con la ruta: NO puede colgar de /feed. El middleware devuelve 410 Gone a
 * todo lo que empiece con /feed/ para desindexar las URLs viejas de WordPress,
 * y el feed quedaba mudo sin ningún error visible.
 *
 * Se regenera una vez al día: el catálogo no cambia tan rápido y ambas
 * plataformas lo releen con esa frecuencia o menos.
 */
export const revalidate = 86400;

const CANALES: Record<string, CanalFeed> = {
  "merchant.xml": "merchant",
  "meta.xml": "meta",
};

export async function GET(_req: Request, { params }: { params: { canal: string } }) {
  const canal = CANALES[params.canal];
  if (!canal) {
    return new NextResponse("Feed no encontrado. Usa /feeds/merchant.xml o /feeds/meta.xml", {
      status: 404,
    });
  }

  const supabase = createPublicClient();

  // Supabase corta en 1.000 filas aunque el range pida más: hay que paginar o el
  // feed queda mudo desde el ítem 1.001. Ver [[reference_supabase_techo_1000_filas]].
  const filas: FilaListing[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase
      .from("listings")
      .select(SELECT_FEED)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(desde, desde + 999);

    if (error) {
      console.error("[feed] Error leyendo listings:", error.message);
      return new NextResponse("Error generando el feed", { status: 500 });
    }
    filas.push(...((data ?? []) as unknown as FilaListing[]));
    if (!data || data.length < 1000) break;
  }

  const { items, excluidos } = construirItems(filas, canal);

  // El detalle de exclusiones vive en `npm run feed:validar`; acá solo el conteo,
  // para poder mirarlo en los logs de Vercel si el feed encoge de golpe.
  console.log(`[feed:${canal}] ${items.length} ítems · ${excluidos.length} excluidos`);

  return new NextResponse(serializarXml(items, canal), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
