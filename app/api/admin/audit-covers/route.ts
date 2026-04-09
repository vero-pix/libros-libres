import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Audits books and listings with Open Library cover URLs.
 * Checks if the cover actually exists (HEAD with ?default=false).
 * Nullifies invalid covers so the UI shows a proper placeholder.
 */
export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = new URL(req.url).searchParams.get("seller_id");
  let sellerBookIds: string[] | null = null;
  let sellerListingIds: string[] | null = null;

  if (sellerId) {
    const { data: sellerListings } = await supabase.from("listings").select("id, book_id").eq("seller_id", sellerId).eq("status", "active");
    sellerBookIds = sellerListings?.map((l) => l.book_id) ?? [];
    sellerListingIds = sellerListings?.map((l) => l.id) ?? [];
    if (sellerBookIds.length === 0) return NextResponse.json({ scanned: 0, valid: 0, cleaned: 0, details: [] });
  }

  // Check books with Open Library ISBN-based covers
  let booksQ = supabase.from("books").select("id, isbn, cover_url").like("cover_url", "%covers.openlibrary.org/b/isbn%");
  if (sellerBookIds) booksQ = booksQ.in("id", sellerBookIds);
  const { data: books } = await booksQ;

  // Check listings with Open Library ISBN-based covers
  let listingsQ = supabase.from("listings").select("id, cover_image_url").like("cover_image_url", "%covers.openlibrary.org/b/isbn%");
  if (sellerListingIds) listingsQ = listingsQ.in("id", sellerListingIds);
  const { data: listings } = await listingsQ;

  // Also check Google Books covers that might 404
  let gBooksQ = supabase.from("books").select("id, isbn, cover_url").like("cover_url", "%books.google.com%");
  if (sellerBookIds) gBooksQ = gBooksQ.in("id", sellerBookIds);
  const { data: googleBooks } = await gBooksQ;

  let gListingsQ = supabase.from("listings").select("id, cover_image_url").like("cover_image_url", "%books.google.com%");
  if (sellerListingIds) gListingsQ = gListingsQ.in("id", sellerListingIds);
  const { data: googleListings } = await gListingsQ;

  let cleaned = 0;
  let valid = 0;
  const details: { type: string; id: string; url: string; result: string }[] = [];

  // Validate Open Library ISBN covers
  for (const book of books ?? []) {
    const testUrl = book.cover_url.replace(/-L\.jpg.*/, "-L.jpg?default=false");
    try {
      const res = await fetch(testUrl, { method: "HEAD" });
      if (!res.ok) {
        await supabase.from("books").update({ cover_url: null }).eq("id", book.id);
        details.push({ type: "book", id: book.id, url: book.cover_url, result: "removed" });
        cleaned++;
      } else {
        valid++;
      }
    } catch {
      await supabase.from("books").update({ cover_url: null }).eq("id", book.id);
      details.push({ type: "book", id: book.id, url: book.cover_url, result: "removed (fetch error)" });
      cleaned++;
    }
  }

  for (const listing of listings ?? []) {
    const testUrl = listing.cover_image_url.replace(/-L\.jpg.*/, "-L.jpg?default=false");
    try {
      const res = await fetch(testUrl, { method: "HEAD" });
      if (!res.ok) {
        await supabase.from("listings").update({ cover_image_url: null }).eq("id", listing.id);
        details.push({ type: "listing", id: listing.id, url: listing.cover_image_url, result: "removed" });
        cleaned++;
      } else {
        valid++;
      }
    } catch {
      await supabase.from("listings").update({ cover_image_url: null }).eq("id", listing.id);
      details.push({ type: "listing", id: listing.id, url: listing.cover_image_url, result: "removed (fetch error)" });
      cleaned++;
    }
  }

  // Validate Google Books covers
  for (const book of googleBooks ?? []) {
    try {
      const res = await fetch(book.cover_url, { method: "HEAD" });
      if (!res.ok) {
        await supabase.from("books").update({ cover_url: null }).eq("id", book.id);
        details.push({ type: "book", id: book.id, url: book.cover_url, result: "removed" });
        cleaned++;
      } else {
        valid++;
      }
    } catch {
      valid++; // Keep on fetch error for Google (might be transient)
    }
  }

  for (const listing of googleListings ?? []) {
    try {
      const res = await fetch(listing.cover_image_url, { method: "HEAD" });
      if (!res.ok) {
        await supabase.from("listings").update({ cover_image_url: null }).eq("id", listing.id);
        details.push({ type: "listing", id: listing.id, url: listing.cover_image_url, result: "removed" });
        cleaned++;
      } else {
        valid++;
      }
    } catch {
      valid++;
    }
  }

  return NextResponse.json({
    scanned: (books?.length ?? 0) + (listings?.length ?? 0) + (googleBooks?.length ?? 0) + (googleListings?.length ?? 0),
    valid,
    cleaned,
    details,
  });
}
