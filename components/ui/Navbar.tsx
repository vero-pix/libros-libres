import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch display name: prefer profile row, fallback to auth metadata
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
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-4 shrink-0">
      <Link href="/" className="font-bold text-lg text-brand-600 tracking-tight">
        📚 Libros Libres
      </Link>

      <nav className="hidden sm:flex items-center gap-1 ml-2">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Mapa
        </Link>
        <Link
          href="/search"
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Buscar
        </Link>
      </nav>

      <div className="ml-auto">
        <NavbarClient user={user} displayName={displayName} />
      </div>
    </header>
  );
}
