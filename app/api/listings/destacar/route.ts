import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Destacar una publicación propia desde /mis-libros.
 *
 * Por ahora solo para los vendedores de VENDEDORES_HABILITADOS: la idea de
 * abrirlo a todos (y cobrarlo) está en pie, pero primero hay que medir si la
 * vitrina sirve — al 16-09-2026, de 46 ventas en 90 días ninguna fue de un
 * libro destacado. Para habilitar a alguien más, basta agregar su username.
 *
 * Se ven todos en /destacados (hasta 60), ordenados por `featured_rank`: el
 * primer cupo libre entre 1 y 12 lo deja arriba; si no hay, va detrás.
 */
const VENDEDORES_HABILITADOS = ["vero"];
const CUPOS_VISIBLES = 12;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tienes que iniciar sesión." }, { status: 401 });

  const { id, featured } = (await req.json().catch(() => ({}))) as { id?: string; featured?: boolean };
  if (!id || typeof featured !== "boolean") {
    return NextResponse.json({ error: "Falta el libro o la acción." }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: perfil } = await admin.from("users").select("username").eq("id", user.id).maybeSingle();
  if (!perfil?.username || !VENDEDORES_HABILITADOS.includes(perfil.username)) {
    return NextResponse.json({ error: "Destacar todavía no está disponible en tu cuenta." }, { status: 403 });
  }

  const { data: listing } = await admin
    .from("listings")
    .select("id, seller_id, status, featured, featured_rank")
    .eq("id", id)
    .maybeSingle();
  if (!listing) return NextResponse.json({ error: "No encuentro esa publicación." }, { status: 404 });
  if (listing.seller_id !== user.id) {
    return NextResponse.json({ error: "Esa publicación no es tuya." }, { status: 403 });
  }

  if (!featured) {
    const { error } = await admin.from("listings").update({ featured: false, featured_rank: null }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ featured: false, rank: null, visible: false });
  }

  if (listing.status !== "active") {
    return NextResponse.json({ error: "Solo se pueden destacar publicaciones activas." }, { status: 400 });
  }

  // Primer cupo libre de la vitrina; si no hay, va detrás de todos.
  const { data: ocupados } = await admin
    .from("listings")
    .select("featured_rank")
    .eq("featured", true)
    .eq("status", "active")
    .not("featured_rank", "is", null);
  const usados = new Set((ocupados ?? []).map((l) => l.featured_rank as number));

  let rank: number | null = null;
  for (let i = 1; i <= CUPOS_VISIBLES; i++) {
    if (!usados.has(i)) { rank = i; break; }
  }
  const visible = rank !== null;
  if (rank === null) {
    rank = Math.max(CUPOS_VISIBLES, ...Array.from(usados)) + 1;
  }

  const { error } = await admin.from("listings").update({ featured: true, featured_rank: rank }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ featured: true, rank, visible });
}
