"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface RecentItem {
  id: string;
  title: string;
  cover_url: string | null;
  price: number | null;
  genre?: string | null;
  author?: string | null;
}

const STORAGE_KEY = "tuslibros_recently_viewed";

export function addRecentlyViewed(item: RecentItem) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items: RecentItem[] = raw ? JSON.parse(raw) : [];
    items = items.filter((i) => i.id !== item.id);
    items.unshift(item);
    items = items.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable
  }
}

export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setItems(JSON.parse(raw));
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mt-10 mb-6">
      <h2 className="font-display text-lg font-semibold text-ink mb-4">
        Vistos recientemente
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/listings/${item.id}`}
            className="flex-shrink-0 w-28 group"
          >
            <div className="relative aspect-[3/4] bg-cream-warm rounded-lg overflow-hidden">
              {item.cover_url ? (
                <Image
                  src={item.cover_url}
                  alt={item.title}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  sizes="112px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.331 0 4.473.89 6.074 2.356M12 6.042a8.968 8.968 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.356M12 6.042V20.356" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-ink font-medium mt-1.5 line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">
              {item.title}
            </p>
            {item.price != null && (
              <p className="text-xs font-bold text-ink-muted mt-0.5">
                ${item.price.toLocaleString("es-CL")}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
