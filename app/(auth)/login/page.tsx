import { Suspense } from "react";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import LoginForm from "@/components/auth/LoginForm";
import AuthWantedList from "@/components/auth/AuthWantedList";
import { createPublicClient } from "@/lib/supabase/public";

// Los números de esta pantalla estaban hardcodeados en "500+ libros" y
// "150+ vendedores". El primero se quedaba corto (hay ~1.900) y el segundo
// era falso al revés: vendedores con libros activos hay ~100. Prometer de
// más justo antes de pagar es lo peor que puede hacer esta página.
// createPublicClient porque unstable_cache no admite cookies().
const getAuthStats = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, count } = await supabase
      .from("listings")
      .select("seller_id, city_id", { count: "exact" })
      .eq("status", "active")
      .range(0, 4999);
    const vendedores = new Set((data ?? []).map((l) => l.seller_id)).size;
    const comunas = new Set(
      (data ?? []).map((l) => l.city_id).filter(Boolean)
    ).size;
    return { libros: count ?? 0, vendedores, comunas };
  },
  ["auth-stats"],
  { revalidate: 3600 }
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const { libros, vendedores, comunas } = await getAuthStats();
  const wantsToPublish = (searchParams.next ?? "").includes("publish");
  const heading = wantsToPublish
    ? "Inicia sesión para publicar"
    : "Bienvenido de vuelta";
  const subheading = wantsToPublish
    ? "Ya casi: entra y sube tu libro en un par de minutos"
    : "Inicia sesión para acceder a tu cuenta";

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-cream-warm relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=75')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="group">
            <span className="font-display text-2xl font-bold text-ink tracking-tight">
              Libros{" "}
            </span>
            <span className="font-display text-2xl font-bold text-brand-600 tracking-tight group-hover:text-brand-500 transition-colors">
              Libres
            </span>
          </Link>

          <div className="max-w-md">
            <h2 className="font-display text-3xl font-bold text-ink leading-tight">
              Donde los libros encuentran{" "}
              <span className="italic text-brand-600">nuevos lectores.</span>
            </h2>
            <p className="text-ink-muted mt-4 leading-relaxed">
              Compra y vende los libros que tienes cerca.
              Desde $3.000, con pago seguro y despacho puerta a puerta.
            </p>
            <AuthWantedList />
          </div>

          <div className="flex gap-8 text-ink-muted text-sm">
            <div>
              <p className="text-2xl font-bold text-brand-600">
                {libros.toLocaleString("es-CL")}
              </p>
              <p>libros publicados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-600">{vendedores}</p>
              <p>vendedores</p>
            </div>
            {/* Antes decía "100% seguro", que promete algo que el flujo no
                tiene: no hay escrow, la plata va al vendedor cuando MP aprueba.
                Las comunas sí son verificables y refuerzan el "cerca de ti". */}
            <div>
              <p className="text-2xl font-bold text-brand-600">{comunas}</p>
              <p>comunas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col bg-cream">
        {/* Mobile logo */}
        <div className="lg:hidden py-6 px-6">
          <Link href="/" className="group">
            <span className="font-display text-xl font-bold text-ink tracking-tight">
              Libros{" "}
            </span>
            <span className="font-display text-xl font-bold text-brand-600 tracking-tight">
              Libres
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="font-display text-2xl font-bold text-ink">
                {heading}
              </h1>
              <p className="text-ink-muted text-sm mt-2">
                {subheading}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-cream-dark/30 p-7">
              <Suspense>
                <LoginForm />
              </Suspense>
            </div>

            <p className="text-center text-xs text-ink-muted mt-8">
              Al ingresar aceptas los{" "}
              <Link href="/terminos" className="underline hover:text-ink">
                términos de uso
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
