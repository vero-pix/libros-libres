"use client";

/**
 * Bloque de AdSense. Decisiones deliberadas (09-09-2026):
 *
 * - Se renderiza SOLO si existen el client id y el slot. Sin eso devuelve null,
 *   así el sitio nunca muestra el recuadro vacío de un anuncio sin aprobar
 *   (fue lo que pasó en abril 2026 y obligó a borrar el componente entero).
 * - `strategy="lazyOnload"` y `minHeight` fijo: el script entra después del
 *   window load y el hueco ya está reservado. La ficha subió de 62 a 89 en
 *   Core Web Vitals el 04-09-2026 y no vale la pena devolver ese punto.
 * - Nunca montar esto por encima del botón de comprar. La fuga hacia afuera
 *   ya es el problema del negocio; no se le agrega una salida más arriba.
 * - Si Google no tiene anuncio que servir, o el visitante trae bloqueador,
 *   el bloque entero desaparece. Sin esto queda un hueco de 280px con la
 *   palabra "Publicidad" flotando arriba, que es peor que no tener anuncios.
 */

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { getVisitorId } from "@/lib/visitorId";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function AdSlot({
  slot,
  className = "",
  minHeight = 280,
}: {
  slot: string | undefined;
  className?: string;
  minHeight?: number;
}) {
  const empujado = useRef(false);
  const ins = useRef<HTMLModElement>(null);
  const [vacio, setVacio] = useState(false);

  useEffect(() => {
    if (!CLIENT || !slot || empujado.current) return;
    empujado.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense bloqueado por el navegador.
      setVacio(true);
      return;
    }

    // AdSense marca el <ins> con data-ad-status="unfilled" cuando no tiene
    // nada que mostrar. Ahi escondemos el bloque completo.
    const nodo = ins.current;
    if (!nodo) return;
    const observador = new MutationObserver(() => {
      if (nodo.getAttribute("data-ad-status") === "unfilled") setVacio(true);
    });
    observador.observe(nodo, { attributes: true, attributeFilter: ["data-ad-status"] });

    // Si a los 8 segundos el script ni siquiera pinto el <ins>, no llego.
    const reloj = setTimeout(() => {
      if (!nodo.getAttribute("data-ad-status")) setVacio(true);
    }, 8000);

    // ── Medición del experimento (11-09-2026) ──────────────────────────────
    // Google no dice quién hizo clic en un anuncio. El truco estándar: cuando
    // la ventana pierde el foco y el elemento activo es el iframe del bloque,
    // el clic fue en el anuncio. Se manda con sendBeacon porque la pestaña se
    // está yendo y un fetch normal se cancelaría a medio camino.
    let avisado = false;
    const alPerderFoco = () => {
      if (avisado) return;
      const activo = document.activeElement;
      if (!activo || activo.tagName !== "IFRAME") return;
      if (!nodo.contains(activo)) return;
      avisado = true;
      const vid = getVisitorId();
      if (!vid) return; // almacenamiento bloqueado: no se mide, no se rompe nada
      let sid: string | null = null;
      try {
        sid = sessionStorage.getItem("_tl_sid");
      } catch {
        sid = null;
      }
      const cuerpo = JSON.stringify({
        visitor_id: vid,
        session_id: sid,
        path: window.location.pathname,
        slot,
      });
      try {
        navigator.sendBeacon("/api/ads/exit", new Blob([cuerpo], { type: "application/json" }));
      } catch {
        // Si sendBeacon no está, se pierde el registro. No vale interrumpir la salida.
      }
    };
    window.addEventListener("blur", alPerderFoco);

    return () => {
      observador.disconnect();
      clearTimeout(reloj);
      window.removeEventListener("blur", alPerderFoco);
    };
  }, [slot]);

  if (!CLIENT || !slot) return null;

  return (
    <div className={`my-12 ${className}`} hidden={vacio}>
      <Script
        id="adsbygoogle-init"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <p className="mb-2 text-center font-sans text-[11px] uppercase tracking-[0.18em] text-ink-muted/60">
        Publicidad
      </p>
      <div
        className="overflow-hidden rounded-2xl border border-cream-dark bg-white/60 transition-colors duration-500"
        style={{ minHeight }}
      >
        <ins
          ref={ins}
          className="adsbygoogle block"
          style={{ display: "block", minHeight }}
          data-ad-client={CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
