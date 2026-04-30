import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID de publicación requerido" }, { status: 400 });
  }

  // 1. Verify ownership
  const { data: listing, error: findError } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", id)
    .single();

  if (findError || !listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  if (listing.seller_id !== user.id) {
    // Check if user is admin (optional, but for now we only allow owner)
    return NextResponse.json({ error: "No tienes permiso para eliminar esta publicación" }, { status: 403 });
  }

  // 2. Use service role to bypass RLS and cleanup safely
  const serviceRoleClient = createServiceRoleClient();

  try {
    // Clean up dependencies
    await Promise.all([
      serviceRoleClient.from("listing_images").delete().eq("listing_id", id),
      serviceRoleClient.from("page_views").delete().eq("listing_id", id),
      serviceRoleClient.from("cart").delete().eq("listing_id", id),
      serviceRoleClient.from("book_requests").update({ fulfilled: false, fulfilled_listing_id: null }).eq("fulfilled_listing_id", id)
    ]);

    // Delete listing
    const { error: deleteError } = await serviceRoleClient
      .from("listings")
      .delete()
      .eq("id", id);

    if (deleteError) {
      // If it fails here, check for Orders
      const { data: orders } = await serviceRoleClient.from("orders").select("id").eq("listing_id", id).limit(1);
      if (orders && orders.length > 0) {
        return NextResponse.json({ 
          error: "Esta publicación no se puede eliminar porque ya tiene ventas asociadas. Te recomendamos pausarla." 
        }, { status: 400 });
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
