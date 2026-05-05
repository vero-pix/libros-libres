"use client";

import { useEffect } from "react";
import { trackEvent } from "@/utils/analytics";

interface Props {
  query?: string | null;
}

export default function SearchEventTracker({ query }: Props) {
  useEffect(() => {
    const cleanQuery = query?.trim();
    if (!cleanQuery) return;

    trackEvent("search", {
      query: cleanQuery,
    });
  }, [query]);

  return null;
}
