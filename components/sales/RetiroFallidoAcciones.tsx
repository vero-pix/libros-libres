"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Accion = "reagendar" | "sucursal" | "cancelar";

/**
 * Las tres salidas cuando el retiro no se concretó (pieza B, 08-09-2026).
 * Ninguna obliga a escribirle a Vero: esa era justo la parte rota.
 * "No puedo despacharlo" cancela una venta pagada, así que pide confirmación.
 */
export default function RetiroFallidoAcciones({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState<Accion | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [listo, setListo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(accion: Accion) {
    setEnviando(accion);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/retiro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setListo(
        accion === "reagendar"
          ? "Pedí otro retiro. Lo coordino con Shipit y te aviso la ventana."
          : accion === "sucursal"
            ? "Listo: lleva el paquete con la misma etiqueta a la sucursal. Anulé el retiro."
            : "Cancelé la venta, le avisé al comprador y tu libro volvió a quedar publicado."
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo, inténtalo de nuevo");
    } finally {
      setEnviando(null);
    }
  }

  if (listo) return <span className="text-[11px] text-ink-muted block">{listo}</span>;

  const btn = "text-[11px] px-2 py-1 rounded-md border border-cream-dark/40 bg-cream-warm text-ink hover:bg-cream-dark/20 disabled:opacity-60";

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" disabled={!!enviando} onClick={() => ejecutar("reagendar")} className={btn}>
          {enviando === "reagendar" ? "Pidiendo…" : "🚚 Pedir otro retiro"}
        </button>
        <button type="button" disabled={!!enviando} onClick={() => ejecutar("sucursal")} className={btn}>
          {enviando === "sucursal" ? "Anulando…" : "📦 Lo dejo en sucursal"}
        </button>
        {confirmar ? (
          <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-ink-muted">¿Cancelo la venta y devuelvo la plata?</span>
            <button
              type="button"
              disabled={!!enviando}
              onClick={() => ejecutar("cancelar")}
              className="px-2 py-1 rounded-md bg-red-700 text-cream disabled:opacity-60"
            >
              {enviando === "cancelar" ? "Cancelando…" : "Sí, cancelar"}
            </button>
            <button type="button" onClick={() => setConfirmar(false)} className={btn}>
              No
            </button>
          </span>
        ) : (
          <button type="button" disabled={!!enviando} onClick={() => setConfirmar(true)} className={btn}>
            ✋ No puedo despacharlo
          </button>
        )}
      </div>
      {error && <span className="text-[11px] text-red-600 block">{error}</span>}
    </div>
  );
}
