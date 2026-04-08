import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Audits books and listings with Open Library cover URLs.
 * Checks if the cover actually exists (HEAD with ?default=false).
 * Nullifies invalid covers so the UI shows a proper placeholder.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check books with Open Library ISBN-based covers
  const { data: books } = await supabase
    .from("books")
    .select("id, isbn, cover_url")
    .like("cover_url", "%covers.openlibrary.org/b/isbn%");

  // Check listings with Open Library ISBN-based covers
  const { data: listings } = await supabase
    .from("listings")
    .select("id, cover_image_url")
    .like("cover_image_url", "%covers.openlibrary.org/b/isbn%");

  // Also check Google Books covers that might 404
  const { data: googleBooks } = await supabase
    .from("books")
    .select("id, isbn, cover_url")
    .like("cover_url", "%books.google.com%");

  const { data: googleListings } = await supabase
    .from("listings")
    .select("id, cover_image_url")
    .like("cover_image_url", "%books.google.com%");

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
