import Link from "next/link";
import { Suspense } from "react";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-cream-warm relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=75')] bg-cover bg-center opacity-10" />
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
              Publica tu primer libro{" "}
              <span className="italic text-brand-600">gratis.</span>
            </h2>
            <p className="text-ink-muted mt-4 leading-relaxed">
              Crea tu cuenta en menos de un minuto. Sin comisiones ocultas,
              sin cargos mensuales. Tú decides cuánto cobrar.
            </p>
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
                Crea tu cuenta
              </h1>
              <p className="text-ink-muted text-sm mt-2">
                Es gratis y tarda menos de un minuto
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-cream-dark/30 p-7">
              <Suspense>
                <RegisterForm />
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
