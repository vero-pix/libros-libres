"use client";

import { useRouter } from "next/navigation";
import OfertaCard from "@/components/offers/OfertaCard";
import type { NegociacionVigente } from "@/lib/offers";

export type OfertaRecibida = NegociacionVigente;

/**
 * Lista de negociaciones vigentes: "Ofertas recibidas" en /mis-ventas y
 * "Mis ofertas" en /mis-pedidos. Solo la última oferta de cada cadena.
 */
export default function OfertasRecibidas({
  ofertas,
  currentUserId,
  titulo = "Ofertas recibidas",
}: {
  ofertas: OfertaRecibida[];
  currentUserId: string;
  titulo?: string;
}) {
  const router = useRouter();
  if (ofertas.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="font-display text-lg font-bold text-ink mb-4">{titulo} ({ofertas.length})</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {ofertas.map((o) => (
          <OfertaCard
            key={o.id}
            oferta={o}
            currentUserId={currentUserId}
            titulo={o.titulo}
            contraparte={o.contraparte}
            montoMadre={o.montoMadre}
            puedePagarEnSitio={o.puedePagarEnSitio ?? true}
            conversationId={o.conversation_id}
            onRespondida={() => router.refresh()}
          />
        ))}
      </div>
    </section>
  );
}
