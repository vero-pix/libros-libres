"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { RecentItem } from "./RecentlyViewed";

const STORAGE_KEY = "tuslibros_recently_viewed";

interface RecommendedListing {
  id: string;
  slug: string | null;
  price: number | null;
  cover_image_url: string | null;
  book: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
    genre: string | null;
  };
  seller: {
    id: string;
    full_name: string | null;
    mercadopago_user_id?: string | null;
  } | null;
}

export default function Recommendations() {
  const [listings, setListings] = useState<RecommendedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const items: RecentItem[] = raw ? JSON.parse(raw) : [];

        const params = new URLSearchParams();

        const genres = Array.from(
          new Set(items.map((i) => i.genre).filter(Boolean) as string[])
        );
        const authors = Array.from(
          new Set(items.map((i) => i.author).filter(Boolean) as string[])
        );
        const ids = items.map((i) => i.id);

        if (genres.length > 0) params.set("genres", genres.join(","));
        if (authors.length > 0) params.set("authors", authors.join(","));
        if (ids.length > 0) params.set("exclude", ids.join(","));

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  if (loading || listings.length === 0) return null;

  return (
    <section className="mt-10 mb-6">
      <h2 className="font-display text-lg font-semibold text-ink mb-4">
        Te podría interesar
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5">
        {listings.map((listing) => {
          const coverUrl = listing.cover_image_url ?? listing.book.cover_url;
          return (
            <Link
              key={listing.id}
              href={listing.slug ? `/libro/${listing.slug}` : `/listings/${listing.id}`}
              className="group bg-white overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[3/4] bg-cream-warm flex items-center justify-center overflow-hidden">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={listing.book.title}
                    fill
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-50 to-cream-warm flex flex-col items-center justify-center gap-2 p-4">
                    <svg
                      className="w-10 h-10 text-brand-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356"
                      />
                    </svg>
                    <span className="text-[10px] text-brand-400 font-medium text-center leading-tight">
                      {listing.book.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-display text-sm font-semibold text-ink leading-tight line-clamp-2 group-hover:text-brand-700 transition-colors">
                  {listing.book.title}
                </h3>
                {listing.book.author && (
                  <p className="text-xs text-ink-muted mt-1 truncate">
                    {listing.book.author}
                  </p>
                )}
                {listing.price != null && (
                  <p className="font-semibold text-ink text-base mt-2 tracking-tight">
                    ${listing.price.toLocaleString("es-CL")}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
