import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const CONDITIONS = new Set(["new", "good", "fair", "poor"]);
const MODALITIES = new Set(["sale", "loan", "both"]);

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("id, book_id, seller_id, slug")
    .eq("id", params.id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const canEdit = listing.seller_id === user.id || profile?.role === "admin";
  if (!canEdit) {
    return NextResponse.json({ error: "No tienes permiso para editar esta publicación" }, { status: 403 });
  }

  const body = await req.json();
  const book = body.book ?? {};
  const listingInput = body.listing ?? {};

  const bookUpdates: any = {
    title: cleanText(book.title),
    author: cleanText(book.author),
    category: cleanText(book.category),
    subcategory: cleanText(book.subcategory),
    description: cleanText(book.description),
    publisher: cleanText(book.publisher),
    pages: cleanNumber(book.pages),
    binding: cleanText(book.binding),
  };
  
  if (book.cover_url !== undefined) {
    bookUpdates.cover_url = cleanText(book.cover_url);
  }

  if (!bookUpdates.title || !bookUpdates.author) {
    return NextResponse.json({ error: "El libro necesita título y autor" }, { status: 400 });
  }

  const condition = cleanText(listingInput.condition);
  const modality = cleanText(listingInput.modality);
  if (!condition || !CONDITIONS.has(condition)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  if (!modality || !MODALITIES.has(modality)) {
    return NextResponse.json({ error: "Modalidad inválida" }, { status: 400 });
  }

  const listingUpdates: any = {
    condition,
    modality,
    notes: cleanText(listingInput.notes),
    price: modality !== "loan" ? cleanNumber(listingInput.price) : null,
    original_price: cleanNumber(listingInput.original_price),
    rental_price: modality !== "sale" ? cleanNumber(listingInput.rental_price) : null,
    rental_deposit: modality !== "sale" ? cleanNumber(listingInput.rental_deposit) : null,
  };

  if (listingInput.cover_image_url !== undefined) {
    listingUpdates.cover_image_url = cleanText(listingInput.cover_image_url);
  }

  const { error: bookError } = await admin
    .from("books")
    .update(bookUpdates)
    .eq("id", listing.book_id);

  if (bookError) {
    return NextResponse.json({ error: bookError.message }, { status: 500 });
  }

  // Asegurar que tenga slug si no existe (retrocompatibilidad)
  if (!listing.slug) {
    const { slugify } = await import("@/lib/slugify");
    const baseSlug = slugify(bookUpdates.title || "libro");
    let slug = baseSlug;
    
    // Verificar unicidad básica
    const { count } = await admin
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("slug", baseSlug);
      
    if (count && count > 0) {
      slug = `${baseSlug}-${Math.random().toString(36).slice(-4)}`;
    }
    listingUpdates.slug = slug;
  }

  const { error: updateListingError } = await admin
    .from("listings")
    .update(listingUpdates)
    .eq("id", listing.id);

  if (updateListingError) {
    return NextResponse.json({ error: updateListingError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    book: bookUpdates,
    listing: listingUpdates,
  });
}
