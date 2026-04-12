"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User | null;
  displayName: string | null;
  initialCartCount?: number;
}

export default function NavbarClient({ user, displayName, initialCartCount = 0 }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [cartCount, setCartCount] = useState(initialCartCount);

  const refetchCart = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json();
      setCartCount(Array.isArray(data.items) ? data.items.length : 0);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  useEffect(() => {
    function handler() {
      refetchCart();
    }
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [refetchCart]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const firstName = displayName?.split(" ")[0] ?? null;

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
        >
          Regístrate
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
        href="/carrito"
        className="relative text-gray-500 hover:text-gray-700 transition-colors"
        title="Mi carrito"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>
      <Link
        href="/publish"
        className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-medium px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
      >
        + Publicar libro
      </Link>
      <Link
        href="/perfil"
        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        title="Mi perfil"
      >
        Perfil
      </Link>
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  );
}
