import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

/** 7 días. Después el botón de /mis-ventas genera otra. */
const LABEL_URL_TTL_SECONDS = 7 * 24 * 3600;

/**
 * GET /api/shipments/{id}/label
 *
 * Entrega la etiqueta del envío al VENDEDOR con una URL firmada del bucket
 * privado `labels` (D3). Exige sesión y que el envío sea suyo; el comprador no
 * la necesita (la etiqueta lleva sus propios datos) y nadie más la ve.
 * Responde 302 a la URL firmada, así el botón de /mis-ventas es un <a> normal.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // La RLS de shipments deja ver la fila al vendedor y al comprador; acá se
  // exige además ser el vendedor.
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id, seller_id, status, label_path")
    .eq("id", params.id)
    .maybeSingle();

  if (!shipment || shipment.seller_id !== user.id) {
    return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 });
  }
  if (!shipment.label_path) {
    return NextResponse.json(
      { error: "La etiqueta todavía no está lista", status: shipment.status },
      { status: 409 }
    );
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin.storage
    .from("labels")
    .createSignedUrl(shipment.label_path, LABEL_URL_TTL_SECONDS, {
      download: `etiqueta-${shipment.id.slice(0, 8)}.pdf`,
    });
  if (error || !data?.signedUrl) {
    console.error("[label] signed url:", error?.message);
    return NextResponse.json({ error: "No se pudo generar el enlace" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl, { status: 302 });
}
