import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
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
              Compra, vende y arrienda los libros que tienes cerca.
              Desde $3.000, con pago seguro y despacho puerta a puerta.
            </p>
          </div>

          <div className="flex gap-8 text-ink-muted text-sm">
            <div>
              <p className="text-2xl font-bold text-brand-600">500+</p>
              <p>libros</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-600">150+</p>
              <p>vendedores</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-600">100%</p>
              <p>seguro</p>
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
                Bienvenido de vuelta
              </h1>
              <p className="text-ink-muted text-sm mt-2">
                Inicia sesión para acceder a tu cuenta
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
