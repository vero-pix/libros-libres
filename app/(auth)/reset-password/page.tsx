"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mensajeErrorClave } from "@/lib/authErrors";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // El código es de UN SOLO USO: apenas `verifyOtp` responde OK queda quemado,
  // aunque después falle el cambio de clave. Si no recordáramos que ya se usó,
  // el segundo intento lo reenviaría y Supabase respondería "otp_expired" —
  // que fue exactamente lo que le pasó a Rodrigo Cumsille el 21-09-2026: su
  // clave era débil, el error real quedaba oculto, y al reintentar le decíamos
  // que el código estaba vencido. Con la sesión ya abierta basta con pedirle
  // una contraseña nueva.
  const [codigoYaUsado, setCodigoYaUsado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanCode = code.replace(/\s/g, "");
    if (!codigoYaUsado) {
      if (!email) {
        setError("Escribe tu correo.");
        return;
      }
      if (!/^\d{6,10}$/.test(cleanCode)) {
        setError("Revisa el código: son los dígitos que te llegaron por correo.");
        return;
      }
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    // 1) Validamos el código (OTP de recuperación). Esto abre una sesión
    //    temporal para poder cambiar la clave. El código es de un solo uso.
    if (!codigoYaUsado) {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: cleanCode,
        type: "recovery",
      });

      if (otpError) {
        setError(
          "El código no es válido o ya expiró. Pide uno nuevo desde “¿Olvidaste tu contraseña?”."
        );
        setLoading(false);
        return;
      }

      setCodigoYaUsado(true);
    }

    // 2) Con la sesión abierta, seteamos la nueva contraseña.
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      // El motivo viene en el error (clave filtrada, muy corta, igual a la
      // anterior). Mostrarlo traducido en vez de un "intenta de nuevo" que no
      // le dice a nadie qué corregir.
      setError(mensajeErrorClave(updateError.message));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo />
          <h1 className="font-display text-2xl font-bold text-ink mt-6">
            Nueva contraseña
          </h1>
          <p className="text-ink-muted text-sm mt-2">
            Escribe el código que te enviamos por correo y elige tu nueva
            contraseña.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark/30 p-7">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">✓</div>
              <p className="text-sm text-gray-700 font-medium">
                Contraseña actualizada correctamente.
              </p>
              <p className="text-xs text-gray-400">Redirigiendo...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {codigoYaUsado ? (
                <p className="text-sm text-gray-700 bg-cream border border-cream-dark/40 px-3 py-2 rounded-xl">
                  Tu código ya quedó validado — no hace falta escribirlo de
                  nuevo. Solo elige una contraseña que sí podamos aceptar.
                </p>
              ) : (
                <>
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
                      Código del correo
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      maxLength={10}
                      placeholder="12345678"
                      autoComplete="one-time-code"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Mínimo 6 caracteres. No aceptamos contraseñas que aparezcan en
                  filtraciones conocidas (tipo &ldquo;123456&rdquo; o &ldquo;password&rdquo;).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
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
                {loading ? "Actualizando..." : "Guardar nueva contraseña"}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link
                  href="/forgot-password"
                  className="text-brand-600 hover:underline font-medium"
                >
                  Pedir un código nuevo
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
