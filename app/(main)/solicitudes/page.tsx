import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import RequestForm from "./RequestForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Se busca · Pide un libro que no está en el catálogo — tuslibros.cl",
  description:
    "¿Buscas un libro que no está en tuslibros.cl? Pídelo acá. Los vendedores ven la demanda y publican los libros que tienen. Economía inversa.",
};

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  notes: string | null;
  requester_location: string | null;
  fulfilled: boolean;
  created_at: string;
}

export default async function SolicitudesPage() {
  const supabase = createPublicClient();
  const { data: requests } = await supabase
    .from("book_requests")
    .select("id, title, author, notes, requester_location, fulfilled, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  // Si hay usuario logueado con ciudad, ordenar primero las solicitudes
  // cuyo requester_location matchee (proximidad = venta probable).
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  let viewerCity: string | null = null;
  if (user) {
    const { data: profile } = await sessionClient
      .from("users")
      .select("city")
      .eq("id", user.id)
      .maybeSingle();
    viewerCity = (profile?.city ?? "").trim().toLowerCase() || null;
  }

  const all = (requests ?? []) as BookRequest[];
  const rankByProximity = (list: BookRequest[]) => {
    if (!viewerCity) return list;
    const tokens = viewerCity.split(/[\s,]+/).filter((t) => t.length >= 3);
    const score = (r: BookRequest) => {
      const loc = (r.requester_location ?? "").toLowerCase();
      if (!loc) return 0;
      if (loc.includes(viewerCity)) return 2;
      if (tokens.some((t) => loc.includes(t))) return 1;
      return 0;
    };
    return [...list].sort((a, b) => score(b) - score(a));
  };

  const open = rankByProximity(all.filter((r) => !r.fulfilled));
  const fulfilled = all.filter((r) => r.fulfilled);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-cream-warm to-cream">
      <header className="max-w-5xl mx-auto px-6 pt-14 pb-8">
        <p className="text-[11px] uppercase tracking-[0.35em] font-bold text-amber-800 mb-3">
          Economía inversa
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink leading-[1.05] mb-4">
          Se busca.{" "}
          <span className="italic text-amber-700">La comunidad pide.</span>
        </h1>
        <p className="text-base text-ink-muted leading-relaxed max-w-2xl">
          En un marketplace normal, los vendedores publican y los compradores
          buscan. Acá también funciona al revés: los compradores piden libros
          que no están en el catálogo, y los vendedores que los tienen
          descubren que hay un lector esperando.
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16 space-y-10">
        {/* FORM */}
        <section className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ink mb-2">
            ¿Buscas un libro?
          </h2>
          <p className="text-sm text-ink-muted mb-6">
            Déjanos el título. Si un vendedor lo tiene, lo va a publicar y te
            avisamos. Tus datos de contacto son privados.
          </p>
          <RequestForm />
        </section>

        {/* OPEN LIST */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-2xl text-ink">
              Libros que se están buscando
            </h2>
            <span className="text-xs text-ink-muted">
              {open.length} {open.length === 1 ? "solicitud" : "solicitudes"}
            </span>
          </div>

          {open.length === 0 ? (
            <div className="bg-white rounded-xl border border-cream-dark/40 p-8 text-center">
              <p className="text-ink-muted">
                Todavía no hay solicitudes abiertas. Sé el primero.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {open.map((r) => (
                <article
                  key={r.id}
                  className="bg-white rounded-xl border border-amber-200 hover:border-amber-500 hover:shadow-md transition-all p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5">
                      Se busca
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink leading-snug mb-1">
                    {r.title}
                  </h3>
                  {r.author && (
                    <p className="text-sm italic text-ink-muted mb-1">{r.author}</p>
                  )}
                  {r.requester_location && (
                    <p className="text-sm text-amber-800 font-semibold mb-2 flex items-center gap-1">
                      <span aria-hidden>📍</span> {r.requester_location}
                    </p>
                  )}
                  {r.notes && (
                    <p className="text-xs text-ink-muted leading-relaxed line-clamp-3 mb-3 bg-cream-warm/60 rounded-md px-3 py-2">
                      {r.notes}
                    </p>
                  )}
                  <Link
                    href={`/publish?title=${encodeURIComponent(r.title)}${r.author ? `&author=${encodeURIComponent(r.author)}` : ""}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-800 hover:text-amber-900 mt-2"
                  >
                    ¿Lo tienes? Publícalo <span aria-hidden>→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* FULFILLED LIST */}
        {fulfilled.length > 0 && (
          <section className="opacity-80">
            <h2 className="font-display text-lg text-ink mb-4">
              Ya encontrados <span className="text-ink-muted font-normal">· gracias a los vendedores</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {fulfilled.slice(0, 20).map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-1.5 rounded-full"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {r.title}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Share CTA */}
        <section className="text-center pt-6 border-t border-cream-dark/40">
          <p className="text-sm text-ink-muted mb-3">
            ¿Vendes libros usados en Chile? Mira esta lista con frecuencia — cada
            pedido es una venta potencial.
          </p>
          <Link
            href="/vender"
            className="inline-flex items-center px-5 py-2.5 bg-ink text-cream text-xs font-semibold uppercase tracking-wider rounded-md hover:bg-ink/85 transition-colors"
          >
            Quiero vender en tuslibros.cl
          </Link>
        </section>
      </main>
    </div>
  );
}
