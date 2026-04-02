"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
}

export default function NavbarClient({ user }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Ingresar
        </Link>
        <Link
          href="/register"
          className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          Registrarse
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/listings/new"
        className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        + Publicar
      </Link>
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Salir
      </button>
    </div>
  );
}
