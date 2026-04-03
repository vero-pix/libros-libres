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
    <header className="shrink-0">
      {/* Row 1: Logo + Search + Auth */}
      <div className="bg-cream border-b border-cream-dark px-4 py-4">
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

      {/* Row 2: Navigation */}
      <nav className="bg-ink text-cream-warm">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-0 overflow-x-auto">
          {[
            { href: "/", label: "Inicio" },
            { href: "/publish", label: "Vende tu libro" },
            { href: "/mis-libros", label: "Mis libros" },
            { href: "/mis-pedidos", label: "Pedidos" },
            { href: "/mapa", label: "Mapa" },
            { href: "/como-funciona", label: "Cómo funciona" },
            { href: "/faq", label: "FAQ" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-[0.15em] px-4 py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile search */}
      <div className="md:hidden bg-cream border-b border-cream-dark px-4 py-2">
        <Suspense>
          <HeaderSearchBar />
        </Suspense>
      </div>
    </header>
  );
}
