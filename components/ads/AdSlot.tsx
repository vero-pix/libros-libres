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
 */

import Script from "next/script";
import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (!CLIENT || !slot || empujado.current) return;
    empujado.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense bloqueado por el navegador: el hueco queda vacío y ya.
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;

  return (
    <div className={`my-12 ${className}`}>
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
