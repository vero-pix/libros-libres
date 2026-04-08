"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SocialLoginButtons from "./SocialLoginButtons";
import { REGIONES_CHILE } from "@/lib/comunas";

export default function RegisterForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [refCode, setRefCode] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setRefCode(ref);
  }, [searchParams]);
  const [country, setCountry] = useState("Chile");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Crear usuario en Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, city },
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

    // 2. Upsert perfil en public.users (complementa el trigger del schema)
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        city,
      });

      // 3. Register referral if code present
      if (refCode.trim()) {
        try {
          await fetch("/api/referrals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referral_code: refCode.trim() }),
          });
        } catch {
          // Don't block registration if referral fails
        }
      }
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-5xl">📬</div>
        <h2 className="text-lg font-semibold text-gray-900">¡Revisa tu correo!</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Te enviamos un link de confirmación a{" "}
          <strong className="text-gray-800">{email}</strong>.
          <br />
          Haz clic en el link para activar tu cuenta.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 text-sm text-brand-600 hover:underline font-medium"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre completo
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
        <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
        <select
          value={country}
          onChange={(e) => { setCountry(e.target.value); setRegion(""); setCity(""); }}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        >
          <option value="Chile">Chile</option>
          <option value="Otro">Otro país</option>
        </select>
      </div>

      {country === "Chile" ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
            <select
              value={region}
              onChange={(e) => { setRegion(e.target.value); setCity(""); }}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="">Selecciona región</option>
              {Object.keys(REGIONES_CHILE).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {region && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                <option value="">Selecciona comuna</option>
                {REGIONES_CHILE[region].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            placeholder="Tu ciudad"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      )}

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

      <p className="text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand-600 hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>

      <SocialLoginButtons />
    </form>
  );
}
