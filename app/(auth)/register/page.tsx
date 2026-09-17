import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { Suspense } from "react";
import RegisterForm from "@/components/auth/RegisterForm";
import { getCities } from "@/lib/cities";
import AuthWantedList from "@/components/auth/AuthWantedList";

export const metadata = {
  title: "Crea tu cuenta",
  robots: { index: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const ciudades = await getCities();
  const wantsToPublish = (searchParams.next ?? "").includes("publish");
  const heading = wantsToPublish ? "Crea tu cuenta y publica" : "Crea tu cuenta";
  const subheading = wantsToPublish
    ? "Es gratis. En un minuto estás subiendo tu libro"
    : "Es gratis y tarda menos de un minuto";

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-cream-warm relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=75')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo />

          <div className="max-w-md">
            <h2 className="font-display text-3xl font-bold text-ink leading-tight">
              Publica tu primer libro{" "}
              <span className="italic text-brand-600">gratis.</span>
            </h2>
            <p className="text-ink-muted mt-4 leading-relaxed">
              Crea tu cuenta en menos de un minuto. Sin comisiones ocultas,
              sin cargos mensuales. Tú decides cuánto cobrar.
            </p>
            <AuthWantedList />
          </div>

          <div className="flex gap-8 text-ink-muted text-sm">
            <div>
              <p className="text-2xl font-bold text-brand-600">$0</p>
              <p>publicar</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-600">10 seg</p>
              <p>escanear ISBN</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-600">24h</p>
              <p>primer envío</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col bg-cream">
        <div className="py-6 px-6 flex items-center justify-between gap-4">
          <Logo className="lg:hidden" />
          <Link
            href="/"
            className="ml-auto text-sm text-ink-muted hover:text-brand-600 transition-colors"
          >
            ← Volver al inicio
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
                <RegisterForm ciudades={ciudades} />
              </Suspense>
            </div>

            <p className="text-center text-xs text-ink-muted mt-8">
              Al registrarte aceptas los{" "}
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
