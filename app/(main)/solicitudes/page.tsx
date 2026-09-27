import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import RequestForm from "./RequestForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Se busca · Pide un libro que no está en el catálogo",
  description:
    "¿Buscas un libro que no está en tuslibros.cl? Pídelo acá. Los vendedores ven la demanda y publican los libros que tienen. Economía inversa.",
  alternates: { canonical: "https://tuslibros.cl/solicitudes" },
};

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  notes: string | null;
  requester_location: string | null;
  fulfilled: boolean;
  created_at: string;
  tema: string | null;
}

export default async function SolicitudesPage() {
  const supabase = createPublicClient();
  // Dos queries separadas: una sola con .limit(100) traía las 100 más recientes
  // mezclando abiertas y cumplidas, así que las abiertas más viejas se caían de
  // la lista y el contador no coincidía con el del home. (15 ago 2026)
  const COLS = "id, title, author, notes, requester_location, fulfilled, created_at, tema";
  const [{ data: openRaw }, { data: fulfilledRaw }] = await Promise.all([
    supabase
      .from("book_requests")
      .select(COLS)
      .eq("fulfilled", false)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("book_requests")
      .select(COLS)
      .eq("fulfilled", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Lo más nuevo primero, siempre (27-09-2026). Antes, con sesión y comuna,
  // los pedidos de la zona del visitante subían arriba sin importar la fecha:
  // a Vero, en Providencia, le salía primero un pedido de abril.
  //
  // Los de más de SEMANAS_VIGENTES semanas se archivan: salen de la lista
  // principal y quedan en una sección plegada. No se borran, y el aviso al
  // comprador cuando alguien publica ese libro sigue funcionando igual
  // (webhooks/listing-created y cron/requests-digest no miran esto).
  const SEMANAS_VIGENTES = 2; // decisión de Vero, 27-09-2026
  const corte = Date.now() - SEMANAS_VIGENTES * 7 * 24 * 3600_000;
  const todosAbiertos = (openRaw ?? []) as BookRequest[];
  // La sesión solo decide qué muestra el formulario, ya no el orden.
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  const open = todosAbiertos.filter((r) => new Date(r.created_at).getTime() >= corte);
  const archivados = todosAbiertos.filter((r) => new Date(r.created_at).getTime() < corte);
  const fulfilled = (fulfilledRaw ?? []) as BookRequest[];

  // Los temas salen de `categories`, la fuente de verdad — nunca una lista a
  // mano. Es la misma que usa el formulario de /search (18-09-2026); hasta el
  // 20-09 el modo tema vivía SOLO ahí, y ahí solo aparece cuando una búsqueda
  // no encuentra nada: para pedir un tema había que fracasar buscando primero.
  const { data: temasBD } = await supabase.from("categories").select("slug, name").order("name");
  const temas = (temasBD ?? []).map((c) => ({ slug: c.slug as string, nombre: c.name as string }));

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
            ¿Buscas un libro, o un tema?
          </h2>
          <p className="text-sm text-ink-muted mb-6">
            Un título concreto, y te aviso cuando alguien lo publique. O un tema
            —poesía, historia, filosofía— y te aviso cada vez que entre algo de
            esos. Tus datos de contacto son privados.
          </p>
          <RequestForm hasSession={!!user} temas={temas} />
        </section>

        {/* OPEN LIST */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-2xl text-ink">
              Lo que se está buscando
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
                    <span className={`text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${
                      r.tema
                        ? "text-emerald-800 bg-emerald-100"
                        : "text-amber-700 bg-amber-100"
                    }`}>
                      {r.tema ? "Tema" : "Se busca"}
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
                  {/* Un pedido por tema no tiene título de libro: mandar
                      "Poesía" como title a /publish llenaba el formulario con
                      una categoría en el campo del nombre del libro. */}
                  <Link
                    href={
                      r.tema
                        ? "/publish"
                        : `/publish?title=${encodeURIComponent(r.title)}${r.author ? `&author=${encodeURIComponent(r.author)}` : ""}`
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-800 hover:text-amber-900 mt-2"
                  >
                    {r.tema ? "¿Tienes de esto? Publica" : "¿Lo tienes? Publícalo"}{" "}
                    <span aria-hidden>→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ARCHIVADOS: pedidos de más de SEMANAS_VIGENTES semanas */}
        {archivados.length > 0 && (
          <details className="group bg-white/60 rounded-xl border border-cream-dark/40 px-5 py-4">
            <summary className="cursor-pointer list-none flex items-baseline justify-between gap-3">
              <span className="font-display text-lg text-ink">
                Pedidos más antiguos
                <span className="text-ink-muted font-normal text-sm"> · más de {SEMANAS_VIGENTES} semanas</span>
              </span>
              <span className="text-xs text-ink-muted whitespace-nowrap">
                {archivados.length} · <span className="group-open:hidden">ver</span><span className="hidden group-open:inline">ocultar</span>
              </span>
            </summary>
            <div className="flex flex-wrap gap-2 mt-4">
              {archivados.map((r) => (
                <Link
                  key={r.id}
                  href={
                    r.tema
                      ? "/publish"
                      : `/publish?title=${encodeURIComponent(r.title)}${r.author ? `&author=${encodeURIComponent(r.author)}` : ""}`
                  }
                  className="inline-flex items-center gap-1 bg-cream-warm/60 hover:bg-amber-100 border border-cream-dark/40 text-ink text-xs px-3 py-1.5 rounded-full transition-colors"
                  title="¿Lo tienes? Publícalo"
                >
                  {r.title}
                  {r.author && <span className="text-ink-muted italic">· {r.author}</span>}
                </Link>
              ))}
            </div>
          </details>
        )}

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
