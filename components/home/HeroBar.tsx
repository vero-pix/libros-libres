"use client";

import Link from "next/link";
import { COVER_GRADIENTS } from "@/components/listings/BookCover";
import type { HeroBook } from "./HomeShell";

interface Props {
  totalListings: number;
  heroBooks?: HeroBook[];
  onToggleMap?: () => void;
  /** Del 20-09 al 20-12 el kicker se pone verde. Lo decide el servidor
      (lib/fechasChile.ts): calcularlo acá daría mismatch de hidratación. Los
      fondos y las líneas no pasan por acá: los mueven los tokens del <html>. */
  primavera?: boolean;
}

/* Cada chip lleva su punto de color (23-09): la fila era siete pastillas
   iguales en gris sobre beige. Las clases van escritas enteras para que
   Tailwind las encuentre. */
const CATEGORY_CHIPS = [
  { label: "Novela", href: "/?subcategory=ficcion-novela", dot: "bg-ink", hover: "hover:border-ink/50 hover:bg-ink/[0.06]" },
  { label: "Poesía", href: "/?subcategory=ficcion-poesia", dot: "bg-coral", hover: "hover:border-coral/50 hover:bg-coral/[0.07]" },
  { label: "Historia", href: "/?subcategory=no-ficcion-historia", dot: "bg-gold-deep", hover: "hover:border-gold-deep/50 hover:bg-gold/[0.08]" },
  { label: "Policial", href: "/?subcategory=ficcion-policial", dot: "bg-ink-night", hover: "hover:border-ink-night/50 hover:bg-ink-night/[0.06]" },
  { label: "Ensayo", href: "/?subcategory=no-ficcion-ensayo", dot: "bg-green", hover: "hover:border-green/50 hover:bg-green/[0.07]" },
  { label: "Colección", href: "/?collectible=1", dot: "bg-coral-deep", hover: "hover:border-coral-deep/50 hover:bg-coral-deep/[0.07]" },
  { label: "Ofertas", href: "/?sort=price_asc", dot: "bg-gold", hover: "hover:border-gold/60 hover:bg-gold/[0.08]" },
];

/* Abanico decorativo (puro CSS). Los colores son los mismos de las cubiertas
   sin foto — se llamaban por su hex y ahora por su nombre, para que el dia que
   cambie la paleta el abanico cambie con ella.
   Los 6 espacios (posición + color) son fijos;
   los títulos rotan semanalmente desde HERO_POOL para que el hero se sienta vivo. */
const HERO_SLOTS = [
  { bg: COVER_GRADIENTS.ox, light: false, pos: "left-0 top-7 w-[150px] rotate-[-7deg] z-[2]" },
  { bg: COVER_GRADIENTS.cream, light: true, pos: "left-[25%] top-0 w-[162px] rotate-[-2deg] z-[4]" },
  { bg: COVER_GRADIENTS.ink, light: false, pos: "left-[53%] top-5 w-[150px] rotate-[4deg] z-[3]" },
  { bg: COVER_GRADIENTS.green, light: false, pos: "left-[6%] top-[215px] w-[136px] rotate-[-4deg] z-[3]" },
  { bg: COVER_GRADIENTS.coral, light: false, pos: "left-[40%] top-[210px] w-[140px] rotate-[3deg] z-[5]" },
  { bg: COVER_GRADIENTS.gold, light: true, pos: "left-[64%] top-[230px] w-[132px] rotate-[-6deg] z-[2]" },
];

/* Clásicos chilenos y latinoamericanos. El abanico toma 6 consecutivos por semana. */
const HERO_POOL = [
  { t: "Los detectives salvajes", a: "Bolaño", pub: "Anagrama" },
  { t: "Tala", a: "G. Mistral", pub: "Lumen" },
  { t: "Elogio de la sombra", a: "Borges", pub: "Emecé" },
  { t: "Poemas y antipoemas", a: "Parra", pub: "Tajamar" },
  { t: "Conversación en La Catedral", a: "Vargas Llosa", pub: "Seix Barral" },
  { t: "Casa de campo", a: "Donoso", pub: "Alfaguara" },
  { t: "Canto general", a: "Neruda", pub: "Losada" },
  { t: "La amortajada", a: "M. L. Bombal", pub: "Andrés Bello" },
  { t: "Hijo de ladrón", a: "Manuel Rojas", pub: "Zig-Zag" },
  { t: "Sub terra", a: "Baldomero Lillo", pub: "Lom" },
  { t: "El obsceno pájaro de la noche", a: "Donoso", pub: "Seix Barral" },
  { t: "Papelucho", a: "Marcela Paz", pub: "Universitaria" },
  { t: "Cien años de soledad", a: "García Márquez", pub: "Sudamericana" },
  { t: "Rayuela", a: "Cortázar", pub: "Sudamericana" },
  { t: "Pedro Páramo", a: "Juan Rulfo", pub: "FCE" },
  { t: "Ficciones", a: "Borges", pub: "Emecé" },
  { t: "La ciudad y los perros", a: "Vargas Llosa", pub: "Seix Barral" },
  { t: "La tregua", a: "Benedetti", pub: "Sudamericana" },
  { t: "Aura", a: "Carlos Fuentes", pub: "Era" },
  { t: "El llano en llamas", a: "Juan Rulfo", pub: "FCE" },
  { t: "Residencia en la tierra", a: "Neruda", pub: "Cruz del Sur" },
  { t: "Desierto", a: "Raúl Zurita", pub: "Tácitas" },
  { t: "El reino de este mundo", a: "Carpentier", pub: "EDIASA" },
  { t: "Mistral en verso", a: "G. Mistral", pub: "Universitaria" },
];

