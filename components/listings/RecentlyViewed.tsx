"use client";

import BookCover from "@/components/listings/BookCover";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface RecentItem {
  id: string;
  slug?: string | null;
  title: string;
  cover_url: string | null;
  price: number | null;
  genre?: string | null;
  author?: string | null;
  seller_username?: string | null;
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
        {items.map((item) => {
          const itemUrl = item.slug && item.seller_username 
            ? `/libro/${item.seller_username}/${item.slug}`
            : `/listings/${item.id}`;

          return (
            <Link
              key={item.id}
              href={itemUrl}
              className="flex-shrink-0 w-28 group"
            >
            <BookCover
              title={item.title}
              author={item.author}
              coverUrl={item.cover_url}
              ratio="portrait"
              sizes="112px"
              className="bg-cream-warm rounded-lg"
              imageClassName="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
            <p className="text-xs text-ink font-medium mt-1.5 line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">
              {item.title}
            </p>
            {item.price != null && (
              <p className="text-xs font-bold text-ink-muted mt-0.5">
                ${item.price.toLocaleString("es-CL")}
              </p>
            )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
