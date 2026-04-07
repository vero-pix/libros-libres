"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_tl_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_tl_sid", sid);
  }
  return sid;
}

/**
 * Lightweight page tracker.
 * Only tracks listing views (for "libros más vistos" and seller analytics).
 * General traffic (pageviews, browsers, OS) is handled by Vercel Analytics.
 */
export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Only track listing detail pages and home
    const listingMatch = pathname.match(/^\/listings\/([a-f0-9-]+)$/);
    const isHome = pathname === "/";
    const isSearch = pathname === "/search";

    if (!listingMatch && !isHome && !isSearch) return;

    const data = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      listing_id: listingMatch?.[1] || null,
      session_id: getSessionId(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([data], { type: "application/json" }));
    } else {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
