import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/seller-stats — refresco de `seller_stats` (cada hora).
 *
 * Todo el cálculo vive en la función SQL `refresh_seller_stats`: agrega
 * `orders`, `listings`, `reviews` y `page_views` (con filtro de bots) sin traer
 * nada a JavaScript. Acá solo se dispara y se reporta.
 *
 * Por qué cron horario y no un trigger por orden: el trigger solo tocaría al
 * vendedor de esa orden y dejaría `active_listings` y las portadas viejas
 * cuando alguien publica o pausa libros, que es lo que más se mueve. El webhook
 * de pago llama `refresh_seller_stats(seller_id)` para uno solo, y esto barre
 * el resto.
 *
 * `?seller_id=uuid` refresca uno, para depurar.
 *
 * ⚠️ Usa createServiceRoleClient a propósito: `createClient` de supabase-js a
 * pelo en una ruta GET queda cacheado en disco por Next 14 y devuelve datos
 * congelados (le pasó al worker de Shipit el 07-09-2026).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = new URL(request.url).searchParams.get("seller_id");
  const admin = createServiceRoleClient();
  const t0 = Date.now();

  const { data: filas, error } = await admin.rpc("refresh_seller_stats", {
    p_seller_id: sellerId,
  });
  if (error) {
    return NextResponse.json({ error: `refresh_seller_stats: ${error.message}` }, { status: 500 });
  }

  const { data: confiables } = await admin
    .from("seller_stats")
    .select("seller_id, trust_score, paid_90d, active_listings, seller:users(username)")
    .eq("is_trusted", true)
    .order("trust_score", { ascending: false })
    .limit(20);

  return NextResponse.json({
    filas_escritas: filas ?? 0,
    confiables: confiables?.length ?? 0,
    ms: Date.now() - t0,
    ranking: (confiables ?? []).map((s: any) => ({
      vendedor: (Array.isArray(s.seller) ? s.seller[0] : s.seller)?.username ?? s.seller_id,
      score: s.trust_score,
      ventas_90d: s.paid_90d,
      activos: s.active_listings,
    })),
  });
}
