"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [refCode, setRefCode] = useState("");
  const [showRefCode, setShowRefCode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setRefCode(ref);
      setShowRefCode(true);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      const msg =
        signUpError.message === "User already registered"
          ? "Ya existe una cuenta con ese correo."
          : signUpError.message;
      setError(msg);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
      });

      // Auto-suscribir al newsletter (no bloquear registro si falla)
      try {
        await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, full_name: fullName }),
        });
      } catch {}

      if (refCode.trim()) {
        try {
          await fetch("/api/referrals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referral_code: refCode.trim() }),
          });
        } catch {
          // no bloquear registro si falla el referido
        }
      }
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="text-5xl">✨</div>
        <h2 className="text-2xl font-display font-bold text-ink">¡Bienvenido a la comunidad!</h2>
        <p className="text-sm text-ink-muted leading-relaxed max-w-xs mx-auto">
          Tu cuenta ha sido creada exitosamente. Ya puedes empezar a comprar, vender o prestar libros.
        </p>
        <Link
          href="/login"
          className="inline-block w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
        >
          Iniciar sesión ahora
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tu nombre
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Ej: María García"
            autoComplete="name"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {showRefCode ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de referido <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="Ej: MARI-A1B2"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 font-mono"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRefCode(true)}
            className="text-xs text-brand-600 hover:underline"
          >
            ¿Tienes un código de referido?
          </button>
        )}

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
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="text-center text-xs text-ink-muted leading-relaxed pt-1">
          Te pedimos dirección y teléfono sólo cuando vayas a publicar o comprar.
        </p>

        <p className="text-center text-sm text-gray-500 pt-2">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
