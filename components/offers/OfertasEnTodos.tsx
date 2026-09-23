"use client";

import { useState } from "react";
import { vendedorPuedeRecibirOfertas } from "@/lib/offers";
import { Button } from "@/components/ui/Button";

interface Props {
  mpConnected: boolean;
  /** Cuántas activas ya aceptan ofertas / cuántas activas hay. */
  activas: number;
  conOfertas: number;
  onCambio: (acepta: boolean) => void;
}

/**
 * Encender o apagar "Se aceptan ofertas" en todas las publicaciones activas de
 * una vez. Un vendedor con 200 libros no lo va a hacer de a uno (pedido pensando
 * en cimlibros, 23-09-2026).
 */
export default function OfertasEnTodos({ mpConnected, activas, conOfertas, onCambio }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const habilitado = vendedorPuedeRecibirOfertas(mpConnected);
  const todas = activas > 0 && conOfertas >= activas;

  if (activas === 0) return null;

  async function cambiar(acepta: boolean) {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/listings/acepta-ofertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acepta }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "No se pudo guardar.");
      else onCambio(acepta);
    } catch {
      setError("Error de conexión.");
    }
    setGuardando(false);
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center animate-fade-up ${
        habilitado ? "border-brand-100 bg-white" : "border-amber-200 bg-amber-50/60"
      }`}
    >
      <div className="flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
          🤝 Ofertas de precio
          {!habilitado && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              Solo con MercadoPago
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
          {!habilitado
            ? "Conecta MercadoPago y tus compradores te podrán proponer un precio."
            : conOfertas === 0
              ? "Deja que los compradores te propongan un precio. Tú aceptas o rechazas cada oferta."
              : `${conOfertas} de ${activas} libros activos aceptan ofertas.`}
          {habilitado && !mpConnected && " Gratis para todos hasta el 30 de septiembre; después, solo con MercadoPago."}
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      {habilitado ? (
        <Button
          size="sm"
          variant={todas ? "outline" : "primary"}
          disabled={guardando}
          onClick={() => cambiar(!todas)}
          className="shrink-0"
        >
          {guardando ? "Guardando…" : todas ? "Dejar de aceptar ofertas" : "Aceptar ofertas en todos mis libros"}
        </Button>
      ) : (
        // Enlace plano y no <Link>: /api/auth/mercadopago redirige afuera.
        <a href="/api/auth/mercadopago" className="shrink-0 inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
          Conectar MercadoPago
        </a>
      )}
    </div>
  );
}
