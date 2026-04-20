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

// Rutas que NO queremos trackear (paneles privados, auth, checkout con datos
// sensibles, rutas técnicas). Todo lo demás va al analytics.
const EXCLUDE_PATTERNS = [
  /^\/api\//,
  /^\/admin/,
  /^\/mis-/,
  /^\/perfil/,
  /^\/mensajes/,
  /^\/carrito/,
  /^\/checkout/,
  /^\/login/,
  /^\/register/,
  /^\/forgot-password/,
  /^\/reset-password/,
  /^\/orders\//,
];

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    if (EXCLUDE_PATTERNS.some((re) => re.test(pathname))) return;

    // Si entra a una ficha /listings/UUID, guardamos listing_id.
    // Para /libro/:username/:slug no tenemos UUID acá — el ID se resolverá
    // server-side si hace falta (o con join listings_slug → id más adelante).
    const listingMatch = pathname.match(/^\/listings\/([a-f0-9-]+)$/);
    const listing_id = listingMatch?.[1] ?? null;

    const data = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      listing_id,
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
