import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  requester_location: string | null;
}

export default async function WantedBounty() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("book_requests")
    .select("id, title, author, requester_location")
    .eq("fulfilled", false)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm mb-8">
      <div className="px-4 py-3 bg-amber-100/50 border-b border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">La comunidad está buscando:</h3>
        </div>
        <Link href="/solicitudes" className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors">
          Ver todas &rarr;
        </Link>
      </div>
      <div className="divide-y divide-amber-100">
        {(data as BookRequest[]).map((req) => (
          <Link
            key={req.id}
            href={`/publish?title=${encodeURIComponent(req.title)}${req.author ? `&author=${encodeURIComponent(req.author)}` : ""}`}
            className="group flex items-center justify-between px-4 py-3 hover:bg-amber-100/30 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink leading-tight group-hover:text-amber-800 transition-colors line-clamp-1">
                {req.title}
              </p>
              <p className="text-xs text-ink-muted italic mt-0.5">
                {req.author || "Autor desconocido"}
              </p>
              {req.requester_location && (
                <p className="text-[10px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                  📍 {req.requester_location}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white border border-amber-200 text-amber-800 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all">
                Vender ahora
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="px-4 py-2 bg-amber-100/20 text-center">
        <p className="text-[10px] text-amber-700 font-medium italic">
          Si tienes alguno, súbelo — hay un comprador esperando.
        </p>
      </div>
    </div>
  );
}
