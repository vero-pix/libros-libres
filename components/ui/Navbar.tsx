import Link from "next/link";
import { headers } from "next/headers";
import Logo from "./Logo";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";
import NavDropdown from "./NavDropdown";
import HeaderSearchBar from "./HeaderSearchBar";
import MobileMenu from "./MobileMenu";
// import UnreadBadge from "@/components/messages/UnreadBadge"; // oculto con Mensajes (20 jul 2026)

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Geolocalización por IP (headers de Vercel, sin pedir permiso al usuario).
  // Cae a "Chile" si la IP es chilena pero sin ciudad; se oculta si no hay dato.
  const h = headers();
  const rawCity = h.get("x-vercel-ip-city");
  const country = h.get("x-vercel-ip-country");
  const cityLabel = rawCity
    ? decodeURIComponent(rawCity).replace(/\+/g, " ")
    : country === "CL"
      ? "Chile"
      : null;

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
    <header className="shrink-0 sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-5 h-[66px]">
          <Logo withTagline className="hidden sm:flex" />
          <Logo className="sm:hidden" />

          {/* Búsqueda — pill editorial */}
          <div className="hidden md:flex w-full max-w-[380px]">
            <Suspense>
              <HeaderSearchBar />
            </Suspense>
          </div>

          {/* Cluster derecho: nav + ciudad + auth */}
          <div className="flex items-center gap-1 lg:gap-2 ml-auto">
            <nav className="hidden lg:flex items-center gap-0.5">
              <NavLink href="/#tienda">Explorar</NavLink>
              <NavLink href="/solicitudes">Se busca</NavLink>
              <NavLink href="/publish">Vender</NavLink>

              {user && (
                <>
                  {/* Mensajería interna oculta (nadie la usa, 20 jul 2026). Revivir si vuelve como notificaciones.
                  <Link
                    href="/mensajes"
                    className="relative text-[14px] font-medium text-black-soft px-3 py-2 rounded-full hover:bg-black/[0.05] transition-colors whitespace-nowrap flex items-center gap-1"
                  >
                    Mensajes
                    <UnreadBadge />
                  </Link>
                  */}
                  <NavDropdown
                    label="Mi cuenta"
                    items={[
                      { href: "/mis-libros", label: "Mis libros" },
                      { href: "/mis-pedidos", label: "Mis pedidos" },
                      { href: "/mis-ventas", label: "Mis ventas" },
                      // { href: "/mis-arriendos", label: "Mis arriendos" }, // arriendo a la banca (revivir con bibliotecas)
                      { href: "/carrito", label: "Carrito" },
                      // { href: "/referidos", label: "Invita y gana" }, // oculto; replantear a los 2.500 libros
                      { href: "/perfil", label: "Perfil" },
                    ]}
                  />
                </>
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
                className="p-2 rounded-full text-green-600 hover:bg-black/[0.05] transition-colors"
                title="Escríbenos por WhatsApp"
                aria-label="WhatsApp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </nav>

            {/* Ciudad detectada por geo-IP (Vercel headers) */}
            {cityLabel && (
              <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.03em] text-ink px-3 py-1.5 rounded-full border border-line-strong whitespace-nowrap">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {cityLabel}
              </span>
            )}

            <NavbarClient user={user} displayName={displayName} initialCartCount={cartCount} />

            {/* Menú para <lg, donde la <nav> está oculta (restituye Mensajes/Mis ventas/etc.) */}
            <MobileMenu loggedIn={!!user} />
          </div>
        </div>
      </div>

      {/* Búsqueda móvil */}
      <div className="md:hidden px-4 pb-2.5 -mt-0.5">
        <Suspense>
          <HeaderSearchBar />
        </Suspense>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[14px] font-medium text-black-soft px-3 py-2 rounded-full hover:bg-black/[0.05] transition-colors whitespace-nowrap inline-flex items-center"
    >
      {children}
    </Link>
  );
}
