"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_tl_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_tl_sid", sid);
  }
  return sid;
}

export default function ListingViewTracker({ listingId }: { listingId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    window.gtag?.("event", "page_view", {
      page_path: window.location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    });

    const data = JSON.stringify({
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      listing_id: listingId,
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
  }, [listingId]);

  return null;
}
