"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * "Marcar entregado" (vendedor, entrega en persona) y "Lo recibí" (comprador,
 * courier). Los dos llaman a POST /api/orders/entregado; el servidor decide
 * quién puede. Con confirmación, porque desde la interfaz no hay vuelta atrás.
 */
export default function EntregadoButton({
  bundleId,
  label,
  pregunta,
  compact,
}: {
  bundleId: string;
  label: string;
  pregunta: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<"idle" | "confirm" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function marcar() {
    setEstado("sending");
    setError(null);
    try {
      const res = await fetch("/api/orders/entregado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle_id: bundleId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setEstado("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo marcar");
      setEstado("error");
    }
  }

  const base = compact
    ? "text-[11px] px-2 py-1 rounded-md"
    : "text-xs px-3 py-1.5 rounded-lg";

  if (estado === "done") {
    return <span className={`${base} bg-green-50 text-green-700 border border-green-200 inline-block`}>✅ Entregado</span>;
  }

  if (estado === "confirm" || estado === "sending") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className={compact ? "text-[11px] text-ink-muted" : "text-xs text-ink-muted"}>{pregunta}</span>
        <button
          type="button"
          disabled={estado === "sending"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            marcar();
          }}
          className={`${base} bg-ink text-cream hover:bg-ink/90 disabled:opacity-60`}
        >
          {estado === "sending" ? "Guardando…" : "Sí"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEstado("idle");
          }}
          className={`${base} bg-cream-warm text-ink border border-cream-dark/40`}
        >
          No
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEstado("confirm");
        }}
        className={`${base} bg-ink text-cream hover:bg-ink/90`}
      >
        {label}
      </button>
      {estado === "error" && error && <span className="text-[11px] text-red-600">{error}</span>}
    </span>
  );
}
