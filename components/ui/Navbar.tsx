import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";
import HeaderSearchBar from "./HeaderSearchBar";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();

    displayName =
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      null;
  }

  return (
    <header className="shrink-0 bg-ink flex flex-col sticky top-0 z-50">
      {/* Row 1: Logo + Search + Auth */}
      <div className="bg-cream px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <Link href="/" className="group whitespace-nowrap">
            <span className="font-display text-2xl font-bold text-ink tracking-tight">
              Libros{" "}
            </span>
            <span className="font-display text-2xl font-bold text-brand-600 tracking-tight group-hover:text-brand-500 transition-colors">
              Libres
            </span>
          </Link>

          <div className="hidden md:flex flex-1 justify-center px-4">
            <Suspense>
              <HeaderSearchBar />
            </Suspense>
          </div>

          <div className="ml-auto">
            <NavbarClient user={user} displayName={displayName} />
          </div>
        </div>
      </div>

      {/* Row 2: Navigation — Martfury style with dropdowns */}
      <NavMenu isLoggedIn={!!user} />

      {/* Mobile search */}
      <div className="md:hidden bg-cream border-b border-cream-dark px-4 py-2">
        <Suspense>
          <HeaderSearchBar />
        </Suspense>
      </div>
    </header>
  );
}

function NavMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav className="text-cream-warm">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-0 overflow-x-auto">
        <NavLink href="/">Inicio</NavLink>
        <NavLink href="/#tienda">Explorar</NavLink>
        <NavLink href="/publish">Vender</NavLink>

        {isLoggedIn && (
          <NavDropdown label="Mi cuenta">
            <DropdownLink href="/mis-libros">Mis libros</DropdownLink>
            <DropdownLink href="/mis-pedidos">Mis pedidos</DropdownLink>
            <DropdownLink href="/mis-ventas">Mis ventas</DropdownLink>
            <DropdownLink href="/mis-arriendos">Mis arriendos</DropdownLink>
            <DropdownLink href="/carrito">Carrito</DropdownLink>
            <DropdownLink href="/perfil">Perfil</DropdownLink>
          </NavDropdown>
        )}

        <NavLink href="/planes">Planes</NavLink>

        <NavDropdown label="Ayuda">
          <DropdownLink href="/como-funciona">Cómo funciona</DropdownLink>
          <DropdownLink href="/faq">FAQ</DropdownLink>
          <DropdownLink href="/sobre-nosotros">Sobre nosotros</DropdownLink>
          <DropdownLink href="/historia">Nuestra historia</DropdownLink>
        </NavDropdown>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium uppercase tracking-[0.15em] px-4 py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap"
    >
      {children}
    </Link>
  );
}

function NavDropdown({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group">
      <button className="text-xs font-medium uppercase tracking-[0.15em] px-4 py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1">
        {label}
        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div className="absolute top-full left-0 bg-white border border-cream-dark/30 rounded-lg shadow-xl py-1 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {children}
      </div>
    </div>
  );
}

function DropdownLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2.5 text-sm text-ink hover:bg-cream-warm transition-colors"
    >
      {children}
    </Link>
  );
}
