import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  requester_location: string | null;
  created_at: string;
}

export default async function RequestsRow() {
  const supabase = createPublicClient();
  const { data: requests } = await supabase
    .from("book_requests")
    .select("id, title, author, requester_location, created_at")
    .eq("fulfilled", false)
    .order("created_at", { ascending: false })
    .limit(8);

  if (!requests || requests.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-amber-50 via-cream-warm to-amber-100/60 border-y border-amber-200/60">
      <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
          {/* Left — concept */}
          <div className="max-w-sm">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-800">
                Economía inversa
              </span>
              <span className="text-[10px] font-medium text-amber-700/70">· nuevo</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink leading-tight mb-3">
              Se busca.{" "}
              <span className="italic text-amber-700">La comunidad pide.</span>
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed mb-4">
              Acá los compradores piden libros que no están en el catálogo. Si
              eres vendedor y tienes alguno, publícalo — hay un lector esperando.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/solicitudes"
                className="inline-flex items-center px-4 py-2 bg-amber-700 text-white text-xs font-semibold uppercase tracking-wider rounded-md hover:bg-amber-800 transition-colors"
              >
                Pedir un libro
              </Link>
              <Link
                href="/publish"
                className="inline-flex items-center px-4 py-2 bg-white border border-amber-700/40 text-amber-800 text-xs font-semibold uppercase tracking-wider rounded-md hover:border-amber-800 hover:bg-amber-50 transition-colors"
              >
                Publicar el mío
              </Link>
            </div>
          </div>

          {/* Right — list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(requests as BookRequest[]).map((r) => (
              <Link
                key={r.id}
                href={`/publish?title=${encodeURIComponent(r.title)}${r.author ? `&author=${encodeURIComponent(r.author)}` : ""}`}
                className="group bg-white/90 backdrop-blur rounded-xl border border-amber-200 hover:border-amber-500 hover:shadow-md p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5">
                    Se busca
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-ink leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
                      {r.title}
                    </p>
                    {r.author && (
                      <p className="text-xs text-ink-muted italic line-clamp-1 mt-0.5">
                        {r.author}
                      </p>
                    )}
                    {r.requester_location && (
                      <p className="text-[11px] text-amber-800 font-semibold mt-1.5 flex items-center gap-1">
                        <span aria-hidden>📍</span> {r.requester_location}
                      </p>
                    )}
                    <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider mt-2 group-hover:text-amber-900">
                      ¿Lo tienes? Publícalo →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
