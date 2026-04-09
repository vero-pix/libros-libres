import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { slugify } from "@/lib/slugify";

interface Props {
  params: { id: string };
}

/**
 * Legacy URL redirect: /listings/[uuid] → /libro/[slug]
 * Permanent redirect (308) for SEO.
 */
export default async function ListingRedirect({ params }: Props) {
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("slug, book:books(title)")
    .eq("id", params.id)
    .single();

  if (!listing) {
    notFound();
  }

  // If listing has a slug, redirect to it
  if (listing.slug) {
    redirect(`/libro/${listing.slug}`);
  }

  // Fallback: generate slug on the fly and redirect
  const slug = slugify((listing.book as any)?.title ?? "libro");
  redirect(`/libro/${slug}`);
}
