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
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-navy tracking-tight whitespace-nowrap">
            Libros Libres
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

      {/* Row 2: Navigation (navy bar) */}
      <nav className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-wider px-4 py-3 hover:bg-navy-light transition-colors whitespace-nowrap"
          >
            Inicio
          </Link>
          <Link
            href="/publish"
            className="text-xs font-semibold uppercase tracking-wider px-4 py-3 hover:bg-navy-light transition-colors whitespace-nowrap"
          >
            Vende tu libro
          </Link>
          <Link
            href="/mis-pedidos"
            className="text-xs font-semibold uppercase tracking-wider px-4 py-3 hover:bg-navy-light transition-colors whitespace-nowrap"
          >
            Pedidos
          </Link>
          <Link
            href="/mapa"
            className="text-xs font-semibold uppercase tracking-wider px-4 py-3 hover:bg-navy-light transition-colors whitespace-nowrap"
          >
            Mapa
          </Link>
          <Link
            href="/como-funciona"
            className="text-xs font-semibold uppercase tracking-wider px-4 py-3 hover:bg-navy-light transition-colors whitespace-nowrap"
          >
            Cómo funciona
          </Link>
          <Link
            href="/faq"
            className="text-xs font-semibold uppercase tracking-wider px-4 py-3 hover:bg-navy-light transition-colors whitespace-nowrap"
          >
            FAQ
          </Link>
        </div>
      </nav>

      {/* Mobile search (visible only on small screens) */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <Suspense>
          <HeaderSearchBar />
        </Suspense>
      </div>
    </header>
  );
}
