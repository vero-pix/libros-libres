import { createPublicClient } from "@/lib/supabase/public";

export default async function AuthWantedList() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("book_requests")
    .select("title, author")
    .eq("fulfilled", false)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-ink/5">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-600 mb-4">
        La comunidad busca hoy:
      </p>
      <div className="space-y-4">
        {data.map((req, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-brand-200 flex items-center justify-center text-xs font-bold text-brand-600 shadow-sm">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink leading-tight line-clamp-1">
                {req.title}
              </p>
              <p className="text-[11px] text-ink-muted italic">
                {req.author || "Autor desconocido"}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[11px] text-ink-muted leading-relaxed">
        Si tienes alguno de estos, <span className="text-brand-600 font-bold">regístrate</span> y súbelo. Tenemos compradores esperando respuesta.
      </p>
    </div>
  );
}
