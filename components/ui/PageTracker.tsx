"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

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

// Rutas que NO queremos trackear (paneles privados, auth, rutas técnicas).
// Todo lo demás va al analytics.
const EXCLUDE_PATTERNS = [
  /^\/api\//,
  /^\/admin/,
  /^\/mis-/,
  /^\/perfil/,
  /^\/mensajes/,
  /^\/login/,
  /^\/register/,
  /^\/forgot-password/,
  /^\/reset-password/,
  /^\/orders\//,
  /^\/libro\//, // Tracked by ListingViewTracker with correct listing_id
];

// /carrito y /checkout estuvieron excluidos hasta el 12 ago 2026 por miedo a
// guardar datos sensibles. El costo fue no poder responder "¿qué fuente
// COMPRA?": 30 días con 0 pageviews en los dos últimos pasos del embudo, o
// sea sabíamos qué canal pasea y ninguno cuál convierte.
//
// Se trackean, pero anonimizados: /checkout/<uuid> colapsa a /checkout y se
// descarta el query string, así el id de la orden nunca llega a page_views.
// /checkout/bundle se conserva aparte porque es un flujo distinto (varias
// órdenes, una preferencia) y conviene medirlo separado.
function normalizePath(pathname: string, pathWithSearch: string): string {
  if (pathname.startsWith("/checkout")) {
    return pathname === "/checkout/bundle" ? "/checkout/bundle" : "/checkout";
  }
  if (pathname.startsWith("/carrito")) return "/carrito";
  return pathWithSearch;
}

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    const search = window.location.search.replace(/^\?/, "");
    const pathWithSearch = search ? `${pathname}?${search}` : pathname;

    if (pathWithSearch === lastPath.current) return;
    lastPath.current = pathWithSearch;

    if (EXCLUDE_PATTERNS.some((re) => re.test(pathname))) return;

    const trackedPath = normalizePath(pathname, pathWithSearch);
    const isPrivateStep = trackedPath === "/carrito" || trackedPath.startsWith("/checkout");

    window.gtag?.("event", "page_view", {
      page_path: trackedPath,
      // En carrito/checkout la URL real lleva el id de la orden: mandamos el
      // path normalizado también acá para no filtrarlo a GA4.
      page_location: isPrivateStep
        ? `${window.location.origin}${trackedPath}`
        : window.location.href,
      page_title: document.title,
    });

    // Si entra a una ficha /listings/UUID, guardamos listing_id.
    // Para /libro/:username/:slug no tenemos UUID acá — el ID se resolverá
    // server-side si hace falta (o con join listings_slug → id más adelante).
    const listingMatch = pathname.match(/^\/listings\/([a-f0-9-]+)$/);
    const listing_id = listingMatch?.[1] ?? null;

    const data = JSON.stringify({
      path: trackedPath,
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
