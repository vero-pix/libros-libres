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

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Extract listing_id if on a listing page
    const listingMatch = pathname.match(/^\/listings\/([a-f0-9-]+)$/);
    const listing_id = listingMatch?.[1] || null;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        listing_id,
        session_id: getSessionId(),
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
