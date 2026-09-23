"use client";

import { useRouter } from "next/navigation";
import OfertaCard from "@/components/offers/OfertaCard";
import type { Oferta } from "@/lib/offers";

export interface OfertaRecibida extends Oferta {
  titulo: string;
  compradorNombre: string | null;
}

/** "Ofertas recibidas" en /mis-ventas: las que esperan respuesta y las aceptadas vigentes. */
export default function OfertasRecibidas({ ofertas, currentUserId }: { ofertas: OfertaRecibida[]; currentUserId: string }) {
  const router = useRouter();
  if (ofertas.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="font-display text-lg font-bold text-ink mb-4">Ofertas recibidas ({ofertas.length})</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {ofertas.map((o) => (
          <OfertaCard
            key={o.id}
            oferta={o}
            currentUserId={currentUserId}
            titulo={o.titulo}
            compradorNombre={o.compradorNombre}
            conversationId={o.conversation_id}
            onRespondida={() => router.refresh()}
          />
        ))}
      </div>
    </section>
  );
}
