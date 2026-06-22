import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

// Caluga de liquidación estilo Martfury: toda la estantería de Vero (vendedor `vero`)
// al 50% para la semana de vacaciones de invierno. Linkea a su tienda.
const VERO_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

interface Row {
  id: string;
  price: number;
  original_price: number | null;
  cover_image_url: string | null;
  book: { title: string; cover_url: string | null } | null;
}

export default async function LiquidacionBanner() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("listings")
    .select("id, price, original_price, cover_image_url, book:books(title, cover_url)")
    .eq("seller_id", VERO_ID)
    .eq("status", "active")
    .not("original_price", "is", null)
    .order("price", { ascending: false })
    .limit(20);

  const rows = ((data as Row[] | null) ?? []).filter(
    (l) => l.original_price != null && l.original_price > l.price
  );
  if (rows.length < 4) return null;

  // Portadas: cover propia del listing primero, si no la del libro
  const covers = rows
    .map((l) => l.cover_image_url ?? l.book?.cover_url)
    .filter((u): u is string => !!u)
    .slice(0, 5);

  return (
    <section className="bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <Link
          href="/vendedor/vero"
          className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-[#241b14] via-[#33241a] to-[#1d1610] border border-amber-900/30 shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-shadow"
        >
          {/* Glow animado detrás del número */}
          <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-[--coral]/20 blur-3xl animate-pulse" />

          <div className="relative flex flex-col md:flex-row items-center gap-6 px-6 sm:px-8 py-6 md:py-7">
            {/* Texto */}
            <div className="flex-1 text-center md:text-left">
              <p className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.25em] uppercase text-amber-300/90 mb-3">
                <span aria-hidden>❄</span> Vacaciones de invierno
              </p>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-cream leading-[1.1]">
                Toda mi estantería{" "}
                <span className="italic text-[--coral]">a mitad de precio</span>
              </h2>
              <p className="mt-3 text-sm sm:text-[15px] text-cream/70 max-w-xl mx-auto md:mx-0 leading-relaxed">
                Liquido mis libros — los míos, de TusLibros — al{" "}
                <span className="font-semibold text-cream">50%</span>. Para llenar
                las vacaciones de lectura y para que vuelvan a circular.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[--coral] px-6 py-2.5 text-sm font-bold text-white shadow-lg group-hover:brightness-105 transition-all">
                Ver la liquidación
                <span className="inline-block group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </span>
            </div>

            {/* Número + portadas en abanico */}
            <div className="relative flex items-center gap-5 shrink-0">
              <div className="hidden sm:flex -space-x-6">
                {covers.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-24 w-16 sm:h-28 sm:w-20 rounded-md object-cover border-2 border-cream/90 shadow-xl transition-transform duration-300 group-hover:-translate-y-1"
                    style={{ transform: `rotate(${(i - 2) * 5}deg)` }}
                  />
                ))}
              </div>
              <div className="flex flex-col items-center leading-none">
                <span className="font-display text-5xl sm:text-6xl md:text-7xl font-black text-[--coral] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                  50%
                </span>
                <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-amber-200/80 mt-1">
                  dscto.
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
