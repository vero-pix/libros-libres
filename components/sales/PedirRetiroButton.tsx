"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** "Pedir retiro a domicilio" (D7 revisada): dispara gong a Vero, no llama a Shipit. */
export default function PedirRetiroButton({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"idle" | "confirm" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function pedir() {
    setEstado("sending");
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/pickup`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setEstado("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo pedir el retiro");
      setEstado("error");
    }
  }

  if (estado === "done") {
    return <span className="text-[11px] text-ink-muted block">Retiro pedido. Vero lo coordina con Shipit y te avisa la ventana.</span>;
  }
  if (estado === "confirm" || estado === "sending") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-ink-muted">¿Pasan a buscarlo a tu dirección?</span>
        <button type="button" disabled={estado === "sending"} onClick={pedir} className="px-2 py-1 rounded-md bg-ink text-cream disabled:opacity-60">
          {estado === "sending" ? "Pidiendo…" : "Sí"}
        </button>
        <button type="button" onClick={() => setEstado("idle")} className="px-2 py-1 rounded-md border border-cream-dark/40 bg-cream-warm text-ink">
          No
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => setEstado("confirm")} className="text-[11px] px-2 py-1 rounded-md border border-cream-dark/40 bg-cream-warm text-ink hover:bg-cream-dark/20">
        🚚 Pedir retiro a domicilio
      </button>
      {estado === "error" && error && <span className="text-[11px] text-red-600">{error}</span>}
    </span>
  );
}
