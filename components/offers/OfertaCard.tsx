"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  MAX_CONTRAOFERTAS,
  clp,
  errorMontoContraoferta,
  estadoVigente,
  rangoContraoferta,
  type Oferta,
} from "@/lib/offers";

interface Props {
  oferta: Pick<Oferta, "id" | "listing_id" | "buyer_id" | "seller_id" | "amount" | "listing_price" | "status" | "expires_at" | "made_by" | "ronda">;
  /** Monto de la oferta anterior de la cadena (`parent_id`), para el rango de la contraoferta. */
  montoMadre?: number | null;
  currentUserId: string;
  /** Después de responder: recargar el hilo o la lista. */
  onRespondida?: () => void;
  /** En /mis-ventas y /mis-pedidos: título del libro y enlace a la conversación. */
  titulo?: string;
  conversationId?: string | null;
  /** Con quién se negocia, para las listas. */
  contraparte?: string | null;
  /** El vendedor cobra por MP o transferencia. Si no, el trato se cierra conversando. */
  puedePagarEnSitio?: boolean;
}

const ETIQUETAS: Record<string, { texto: string; clase: string }> = {
  accepted: { texto: "Aceptada", clase: "bg-green-100 text-green-800" },
  used: { texto: "Comprado", clase: "bg-green-100 text-green-800" },
  rejected: { texto: "No aceptada", clase: "bg-gray-100 text-gray-600" },
  expired: { texto: "Vencida", clase: "bg-gray-100 text-gray-600" },
  countered: { texto: "Contraofertada", clase: "bg-gray-100 text-gray-600" },
};

/**
 * Una oferta o contraoferta de precio, con su estado al día. Responde siempre
 * la parte que no la hizo (`made_by`): acepta, rechaza o propone otro precio.
 * Si quedó aceptada, el comprador ve el botón para comprar a ese precio.
 * Se usa en /mensajes (MessageThread), /mis-ventas y /mis-pedidos.
 */
export default function OfertaCard({
  oferta,
  montoMadre = null,
  currentUserId,
  onRespondida,
  titulo,
  conversationId,
  contraparte,
  puedePagarEnSitio = true,
}: Props) {
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contraAbierta, setContraAbierta] = useState(false);
  const [contraMonto, setContraMonto] = useState("");

  const hechaPorVendedor = oferta.made_by === "seller";
  const responde = hechaPorVendedor ? oferta.buyer_id : oferta.seller_id;
  const soyComprador = oferta.buyer_id === currentUserId;
  const estado = estadoVigente(oferta);
  const meToca = estado === "pending" && responde === currentUserId;
  const rebaja = Math.round((1 - oferta.amount / oferta.listing_price) * 100);
  const rango = rangoContraoferta(oferta, montoMadre);
  const puedeContraofertar = meToca && (oferta.ronda ?? 0) < MAX_CONTRAOFERTAS && rango.min <= rango.max;
  const esContra = (oferta.ronda ?? 0) > 0;

  async function responder(accion: "aceptar" | "rechazar" | "contraofertar") {
    let monto: number | undefined;
    if (accion === "contraofertar") {
      monto = Math.round(Number(contraMonto));
      const err = errorMontoContraoferta(monto, rango);
      if (err) return setError(err);
    }
    setEnviando(accion);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${oferta.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, monto }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "No se pudo guardar tu respuesta.");
      else {
        setContraAbierta(false);
        onRespondida?.();
      }
    } catch {
      setError("Error de conexión.");
    }
    setEnviando(null);
  }

  const e =
    estado === "pending"
      ? { texto: meToca ? "Te toca responder" : "Esperando respuesta", clase: "bg-amber-100 text-amber-800" }
      : ETIQUETAS[estado];

  return (
    <div className="w-full min-w-0 max-w-sm rounded-2xl border border-brand-200 bg-white p-4 shadow-sm animate-fade-up">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {esContra ? `↔️ Contraoferta${hechaPorVendedor ? " del vendedor" : " del comprador"}` : "🤝 Oferta"}
        </p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${e.clase}`}>{e.texto}</span>
      </div>
      {titulo && <p className="mt-1 truncate text-sm font-medium text-ink">{titulo}</p>}
      {contraparte && <p className="text-xs text-ink-muted">con {contraparte}</p>}
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold text-ink">{clp(oferta.amount)}</span>
        <span className="text-sm text-gray-400 line-through">{clp(oferta.listing_price)}</span>
        {rebaja > 0 && <span className="text-xs font-medium text-ink-muted">−{rebaja}%</span>}
      </p>

      {meToca && !contraAbierta && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={!!enviando} onClick={() => responder("aceptar")} className="flex-1">
            {enviando === "aceptar" ? "Aceptando…" : "Aceptar"}
          </Button>
          <Button size="sm" variant="outline" disabled={!!enviando} onClick={() => responder("rechazar")} className="flex-1">
            {enviando === "rechazar" ? "…" : "Rechazar"}
          </Button>
          {puedeContraofertar && (
            <Button size="sm" variant="ghost" disabled={!!enviando} onClick={() => setContraAbierta(true)} className="w-full">
              ↔️ Proponer otro precio
            </Button>
          )}
        </div>
      )}
      {meToca && contraAbierta && (
        <div className="mt-3 space-y-2 animate-fade-up">
          <p className="text-xs text-ink-muted">
            Entre {clp(rango.min - 1)} y {clp(rango.max + 1)}.
            {(oferta.ronda ?? 0) + 1 >= MAX_CONTRAOFERTAS && " Es la última contraoferta posible."}
          </p>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={contraMonto}
              onChange={(ev) => setContraMonto(ev.target.value.replace(/\D/g, ""))}
              placeholder={String(Math.round((rango.min + rango.max) / 2 / 100) * 100)}
              aria-label="Monto de tu contraoferta en pesos"
              className="w-full rounded-xl border border-gray-200 py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!!enviando || !contraMonto} onClick={() => responder("contraofertar")} className="flex-1">
              {enviando === "contraofertar" ? "Enviando…" : "Enviar contraoferta"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setContraAbierta(false)}>
              Volver
            </Button>
          </div>
        </div>
      )}
      {estado === "pending" && !meToca && (
        <p className="mt-2 text-xs text-ink-muted">Te aviso por correo apenas responda.</p>
      )}
      {estado === "accepted" && soyComprador && !puedePagarEnSitio && (
        <p className="mt-2 text-xs text-ink-muted">Acuerden acá el pago y la entrega.</p>
      )}
      {estado === "accepted" && soyComprador && puedePagarEnSitio && (
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
      {estado === "accepted" && !soyComprador && (
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
