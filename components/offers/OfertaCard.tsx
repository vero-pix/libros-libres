"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import { clp, estadoVigente, type Oferta } from "@/lib/offers";

interface Props {
  oferta: Pick<Oferta, "id" | "listing_id" | "buyer_id" | "seller_id" | "amount" | "listing_price" | "status" | "expires_at">;
  currentUserId: string;
  /** Después de aceptar o rechazar: recargar el hilo o la lista. */
  onRespondida?: () => void;
  /** En /mis-ventas: título del libro y enlace a la conversación. */
  titulo?: string;
  conversationId?: string | null;
  compradorNombre?: string | null;
  /** El vendedor cobra por MP o transferencia. Si no, el trato se cierra conversando. */
  puedePagarEnSitio?: boolean;
}

/**
 * Una oferta de precio, con su estado al día. El vendedor la acepta o rechaza
 * acá; el comprador ve en qué va y, si la aceptaron, el botón para comprar.
 * Se usa en /mensajes (MessageThread) y en /mis-ventas.
 */
export default function OfertaCard({ oferta, currentUserId, onRespondida, titulo, conversationId, compradorNombre, puedePagarEnSitio = true }: Props) {
  const [enviando, setEnviando] = useState<"aceptar" | "rechazar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const esVendedor = oferta.seller_id === currentUserId;
  const estado = estadoVigente(oferta);
  const rebaja = Math.round((1 - oferta.amount / oferta.listing_price) * 100);

  async function responder(accion: "aceptar" | "rechazar") {
    setEnviando(accion);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${oferta.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "No se pudo guardar tu respuesta.");
      else onRespondida?.();
    } catch {
      setError("Error de conexión.");
    }
    setEnviando(null);
  }

  const etiqueta: Record<string, { texto: string; clase: string }> = {
    pending: { texto: esVendedor ? "Esperando tu respuesta" : "Esperando respuesta", clase: "bg-amber-100 text-amber-800" },
    accepted: { texto: "Aceptada", clase: "bg-green-100 text-green-800" },
    used: { texto: "Comprado", clase: "bg-green-100 text-green-800" },
    rejected: { texto: "No aceptada", clase: "bg-gray-100 text-gray-600" },
    expired: { texto: "Vencida", clase: "bg-gray-100 text-gray-600" },
  };
  const e = etiqueta[estado];

  return (
    <div className="w-full max-w-sm rounded-2xl border border-brand-200 bg-white p-4 shadow-sm animate-fade-up">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">🤝 Oferta</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${e.clase}`}>{e.texto}</span>
      </div>
      {titulo && <p className="mt-1 truncate text-sm font-medium text-ink">{titulo}</p>}
      {compradorNombre && <p className="text-xs text-ink-muted">de {compradorNombre}</p>}
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold text-ink">{clp(oferta.amount)}</span>
        <span className="text-sm text-gray-400 line-through">{clp(oferta.listing_price)}</span>
        {rebaja > 0 && <span className="text-xs font-medium text-ink-muted">−{rebaja}%</span>}
      </p>

      {estado === "pending" && esVendedor && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={!!enviando} onClick={() => responder("aceptar")} className="flex-1">
            {enviando === "aceptar" ? "Aceptando…" : "Aceptar"}
          </Button>
          <Button size="sm" variant="outline" disabled={!!enviando} onClick={() => responder("rechazar")} className="flex-1">
            {enviando === "rechazar" ? "…" : "Rechazar"}
          </Button>
        </div>
      )}
      {estado === "pending" && esVendedor && (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
          ¿Ni sí ni no? Contesta por mensaje con tu precio.
        </p>
      )}
      {estado === "pending" && !esVendedor && (
        <p className="mt-2 text-xs text-ink-muted">Te aviso por correo apenas responda.</p>
      )}
      {estado === "accepted" && !esVendedor && !puedePagarEnSitio && (
        <p className="mt-2 text-xs text-ink-muted">Acuerden acá el pago y la entrega.</p>
      )}
      {estado === "accepted" && !esVendedor && puedePagarEnSitio && (
        <div className="mt-3">
          <ButtonLink href={`/checkout/${oferta.listing_id}`} size="sm" variant="coral" fullWidth>
            Comprar a {clp(oferta.amount)}
          </ButtonLink>
          <p className="mt-1.5 text-[11px] text-ink-muted">
            Precio reservado hasta el{" "}
            {new Date(oferta.expires_at).toLocaleString("es-CL", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
      {estado === "accepted" && esVendedor && (
        <p className="mt-2 text-xs text-ink-muted">Si paga dentro del plazo, la venta te llega como siempre en Mis Ventas.</p>
      )}
      {conversationId && (
        <Link href={`/mensajes/${conversationId}`} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">
          Ver conversación →
        </Link>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
