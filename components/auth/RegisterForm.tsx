"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SocialLoginButtons from "./SocialLoginButtons";
import { nombreSospechoso } from "@/lib/nombreSospechoso";

type Ciudad = { id: string; name: string; region: string };

export default function RegisterForm({ ciudades = [] }: { ciudades?: Ciudad[] }) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [refCode, setRefCode] = useState("");
  const [showRefCode, setShowRefCode] = useState(false);
  const [fullName, setFullName] = useState("");
  // Honeypot anti-bot: oculto para humanos, los bots lo rellenan.
  // Mismo patrón que NewsletterForm y LeadCaptureBar.
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ciudad, setCiudad] = useState("");
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

  // Destino al que volver tras registrarse (ej. /publish). Validado para evitar open redirects.
  const rawNext = searchParams.get("next") ?? "/";
  const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const loginHref =
    safeNext !== "/" ? `/login?next=${encodeURIComponent(safeNext)}` : "/login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot relleno = bot. Fingimos éxito para no darle señal de qué falló.
    if (company) {
      setSuccess(true);
      return;
    }

    // Nombres al azar del tipo "rTrOVifemKCJSUegA": 7 registros así hasta el
    // 28 jul, ninguno publicó nunca, y ensucian el conteo de registros.
    if (nombreSospechoso(fullName)) {
      setError("Escribe tu nombre como lo usas normalmente, por ejemplo María García.");
      return;
    }

    setLoading(true);
    setError(null);

    // Encadenar el destino (ej. /publish) en el callback de confirmación de correo.
    const callbackUrl =
      safeNext !== "/"
        ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(safeNext)}`
        : `${window.location.origin}/api/auth/callback`;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: callbackUrl,
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
      // La comuna se pregunta acá porque el registro nunca la pedía: al 2 de
      // septiembre de 2026, 205 de 357 usuarios no tenían ciudad. Sin ella el
      // mapa los ubica en el centro de Santiago por defecto y el comprador no
      // sabe si el libro está a diez cuadras o en Punta Arenas. Va OPCIONAL:
      // el registro ya pierde gente y un campo obligatorio más pesa.
      await supabase.from("users").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        ...(ciudad ? { city: ciudad } : {}),
      });

      try {
        await fetch("/api/users/generate-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id, fullName }),
        });
      } catch {}

      try {
        await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, full_name: fullName, origen: "registro" }),
        });
      } catch {}

      if (refCode.trim()) {
        try {
          await fetch("/api/referrals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referral_code: refCode.trim() }),
          });
        } catch {}
      }
    }

    // Evento GA4
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'registro_completado', {
        method: 'email'
      });
    }

    // Si la confirmación de correo está OFF, signUp devuelve sesión inmediata:
    // llevamos al usuario directo a donde quería ir (ej. /publish), sin re-loguearse.
    if (data.session && safeNext !== "/") {
      window.location.assign(safeNext);
      return;
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
          href={loginHref}
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
        {/* Honeypot anti-bot: oculto para humanos, los bots lo rellenan */}
        <input
          type="text"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
        />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿De qué comuna eres? <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <select
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Prefiero no decirlo</option>
            {Object.entries(
              ciudades.reduce<Record<string, Ciudad[]>>((acc, c) => {
                (acc[c.region] ??= []).push(c);
                return acc;
              }, {})
            ).map(([region, lista]) => (
              <optgroup key={region} label={region}>
                {lista.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Sirve para que quien busca cerca te encuentre. Lo puedes cambiar después.
          </p>
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
          <Link href={loginHref} className="text-brand-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
        <SocialLoginButtons next={safeNext} />
      </form>
    </div>
  );
}
