"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COURIERS_COORDINADO } from "@/lib/shipping/coordinado";

/**
 * Despacho coordinado: el vendedor ya dejó el paquete en la sucursal y registra
 * con qué courier y con qué número de seguimiento. Llama a
 * POST /api/orders/despacho-coordinado, que le avisa al comprador.
 */
export default function DespachoCoordinadoForm({ bundleId }: { bundleId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [courier, setCourier] = useState<string>("starken");
  const [tracking, setTracking] = useState("");
  const [estado, setEstado] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (tracking.trim().length < 4) {
      setError("Escribe el número de seguimiento que te dieron en la sucursal.");
      setEstado("error");
      return;
    }
    setEstado("sending");
    setError(null);
    try {
      const res = await fetch("/api/orders/despacho-coordinado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle_id: bundleId, courier, tracking: tracking.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setEstado("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
      setEstado("error");
    }
  }

  if (estado === "done") {
    return (
      <span className="text-[11px] px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 inline-block">
        ✅ Despacho registrado
      </span>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-[11px] px-2 py-1 rounded-md bg-ink text-cream hover:bg-ink/90"
      >
        Ya lo despaché
      </button>
    );
  }

  return (
    <div className="space-y-1.5 animate-fade-in">
      <select
        value={courier}
        onChange={(e) => setCourier(e.target.value)}
        className="w-full text-[11px] border border-cream-dark/40 rounded-md px-2 py-1 bg-white"
        aria-label="Courier"
      >
        {COURIERS_COORDINADO.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="N° de seguimiento"
        className="w-full text-[11px] border border-cream-dark/40 rounded-md px-2 py-1 bg-white font-mono"
        aria-label="Número de seguimiento"
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={estado === "sending"}
          onClick={guardar}
          className="text-[11px] px-2 py-1 rounded-md bg-ink text-cream hover:bg-ink/90 disabled:opacity-60"
        >
          {estado === "sending" ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-[11px] px-2 py-1 rounded-md bg-cream-warm text-ink border border-cream-dark/40"
        >
          Cancelar
        </button>
      </div>
      {estado === "error" && error && <span className="text-[11px] text-red-600 block">{error}</span>}
    </div>
  );
}
