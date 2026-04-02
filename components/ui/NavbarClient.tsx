"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
  displayName: string | null;
}

export default function NavbarClient({ user, displayName }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Mostrar solo el primer nombre
  const firstName = displayName?.split(" ")[0] ?? null;

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
    <div className="flex items-center gap-3">
      {firstName && (
        <span className="hidden sm:block text-sm text-gray-600">
          Hola, <span className="font-medium text-gray-900">{firstName}</span>
        </span>
      )}
      <Link
        href="/listings/new"
        className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        + Publicar libro
      </Link>
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
}
