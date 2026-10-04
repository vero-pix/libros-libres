"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EVENTO_REABRIR,
  guardarConsentimiento,
  leerConsentimiento,
} from "@/lib/consentimiento";

/**
 * Aviso de cookies (04-10-2026). Aparece hasta que la persona elige; las dos
 * opciones pesan lo mismo a propósito: la ley pide que decir que no sea igual
 * de fácil que decir que sí. Va sobre la barra fija de comprar del celular
 * (z-50) solo mientras no se elige.
 */
export default function AvisoCookies() {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (leerConsentimiento() === null) setAbierto(true);
    const reabrir = () => setAbierto(true);
    window.addEventListener(EVENTO_REABRIR, reabrir);
    return () => window.removeEventListener(EVENTO_REABRIR, reabrir);
  }, []);

  if (!abierto) return null;

  const elegir = (v: "todo" | "necesario") => {
    guardarConsentimiento(v);
    setAbierto(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Uso de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 animate-slide-up-full motion-reduce:animate-none"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-paper-card shadow-[0_-8px_24px_rgba(0,0,0,0.08)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        <p className="text-sm text-ink leading-relaxed flex-1">
          Uso cookies para que el sitio funcione y, si me dejas, para saber qué libros se buscan y
          mostrar anuncios que te calcen.{" "}
          <Link href="/privacidad#cookies" className="underline underline-offset-2 text-brand-600">
            Más info
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => elegir("necesario")}
            className="flex-1 sm:flex-none rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-cream transition-colors"
          >
            Solo lo necesario
          </button>
          <button
            type="button"
            onClick={() => elegir("todo")}
            className="flex-1 sm:flex-none rounded-full border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Enlace del pie para volver a elegir. */
export function PreferenciasCookies({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO_REABRIR))}
      className={className}
    >
      Preferencias de cookies
    </button>
  );
}
