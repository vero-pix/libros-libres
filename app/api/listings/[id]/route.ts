import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { vendedorPuedeRecibirOfertas } from "@/lib/offers";
import { cobraDentroDelSitio } from "@/lib/cobro-transferencia";
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
    .select("id, book_id, seller_id, slug, book:books(title, author)")
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

  // Solo si viene: el formulario de edición lo manda siempre, pero otros
  // clientes de esta ruta (admin, API v1) no lo conocen y no deben apagarlo.
  if (typeof listingInput.acepta_ofertas === "boolean") {
    let acepta = listingInput.acepta_ofertas;
    if (acepta) {
      const { data: vendedor } = await admin
        .from("users")
        .select("mercadopago_user_id")
        .eq("id", listing.seller_id)
        .maybeSingle();
      // Desde el 1 de octubre, sin MercadoPago ni transferencia no se puede encender (lib/offers.ts).
      acepta = vendedorPuedeRecibirOfertas(
        await cobraDentroDelSitio(listing.seller_id, !!vendedor?.mercadopago_user_id)
      );
    }
    listingUpdates.acepta_ofertas = acepta;
  }

  if (listingInput.cover_image_url !== undefined) {
    listingUpdates.cover_image_url = cleanText(listingInput.cover_image_url);
  }

  // La ficha de `books` se comparte entre vendedores cuando coinciden ISBN,
  // título y autor (ver fichaCoincide() en PublishForm). Editar acá el título
  // se lo cambiaba también al libro del otro, sin que se enterara. Si la ficha
  // es compartida, este vendedor se lleva una copia propia y el otro queda con
  // la suya intacta. (21-09-2026)
  const { data: otrosDuenos } = await admin
    .from("listings")
    .select("id")
    .eq("book_id", listing.book_id)
    .neq("seller_id", listing.seller_id)
    .limit(1);

  if (otrosDuenos?.length) {
    const { data: original } = await admin
      .from("books")
      .select("*")
      .eq("id", listing.book_id)
      .single();

    const { id: _descartado, created_at: _tambien, ...resto } = (original ?? {}) as any;
    const { data: copia, error: copiaError } = await admin
      .from("books")
      .insert({ ...resto, ...bookUpdates, created_by: listing.seller_id })
      .select("id")
      .single();

    if (copiaError) {
      return NextResponse.json({ error: copiaError.message }, { status: 500 });
    }
    listingUpdates.book_id = copia.id;
  } else {
    const { error: bookError } = await admin
      .from("books")
      .update(bookUpdates)
      .eq("id", listing.book_id);

    if (bookError) {
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }
  }

  // El slug sale del título, así que si el título cambia la URL tiene que
  // seguirlo: hasta el 21-09-2026 se regeneraba SOLO cuando faltaba, y quien
  // corregía un título quedaba con una URL que nombraba otro libro. El slug
  // anterior se guarda para redirigir 301 desde los enlaces ya compartidos
  // (ver la ficha en app/(main)/libro/[username]/[slug]/page.tsx).
  const { slugListing, slugUnicoParaVendedor } = await import("@/lib/slugify");
  const base = slugListing(bookUpdates.title || "libro", bookUpdates.author);
  // `slug-2`, `slug-3`… son el mismo slug con desempate: no hay que tocarlos.
  const yaEsEseSlug = !!listing.slug && new RegExp(`^${base}(-\\d+)?$`).test(listing.slug);

  if (!yaEsEseSlug) {
    const nuevoSlug = await slugUnicoParaVendedor(admin, listing.seller_id, base);
    if (nuevoSlug !== listing.slug) {
      listingUpdates.slug = nuevoSlug;
      if (listing.slug) {
        // Si el insert falla (slug ya archivado) no se cae la edición: lo peor
        // que pasa es que ese enlace viejo no redirija.
        await admin
          .from("listing_slug_history")
          .insert({ listing_id: listing.id, slug: listing.slug });
      }
    }
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
