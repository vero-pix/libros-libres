import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header mínimo */}
      <div className="py-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-600 font-bold text-xl">
          <span>📚</span> Libros Libres
        </Link>
      </div>

      {/* Card central */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card header */}
            <div className="bg-brand-500 px-8 py-6 text-white text-center">
              <h1 className="text-2xl font-bold">Bienvenido</h1>
              <p className="text-brand-100 text-sm mt-1">Ingresá a tu cuenta para continuar</p>
            </div>

            {/* Form */}
            <div className="px-8 py-7">
              <Suspense>
                <LoginForm />
              </Suspense>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Al ingresar aceptás los{" "}
            <span className="underline cursor-pointer">términos de uso</span>
          </p>
        </div>
      </div>
    </div>
  );
}
