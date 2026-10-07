import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ESTADOS_ARCHIVABLES } from "@/lib/ventasArchivadas";

export const runtime = "nodejs";

/**
 * POST /api/ventas/archivar
 *
 * Archiva o desarchiva una fila de "Mis ventas" (07-10-2026). Solo esconde:
 * nunca toca la orden ni el carrito. La tabla `ventas_archivadas` no se
 * concede a authenticated (20261007c), así que se verifica la sesión y se
 * escribe con service role, siempre con el seller_id de quien llama.
 *
 * Body: { tipo: "orden" | "carrito", ref: string, archivar: boolean }
 * - orden: `ref` es orders.id; solo se archiva si es del vendedor y está
 *   entregada o cancelada (lo demás tiene algo pendiente).
 * - carrito: `ref` es el buyer_id.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tienes que iniciar sesión." }, { status: 401 });
  }

  let body: { tipo?: unknown; ref?: unknown; archivar?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "No pude leer lo que mandaste." }, { status: 400 });
  }

  const tipo = body.tipo;
  const ref = typeof body.ref === "string" ? body.ref.trim() : "";
  const archivar = body.archivar !== false;
  if ((tipo !== "orden" && tipo !== "carrito") || !UUID.test(ref)) {
    return NextResponse.json({ error: "Falta qué archivar." }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  if (tipo === "orden" && archivar) {
    const { data: orden } = await admin
      .from("orders")
      .select("status")
      .eq("id", ref)
      .eq("seller_id", user.id)
      .maybeSingle();
    if (!orden) {
      return NextResponse.json({ error: "No encontré esa venta." }, { status: 404 });
    }
    if (!(ESTADOS_ARCHIVABLES as readonly string[]).includes(orden.status)) {
      return NextResponse.json(
        { error: "Esta venta tiene algo pendiente. Se puede archivar cuando esté entregada o cancelada." },
        { status: 409 }
      );
    }
  }

  const { error } = archivar
    ? await admin
        .from("ventas_archivadas")
        .upsert({ seller_id: user.id, tipo, ref, created_at: new Date().toISOString() }, { onConflict: "seller_id,tipo,ref" })
    : await admin.from("ventas_archivadas").delete().eq("seller_id", user.id).eq("tipo", tipo).eq("ref", ref);

  if (error) {
    // Sin la migración 20261007c la tabla no existe: se avisa claro en vez de un 500 mudo.
    return NextResponse.json(
      { error: "No pude archivar ahora. Inténtalo de nuevo en un rato." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true });
}
