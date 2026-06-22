import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  requester_location: string | null;
}

// Tira "Se busca" estilo demo: navy, deslizante (marquee), con los últimos
// pedidos reales de la economía inversa. Linkea a /solicitudes.
export default async function HeroRequestStrip() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("book_requests")
    .select("id, title, author, requester_location")
    .eq("fulfilled", false)
    .order("created_at", { ascending: false })
    .limit(12);

  const reqs = (data as BookRequest[] | null) ?? [];
  if (reqs.length === 0) return null;

  // Duplicamos para que el marquee loopee sin cortes.
  const loop = [...reqs, ...reqs];

  return (
    <Link
      href="/solicitudes"
      className="group block bg-ink text-white border-b border-ink-deep/60 hover:brightness-110 transition-all"
      aria-label="Ver todos los libros que se buscan"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-9">
        {/* Etiqueta fija */}
        <span className="shrink-0 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-coral pr-3 sm:pr-4 mr-3 sm:mr-4 border-r border-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
          Se busca
        </span>

        {/* Marquee */}
        <div className="overflow-hidden flex-1">
          <div className="marquee-track flex items-center gap-7 w-max">
            {loop.map((r, i) => {
              const loc = r.requester_location?.trim();
              return (
                <span key={`${r.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-[13px]">
                  <span className="font-display italic text-white">«{r.title}»</span>
                  {r.author && <span className="text-white/55 hidden sm:inline">de {r.author}</span>}
                  {loc && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">— {loc}</span>
                  )}
                  <span aria-hidden className="text-coral/60">·</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Ver todo */}
        <span className="shrink-0 ml-3 sm:ml-4 pl-3 sm:pl-4 border-l border-white/15 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-white/80 group-hover:text-coral transition-colors whitespace-nowrap">
          Ver todo <span className="inline-block group-hover:translate-x-0.5 transition-transform">→</span>
        </span>
      </div>
    </Link>
  );
}
