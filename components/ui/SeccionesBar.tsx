"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * La franja de secciones bajo el menú (27-09-2026), la «opción A» que eligió
 * Vero entre tres ejemplos: la barra de departamentos de Martfury, con los
 * colores de tuslibros. Existe porque las landings llegaban desde Google sin
 * nada por dónde seguir.
 *
 * No es sticky a propósito: el menú de arriba ya lo es, y dos franjas pegadas
 * se comen media pantalla del teléfono. En el teléfono se desliza de lado.
 * Se esconde donde distrae de una tarea (comprar, publicar, la cuenta).
 */
const SECCIONES = [
  { label: "Destacados", href: "/destacados" },
  { label: "Libros baratos", href: "/libros-usados-baratos" },
  { label: "Antiguos y de colección", href: "/libros-antiguos" },
  { label: "Series completas", href: "/lotes-de-libros" },
  { label: "Novela", href: "/categoria/ficcion-novela" },
  { label: "Poesía", href: "/categoria/ficcion-poesia" },
  { label: "Infantiles", href: "/libros-infantiles" },
  { label: "Escolares", href: "/libros-escolares" },
  { label: "Se busca", href: "/solicitudes" },
];

const OCULTA_EN = [
  "/checkout", "/carrito", "/publish", "/mis-", "/perfil", "/mensajes",
  "/orders", "/admin", "/login", "/register", "/forgot-password", "/resena", "/encuesta",
];

export default function SeccionesBar() {
  const pathname = usePathname() ?? "/";
  if (OCULTA_EN.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav aria-label="Secciones" className="bg-ink text-cream border-b border-cream/15">
      <div className="max-w-7xl mx-auto flex items-stretch">
        <Link
          href="/categoria"
          className="shrink-0 flex items-center gap-2 bg-gold text-ink-night font-semibold text-[13px] px-4 sm:px-5 py-2.5 hover:bg-gold-deep hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span className="hidden sm:inline">Todas las categorías</span>
          <span className="sm:hidden">Categorías</span>
        </Link>
        <ul className="flex items-stretch gap-1 overflow-x-auto scrollbar-hide px-2 sm:px-3">
          {SECCIONES.map((s) => {
            const activa = pathname === s.href || pathname.startsWith(`${s.href}/`);
            return (
              <li key={s.href} className="shrink-0 flex">
                <Link
                  href={s.href}
                  aria-current={activa ? "page" : undefined}
                  className={`flex items-center px-3 text-[13px] whitespace-nowrap border-b-2 transition-colors ${
                    activa
                      ? "border-gold text-white font-semibold"
                      : "border-transparent text-cream/85 hover:text-white hover:border-cream/40"
                  }`}
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
