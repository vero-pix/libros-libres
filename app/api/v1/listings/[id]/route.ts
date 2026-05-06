/**
 * PATCH  /api/v1/listings/:id  — Actualiza precio, condición o estado
 * DELETE /api/v1/listings/:id  — Baja el listing (status → inactive)
 *
 * PATCH body (todos opcionales):
 * {
 *   price?: number,
 *   condition?: "new" | "good" | "fair",
 *   modality?: "sale" | "rent" | "both",
 *   status?: "active" | "inactive",
 * }
 */
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey, unauthorized, forbidden } from "@/lib/apiAuth";

const serviceSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function resolveListing(supabase: ReturnType<typeof serviceSupabase>, id: string, sellerId: string) {
  const { data } = await supabase
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", id)
    .single();
  if (!data) return { listing: null, error: "Listing no encontrado" };
  if (data.seller_id !== sellerId) return { listing: null, error: "forbidden" };
  return { listing: data, error: null };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = await authenticateApiKey(req);
  if (!caller) return unauthorized();

  const supabase = serviceSupabase();
  const { listing, error } = await resolveListing(supabase, params.id, caller.sellerId);
  if (!listing) return error === "forbidden" ? forbidden() : Response.json({ error }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const allowed = ["price", "condition", "modality", "status"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0)
    return Response.json({ error: "No hay campos válidos para actualizar" }, { status: 400 });

  if (updates.condition && !["new", "good", "fair"].includes(updates.condition))
    return Response.json({ error: "condition debe ser: new | good | fair" }, { status: 400 });

  if (updates.status && !["active", "inactive"].includes(updates.status))
    return Response.json({ error: "status debe ser: active | inactive" }, { status: 400 });

  const { data: updated, error: updateErr } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", params.id)
    .select("id, price, condition, modality, status")
    .single();

  if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

  return Response.json({ listing: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = await authenticateApiKey(req);
  if (!caller) return unauthorized();

  const supabase = serviceSupabase();
  const { listing, error } = await resolveListing(supabase, params.id, caller.sellerId);
  if (!listing) return error === "forbidden" ? forbidden() : Response.json({ error }, { status: 404 });

  const { error: updateErr } = await supabase
    .from("listings")
    .update({ status: "inactive" })
    .eq("id", params.id);

  if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

  return Response.json({ ok: true, message: "Listing dado de baja" });
}
