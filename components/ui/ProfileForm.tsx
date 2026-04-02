"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  initialFullName: string;
  initialPhone: string;
  email: string;
}

const PHONE_REGEX = /^\+56[0-9]{9}$/;

export default function ProfileForm({ userId, initialFullName, initialPhone, email }: Props) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone && !PHONE_REGEX.test(phone)) {
      setPhoneError("Formato inválido. Usa +56 seguido de 9 dígitos. Ej: +56912345678");
      return;
    }

    setLoading(true);
    setSaved(false);
    setError(null);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
      })
      .eq("id", userId);

    setLoading(false);

    if (updateError) {
      setError("No se pudieron guardar los cambios. Intenta de nuevo.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Datos personales</h2>
        </div>
        <div className="px-6 py-5 space-y-4">

          {/* Email — solo lectura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar.</p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.trim());
                setPhoneError(null);
              }}
              placeholder="+56912345678"
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
                phoneError ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            />
            {phoneError ? (
              <p className="text-xs text-red-600 mt-1.5">⚠ {phoneError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5">
                Formato: +56912345678 — se muestra a compradores en tus publicaciones.
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">⚠ {error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors"
      >
        {loading ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
      </button>
    </form>
  );
}
