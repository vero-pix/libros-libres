import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";
import NavDropdown from "./NavDropdown";
import HeaderSearchBar from "./HeaderSearchBar";
import UnreadBadge from "@/components/messages/UnreadBadge";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let cartCount = 0;
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

    const { count } = await supabase
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    cartCount = count ?? 0;
  }

  return (
    <header className="shrink-0 bg-ink flex flex-col sticky top-0 z-50">
      {/* Row 1: Logo + Search + Auth */}
      <div className="bg-cream px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 sm:gap-6">
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
            <NavbarClient user={user} displayName={displayName} initialCartCount={cartCount} />
          </div>
        </div>
      </div>

      {/* Row 2: Navigation */}
      <nav className="text-cream-warm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-0 flex-nowrap overflow-x-auto scrollbar-hide">
          <NavLink href="/" className="hidden sm:inline-flex">Inicio</NavLink>
          <NavLink href="/#tienda">Explorar</NavLink>
          <NavLink href="/publish">Vender</NavLink>
          <NavLink href="/novedades" className="hidden sm:inline-flex">Novedades</NavLink>

          {user && (
            <>
            <Link
              href="/mensajes"
              className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] px-2.5 sm:px-4 py-3 sm:py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap flex items-center"
            >
              Mensajes
              <UnreadBadge />
            </Link>
            <NavDropdown
              label="Mi cuenta"
              items={[
                { href: "/mis-libros", label: "Mis libros" },
                { href: "/mis-pedidos", label: "Mis pedidos" },
                { href: "/mis-ventas", label: "Mis ventas" },
                { href: "/mis-arriendos", label: "Mis arriendos" },
                { href: "/carrito", label: "Carrito" },
                { href: "/referidos", label: "Invita y gana" },
                { href: "/perfil", label: "Perfil" },
              ]}
            /></>
          )}

          <NavDropdown
            label="Ayuda"
            items={[
              { href: "/como-funciona", label: "Cómo funciona" },
              { href: "/novedades", label: "Novedades" },
              { href: "/faq", label: "FAQ" },
              { href: "/sobre-nosotros", label: "Sobre nosotros" },
              { href: "/alianzas", label: "Alianzas institucionales" },
              { href: "/historia", label: "Nuestra historia" },
            ]}
          />

          <a
            href="https://wa.me/56994583067?text=Hola%2C%20tengo%20una%20consulta%20sobre%20tuslibros.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-[11px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] px-2.5 sm:px-3 py-3 sm:py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5 text-green-400 hover:text-green-300"
            title="Escríbenos por WhatsApp"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </nav>

      {/* Mobile search */}
      <div className="md:hidden bg-cream border-b border-cream-dark px-3 py-1.5">
        <Suspense>
          <HeaderSearchBar />
        </Suspense>
      </div>
    </header>
  );
}

function NavLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`text-[11px] sm:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] px-2.5 sm:px-4 py-3 sm:py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap inline-flex items-center ${className}`}
    >
      {children}
    </Link>
  );
}
