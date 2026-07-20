"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Props {
  loggedIn: boolean;
}

// Menú para pantallas < lg, donde la <nav> principal está oculta.
// Restituye el acceso a Mensajes / Mis ventas / Mi cuenta / etc. en móvil y tablet.
export default function MobileMenu({ loggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const Section = ({ children }: { children: React.ReactNode }) => (
    <div className="py-1.5 border-t border-line first:border-t-0">{children}</div>
  );
  const Item = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className="block px-4 py-2.5 text-sm text-ink hover:bg-cream-warm/50 hover:text-coral transition-colors"
    >
      {label}
    </Link>
  );

  return (
    <div ref={ref} className="relative lg:hidden">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-2 rounded-full text-ink hover:bg-black/[0.05] transition-colors"
        aria-label="Menú"
        aria-expanded={open}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      <div
        className={`absolute top-full right-0 mt-1 bg-paper-card border border-line rounded-xl shadow-card min-w-[230px] max-h-[80vh] overflow-y-auto z-[60] transition-all duration-200 ${
          open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
        }`}
      >
        <Section>
          <Item href="/" label="Inicio" />
          <Item href="/#tienda" label="Explorar" />
          <Item href="/solicitudes" label="Se busca" />
          <Item href="/publish" label="Vender" />
        </Section>

        {loggedIn ? (
          <Section>
            {/* Ocultos 20 jul 2026 (nadie los usa): Mensajes, Mis arriendos, Invita y gana. Revivir cuando aplique.
            <Item href="/mensajes" label="Mensajes" />
            <Item href="/mis-arriendos" label="Mis arriendos" />
            <Item href="/referidos" label="Invita y gana" /> */}
            <Item href="/mis-libros" label="Mis libros" />
            <Item href="/mis-pedidos" label="Mis pedidos" />
            <Item href="/mis-ventas" label="Mis ventas" />
            <Item href="/carrito" label="Carrito" />
            <Item href="/perfil" label="Perfil" />
          </Section>
        ) : (
          <Section>
            <Item href="/login" label="Entrar" />
            <Item href="/register" label="Regístrate" />
          </Section>
        )}

        <Section>
          <Item href="/como-funciona" label="Cómo funciona" />
          <Item href="/novedades" label="Novedades" />
          <Item href="/faq" label="FAQ" />
          <Item href="/sobre-nosotros" label="Sobre nosotros" />
          <Item href="/alianzas" label="Alianzas institucionales" />
          <Item href="/historia" label="Nuestra historia" />
        </Section>
      </div>
    </div>
  );
}
