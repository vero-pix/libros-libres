"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const siteUrl = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      setError("No pudimos enviar el correo. Revisa que el email sea correcto.");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="group">
            <span className="font-display text-xl font-bold text-ink tracking-tight">
              Libros{" "}
            </span>
            <span className="font-display text-xl font-bold text-brand-600 tracking-tight">
              Libres
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink mt-6">
            Recuperar contraseña
          </h1>
          <p className="text-ink-muted text-sm mt-2">
            Te enviaremos un link para crear una nueva contraseña.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark/30 p-7">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <p className="text-sm text-gray-700">
                Revisa tu correo <strong>{email}</strong>. Te enviamos un link para restablecer tu contraseña.
              </p>
              <p className="text-xs text-gray-400">
                Si no lo ves, revisa tu carpeta de spam.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm text-brand-600 hover:underline font-medium"
              >
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {loading ? "Enviando..." : "Enviar link de recuperación"}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-brand-600 hover:underline font-medium">
                  Volver al login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