/* Número de semana ISO — server y cliente caen en la misma semana → sin mismatch. */
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return Math.floor((date.getTime() - firstThursday.getTime()) / 604800000);
}

function weeklyHeroBooks() {
  // Avanza de a HERO_SLOTS.length por semana → cada semana un set completo distinto
  // (con 24 libros y 6 espacios, 4 sets sin solape que se repiten cada 4 semanas).
  const offset = (isoWeek(new Date()) * HERO_SLOTS.length) % HERO_POOL.length;
  return HERO_SLOTS.map((slot, i) => ({ ...slot, ...HERO_POOL[(offset + i) % HERO_POOL.length] }));
}

function FanBook({ b }: { b: ReturnType<typeof weeklyHeroBooks>[number] }) {
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

/* Portada real del catálogo, con las mismas posiciones/rotaciones del abanico.
   Enlaza a la ficha del libro. object-cover para que cualquier proporción llene el slot.

   `eager` a propósito (10-09-2026): estas seis portadas son lo más grande de la
   primera pantalla, o sea el elemento que define el LCP de la portada — y venían
   con `loading="lazy"`, que le pide al navegador justamente lo contrario. Semrush
   medía 3,0–4,0s donde Google quiere menos de 2,5.

   Las tres primeras llevan además `fetchPriority="high"`: son las de más arriba en
   el abanico y las que gana el LCP. Poner las seis en alta prioridad no ayuda —
   compiten entre ellas por el mismo ancho de banda y ninguna llega antes.

   Siguen siendo `<img>` y no `next/image` a propósito: la optimización de imágenes
   es lo que más factura del plan de Vercel y ya se acotó por costo el 17-08-2026
   (ver `next.config.mjs`). Esto arregla el LCP sin agregar ni una transformación. */
function RealFanBook({ book, pos, prioridad }: { book: HeroBook; pos: string; prioridad: boolean }) {
  return (
    <Link
      href={book.href}
      title={book.title}
      className={`group absolute aspect-[148/225] rounded-[2px_4px_4px_2px] shadow-book overflow-hidden bg-ink/5 ${pos} transition-transform duration-300 hover:!rotate-0 hover:z-[7] hover:scale-[1.04]`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-2 z-[2] bg-gradient-to-r from-black/30 via-white/10 to-black/10" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={book.cover}
        alt={book.title}
        loading="eager"
        fetchPriority={prioridad ? "high" : "auto"}
        decoding="async"
        className="w-full h-full object-cover"
      />
    </Link>
  );
}

export default function HeroBar({ heroBooks, primavera = false }: Props) {
  const useReal = (heroBooks?.length ?? 0) >= 6;
  // El hero lleva su propio crema, un punto más marcado que el fondo general
  // para que la primera pantalla tenga jerarquía. En primavera ese token se
  // corre al verde igual que los demás (ver `html.primavera` en globals.css).
  return (
    <section className="relative bg-hero border-b border-hero-line overflow-hidden">
      {/* El color de la primera pantalla (23-09): tres halos detrás del abanico
          y del titular. Ver .hero-glow en globals.css. */}
      <div aria-hidden className="hero-glow hero-glow-coral right-[4%] top-[6%] w-[460px] h-[460px]" />
      <div aria-hidden className="hero-glow hero-glow-gold right-[28%] bottom-[-18%] w-[380px] h-[380px]" />
      <div aria-hidden className="hero-glow hero-glow-ink left-[-8%] top-[-20%] w-[420px] h-[420px]" />
      <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-10 items-center">
          {/* Texto */}
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-coral mb-5 before:content-[''] before:w-6 before:h-px before:bg-current">
              {primavera ? "Primavera 2026 · Chile" : "Libros libres · Chile"}
            </p>
            {/* En primavera cambia lo que la portada DICE, no el color del papel:
                teñir el fondo de verde se probó el 21-09 y abarataba la marca.
                El titular de siempre vuelve solo el 21-12. */}
            {primavera ? (
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]">
                Se acabó el invierno{" "}
                <em className="italic">de releer lo mismo.</em>
              </h1>
            ) : (
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] font-normal text-ink leading-[1.05] tracking-[-0.02em]">
                Cada estantería{" "}
                <em className="italic">es una librería.</em>
              </h1>
            )}
            <p className="mt-6 font-display italic text-lg sm:text-xl text-ink-muted/90 leading-snug max-w-xl">
              {primavera
                ? "Fantasía, poesía y lo que recién llegó a las estanterías de otros. Cerca de ti, con pago protegido."
                : "Los que ya leíste, los que te faltan. Compra y vende con personas reales — cerca de ti, con pago protegido."}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primavera ? "/primavera" : "#tienda"} className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white rounded-full font-semibold text-sm hover:bg-ink-deep transition-colors">
                {primavera ? "Ver la selección de primavera" : "Explorar libros"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/publish" className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent border border-line-strong text-ink rounded-full font-semibold text-sm hover:border-ink hover:bg-black/[0.03] transition-colors">
                Publicar uno mío
              </Link>
            </div>

            {/* Diferenciadores de confianza — antes acá lideraba el ancla de precio
                "$3.000 · más baratos", que cheapeaba la marca. La cercanía, el pago
                protegido y la gente real son lo que sube valor y ataca la desconfianza
                (nuestro cuello de conversión). Los números viven en el contador de abajo. */}
            <div className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2 pt-6 border-t border-hero-line">
              {/* Cada sello lleva a donde se comprueba: eran texto muerto y la
                  portada prometía tres cosas sin dónde leerlas. (21-09-2026) */}
              {[
                { icon: "📍", label: "Cerca de ti", href: "/mapa" },
                { icon: "🛡️", label: "Pago protegido", href: "/como-funciona#pago-protegido" },
                { icon: "👤", label: "Gente real", href: "/gente-de-confianza" },
              ].map((b, i) => (
                <span key={b.label} className="flex items-center gap-3">
                  {i > 0 && <span className="text-ink-muted/40" aria-hidden>·</span>}
                  <Link
                    href={b.href}
                    className="flex items-center gap-1.5 text-sm text-ink underline-offset-4 decoration-line-strong hover:underline hover:text-ink-deep transition-colors"
                  >
                    <span aria-hidden>{b.icon}</span>
                    <span className="font-medium">{b.label}</span>
                  </Link>
                </span>
              ))}
            </div>
          </div>

          {/* Abanico de libros (decorativo, solo desktop). Portadas REALES del
              catálogo cuando hay ≥6; si no (filtros/catálogo vacío), cae a los
              mockups semanales para no dejar el espacio en blanco. */}
          <div className="relative h-[460px] hidden lg:block">
            {useReal
              ? heroBooks!.slice(0, 6).map((b, i) => (
                  <RealFanBook key={b.href} book={b} pos={HERO_SLOTS[i].pos} prioridad={i < 3} />
                ))
              : weeklyHeroBooks().map((b) => <FanBook key={b.t} b={b} />)}
            <div className="absolute z-[6] left-[40%] top-[188px] rotate-[2deg] bg-white border border-hero-line rounded-full px-3.5 py-2 shadow-card flex items-center gap-2.5 font-mono text-[11px] font-semibold text-ink whitespace-nowrap">
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
          {/* Los destacados no tenían dónde verse desde el 17-09: primer chip,
              el único relleno, para que se lea como la puerta y no como un tema. */}
          <Link
            href="/destacados"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-ink-night border border-gold rounded-full text-[13px] font-semibold shadow-[0_6px_16px_-8px_rgb(var(--gold-deep-rgb)/0.8)] hover:bg-gold-deep hover:border-gold-deep hover:text-white hover:-translate-y-0.5 transition-all whitespace-nowrap"
          >
            <span aria-hidden>★</span> Destacados
          </Link>
          {CATEGORY_CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-paper-card/80 border border-line-strong rounded-full text-[13px] font-medium text-ink hover:-translate-y-0.5 transition-all whitespace-nowrap ${chip.hover}`}
            >
              <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
