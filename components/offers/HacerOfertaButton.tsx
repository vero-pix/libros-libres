"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/utils/analytics";
import { clp, errorMontoOferta, estadoVigente, montoMinimo, type Oferta } from "@/lib/offers";

interface Props {
  listingId: string;
  price: number;
  sellerName: string;
  bookTitle: string;
}

/** Lo dispara el enlace de la barra fija del celular para abrir el formulario. */
export const EVENTO_ABRIR_OFERTA = "abrir-oferta";

/**
 * "Hacer oferta" en la ficha (lib/offers.ts). Solo se monta si el vendedor
 * marcó "Se aceptan ofertas". Si el comprador ya ofertó por este libro, en vez
 * del formulario muestra en qué va su oferta.
 */
export default function HacerOfertaButton({ listingId, price, sellerName, bookTitle }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previa, setPrevia] = useState<(Oferta & { conversation_id: string | null }) | null>(null);
  const caja = useRef<HTMLDivElement>(null);

  // El enlace "o haz una oferta" de la barra fija del celular (ListingDetail)
  // abre el formulario y baja hasta acá. Un evento y no un prop: la barra y este
  // botón viven en ramas distintas de la ficha.
  useEffect(() => {
    function abrir() {
      setAbierto(true);
      requestAnimationFrame(() => caja.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    window.addEventListener(EVENTO_ABRIR_OFERTA, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_OFERTA, abrir);
  }, []);

  useEffect(() => {
    fetch(`/api/offers?listing_id=${listingId}`)
      .then((r) => (r.ok ? r.json() : { offer: null }))
      .then((d) => setPrevia(d.offer))
      .catch(() => {});
  }, [listingId]);

  const sugerida = Math.round((price * 0.9) / 500) * 500;
  const minimo = montoMinimo(price);
  const estadoPrevia = previa ? estadoVigente(previa) : null;

  if (previa && estadoPrevia === "pending" && previa.made_by === "seller") {
    return (
      <div ref={caja} className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-ink animate-fade-up">
        ↔️ {sellerName} te propone <strong>{clp(previa.amount)}</strong>.{" "}
        {previa.conversation_id && (
          <Link href={`/mensajes/${previa.conversation_id}`} className="font-semibold text-brand-700 underline">Responder</Link>
        )}
      </div>
    );
  }
  if (previa && estadoPrevia === "pending") {
    return (
      <div ref={caja} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 animate-fade-up">
        🤝 Le ofreciste <strong>{clp(previa.amount)}</strong> a {sellerName}. Te aviso por correo apenas responda.
        {previa.conversation_id && (
          <Link href={`/mensajes/${previa.conversation_id}`} className="ml-1 font-semibold underline">Ver conversación</Link>
        )}
      </div>
    );
  }
  if (previa && estadoPrevia === "accepted") {
    return (
      <div ref={caja} className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 animate-fade-up">
        🎉 {sellerName} aceptó tu oferta: <strong>{clp(Math.min(previa.amount, price))}</strong>. Al comprar
        se te cobra ese precio, hasta el{" "}
        {new Date(previa.expires_at).toLocaleString("es-CL", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
      </div>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const n = Math.round(Number(monto.replace(/\D/g, "")));
    const err = errorMontoOferta(n, price);
    if (err) return setError(err);
    setEnviando(true);
    setError(null);
    trackEvent("offer_submit", { listing_id: listingId, book_title: bookTitle, amount: n, price });
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, amount: n, mensaje: nota }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "No pudimos enviar tu oferta.");
      } else {
        router.push(`/mensajes/${data.conversation_id}`);
        return;
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setEnviando(false);
  }

  if (!abierto) {
    return (
      <div ref={caja}>
      <Button
        variant="outline"
        fullWidth
        onClick={() => {
          setAbierto(true);
          trackEvent("offer_open", { listing_id: listingId, book_title: bookTitle });
        }}
      >
        🤝 Hacer una oferta
      </Button>
      </div>
    );
  }

  return (
    <div ref={caja}>
    <form onSubmit={enviar} className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4 animate-fade-up">
      <div>
        <p className="font-display text-base font-bold text-ink">¿Cuánto ofreces?</p>
        <p className="text-xs text-ink-muted">
          Está a {clp(price)}. {sellerName} decide si acepta; si dice que sí, lo compras a tu precio.
        </p>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-gray-400">$</span>
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={monto}
          onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
          placeholder={sugerida.toLocaleString("es-CL")}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-7 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          aria-label="Monto de tu oferta en pesos"
        />
      </div>
      <p className="text-[11px] text-ink-muted">Desde {clp(minimo)}.</p>
      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Un mensaje para el vendedor (opcional)"
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={enviando || !monto} className="flex-1">
          {enviando ? "Enviando…" : "Enviar oferta"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
    </div>
  );
}
