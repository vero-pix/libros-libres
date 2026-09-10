"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/listings/BookCover";
import { createClient } from "@/lib/supabase/client";
import type { ListingWithBook } from "@/types";
import { libroUrl } from "@/lib/urls";

export default function SellerOtherListings({ sellerId, sellerUsername, currentListingId }: { sellerId: string, sellerUsername?: string | null, currentListingId: string }) {
  const [others, setOthers] = useState<ListingWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOthers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("listings")
        .select(`*, book:books(*), seller:users(username)`)
        .eq("seller_id", sellerId)
        .neq("id", currentListingId)
        .eq("status", "active")
        .limit(4);
      
      if (data) setOthers(data as unknown as ListingWithBook[]);
      setLoading(false);
    }
    fetchOthers();
  }, [sellerId, currentListingId]);

  if (loading || others.length === 0) return null;

  return (
    <div className="mt-8 border-t border-gray-100 pt-8 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Aprovecha el envío</h3>
          <p className="text-xs text-ink-muted">Agrega otros libros de este vendedor y paga un solo despacho.</p>
        </div>
        <Link href={`/vendedor/${sellerUsername ?? sellerId}`} className="text-xs font-bold text-brand-600 hover:underline">
          Ver todo →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {others.map((l) => (
          <Link key={l.id} href={libroUrl(l)} className="group">
            <BookCover
              title={l.book.title}
              author={l.book.author}
              coverUrl={l.cover_image_url || l.book.cover_url}
              ratio="portrait"
              sizes="(max-width: 640px) 33vw, 160px"
              className="bg-cream rounded-xl border border-cream-dark/30 mb-2 group-hover:shadow-md transition-all"
            />
            <p className="text-xs font-bold text-ink line-clamp-1 group-hover:text-brand-600 transition-colors">{l.book.title}</p>
            <p className="text-[10px] font-bold text-brand-600 mt-0.5">${l.price?.toLocaleString("es-CL")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
