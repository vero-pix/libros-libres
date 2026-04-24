"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { ListingWithBook } from "@/types";

export default function SellerOtherListings({ sellerId, currentListingId }: { sellerId: string, currentListingId: string }) {
  const [others, setOthers] = useState<ListingWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOthers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("listings")
        .select(`*, book:books(*)`)
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
        <Link href={`/vendedor/${sellerId}`} className="text-xs font-bold text-brand-600 hover:underline">
          Ver todo →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {others.map((l) => (
          <Link key={l.id} href={`/listings/${l.id}`} className="group">
            <div className="aspect-[3/4] relative bg-cream rounded-xl border border-cream-dark/30 overflow-hidden mb-2 group-hover:shadow-md transition-all">
              {l.book.cover_url ? (
                <Image src={l.book.cover_url} alt={l.book.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
              )}
            </div>
            <p className="text-xs font-bold text-ink line-clamp-1 group-hover:text-brand-600 transition-colors">{l.book.title}</p>
            <p className="text-[10px] font-bold text-brand-600 mt-0.5">${l.price?.toLocaleString("es-CL")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
