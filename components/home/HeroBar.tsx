"use client";

import Link from "next/link";

interface Props {
  totalListings: number;
  onToggleMap?: () => void;
}

const CATEGORY_CHIPS = [
  { label: "Novela", href: "/?subcategory=ficcion-novela" },
  { label: "Poesía", href: "/?subcategory=general-adulto-poesia" },
  { label: "Historia", href: "/?subcategory=no-ficcion-historia" },
  { label: "Policial", href: "/?subcategory=ficcion-policial" },
  { label: "Escolares", href: "/?subcategory=academico-escolar" },
  { label: "Colección", href: "/?collectible=1" },
  { label: "Ofertas", href: "/?sort=price_asc" },
];

/* Abanico decorativo (sin datos — puro CSS). */
const HERO_BOOKS = [
  { t: "Los detectives salvajes", a: "Bolaño", pub: "Anagrama", bg: "linear-gradient(160deg,#8a3131,#5e1d1d)", light: false, pos: "left-0 top-7 w-[150px] rotate-[-7deg] z-[2]" },
  { t: "Tala", a: "G. Mistral", pub: "Lumen", bg: "linear-gradient(160deg,#f3ead7,#ddcfb2)", light: true, pos: "left-[25%] top-0 w-[162px] rotate-[-2deg] z-[4]" },
  { t: "Elogio de la sombra", a: "Borges", pub: "Emecé", bg: "linear-gradient(160deg,#23489f,#16307a)", light: false, pos: "left-[53%] top-5 w-[150px] rotate-[4deg] z-[3]" },
  { t: "Poemas y antipoemas", a: "Parra", pub: "Tajamar", bg: "linear-gradient(160deg,#33684f,#1b3d2e)", light: false, pos: "left-[6%] top-[215px] w-[136px] rotate-[-4deg] z-[3]" },
  { t: "Conversación en La Catedral", a: "Vargas Llosa", pub: "Seix Barral", bg: "linear-gradient(160deg,#df5239,#a8331f)", light: false, pos: "left-[40%] top-[210px] w-[140px] rotate-[3deg] z-[5]" },
  { t: "Casa de campo", a: "Donoso", pub: "Alfaguara", bg: "linear-gradient(160deg,#e0990c,#9e6a00)", light: true, pos: "left-[64%] top-[230px] w-[132px] rotate-[-6deg] z-[2]" },
];

function FanBook({ b }: { b: (typeof HERO_BOOKS)[number] }) {
  return (
    <div className={`absolute aspect-[148/225] rounded-[2px_4px_4px_2px] shadow-book overflow-hidden flex flex-col justify-between p-3.5 ${b.pos}`} style={{ background: b.bg }}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-2 z-[2] bg-gradient-to-r from-black/30 via-white/10 to-black/10" />
      <span className={`relative font-mono text-[8px] uppercase tracking-[0.16em] font-semibold ${b.light ? "text-black/55" : "text-white/70"}`}>{b.pub}</span>
      <div className="relative">
        <span className={`block w-7 h-px mb-2 ${b.light ? "bg-ink/40" : "bg-white/55"}`} />
        <h3 className={`font-display text-[13px] leading-[1.08] font-medium ${b.light ? "text-ink italic" : "text-white"}`}>{b.t}</h3>
        <div className={`font-mono text-[8px] uppercase tracking-wider mt-1.5 ${b.light ? "text-ink/60" : "text-white/75"}`}>{b.a}</div>
      </div>
    </div>
  );
}

export default function HeroBar({ totalListings }: Props) {
  return (
    <section className="bg-cream-warm border-b border-line overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-10 items-center">
          {/* Texto */}
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-coral mb-5 before:content-[''] before:w-6 before:h-px before:bg-current">
              Marketplace de libros usados · Chile
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]">
              Cada estantería{" "}
              <em className="italic">es una librería.</em>
            </h1>
            <p className="mt-6 font-display italic text-lg sm:text-xl text-ink-muted/90 leading-snug max-w-xl">
              Los que ya leíste, los que te faltan. Compra y vende con personas reales — cerca de ti, con pago protegido.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#tienda" className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white rounded-full font-semibold text-sm hover:bg-ink-deep transition-colors">
                Explorar libros
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/publish" className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent border border-line-strong text-ink rounded-full font-semibold text-sm hover:border-ink hover:bg-black/[0.03] transition-colors">
                Publicar uno mío
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-9 flex items-center gap-6 pt-6 border-t border-line">
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-3xl text-ink leading-none">{totalListings}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">ejemplares hoy</span>
              </div>
              <div className="w-px h-9 bg-line-strong" />
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-3xl text-ink leading-none">16</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">librerías reales</span>
              </div>
              <div className="w-px h-9 bg-line-strong" />
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-3xl text-ink leading-none">$3.000</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">desde</span>
              </div>
            </div>
          </div>

          {/* Abanico de libros (decorativo, solo desktop) */}
          <div className="relative h-[460px] hidden lg:block">
            {HERO_BOOKS.map((b) => (
              <FanBook key={b.t} b={b} />
            ))}
            <div className="absolute z-[6] left-[40%] top-[188px] rotate-[2deg] bg-white border border-line rounded-full px-3.5 py-2 shadow-card flex items-center gap-2.5 font-mono text-[11px] font-semibold text-ink whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-coral shadow-[0_0_0_4px_rgba(223,82,57,0.18)]" />
              A 800 m · retiro en mano
            </div>
          </div>
        </div>

        {/* Category chips — exploración rápida */}
        <div className="mt-9 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <span className="flex-shrink-0 text-[11px] font-mono uppercase tracking-wider text-ink-muted self-center mr-1">
            Explorar:
          </span>
          {CATEGORY_CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="flex-shrink-0 px-4 py-2 bg-paper-card border border-line-strong rounded-full text-[13px] font-medium text-ink-muted hover:bg-ink hover:border-ink hover:text-white transition-all whitespace-nowrap"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
