"use client";

import { useEffect, useRef } from "react";

interface Props {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

/**
 * Google AdSense ad slot component.
 * Set NEXT_PUBLIC_ADSENSE_CLIENT in env vars (e.g. "ca-pub-1234567890").
 * Each ad unit needs a unique slot ID from your AdSense account.
 */
export default function AdSlot({ slot, format = "auto", className = "" }: Props) {
  const adRef = useRef<HTMLModElement>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !adRef.current) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // Ad already loaded or blocker active
    }
  }, [client]);

  if (!client) {
    // No ad client configured — render nothing in production, placeholder in dev
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div className={`bg-cream-warm border border-dashed border-cream-dark/40 rounded-lg flex items-center justify-center text-xs text-ink-muted py-8 ${className}`}>
        Espacio publicitario
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle block ${className}`}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
