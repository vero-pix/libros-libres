"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  initialFullName: string;
  initialPhone: string;
  initialBio?: string;
  email: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultAddress?: string | null;
}

const PHONE_REGEX = /^\+56[0-9]{9}$/;
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

async function reverseGeocode(lng: number, lat: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&language=es&types=address,neighborhood,locality`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function forwardGeocode(query: string): Promise<{ lng: number; lat: number; address: string } | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&language=es&country=cl&types=address,place,locality`
    );
    const data = await res.json();
    if (!data.features?.length) return null;
    const f = data.features[0];
    const [lng, lat] = f.center as [number, number];
    return { lng, lat, address: f.place_name as string };
  } catch {
    return null;
  }
}

export default function ProfileForm({
  userId,
  initialFullName,
  initialPhone,
  initialBio,
  email,
  defaultLat,
  defaultLng,
  defaultAddress,
}: Props) {
  const supabase = createClient();

  // Datos personales
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [bio, setBio] = useState(initialBio ?? "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ubicación
  const [savedAddress, setSavedAddress] = useState(defaultAddress ?? "");
  const [addressQuery, setAddressQuery] = useState("");
  const [geolocating, setGeolocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function saveLocation(lat: number, lng: number, address: string) {
    const { error: err } = await supabase
      .from("users")
      .update({ default_latitude: lat, default_longitude: lng, default_address: address })
      .eq("id", userId);
    if (err) {
      setLocationError("No se pudo guardar la ubicación.");
    } else {
      setSavedAddress(address);
      setLocationSaved(true);
      setLocationError(null);
      setTimeout(() => setLocationSaved(false), 3000);
    }
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización.");
      return;
    }
    setGeolocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const address = await reverseGeocode(lng, lat);
        await saveLocation(lat, lng, address);
        setGeolocating(false);
      },
      () => {
        setGeolocating(false);
        setLocationError("No se pudo obtener tu ubicación. Verifica los permisos del navegador.");
      },
      { timeout: 10000 }
    );
  }

  async function handleAddressSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !addressQuery.trim()) return;
    setSearching(true);
    setLocationError(null);
    const result = await forwardGeocode(addressQuery.trim());
    setSearching(false);
    if (!result) {
      setLocationError("No encontramos esa dirección. Intenta con otra.");
      return;
    }
    await saveLocation(result.lat, result.lng, result.address);
    setAddressQuery("");
  }

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
        bio: bio.trim() || null,
      })
      .eq("id", userId);

    setLoading(false);
    if (updateError) {
      setError("No se pudieron guardar los cambios: " + updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Datos personales ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Datos personales</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.trim()); setPhoneError(null); }}
                placeholder="+56912345678"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
                  phoneError ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
              />
              {phoneError ? (
                <p className="text-xs text-red-600 mt-1.5">⚠ {phoneError}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1.5">
                  Formato: +56912345678 — visible para compradores en tus publicaciones.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción de tu tienda
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntales a los compradores qué tipo de libros vendes, tu especialidad, etc."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {bio.length}/500 — Aparece en tu tienda de vendedor.
              </p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 text-center">⚠ {error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors"
        >
          {loading ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </form>

      {/* ── Ubicación por defecto ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Ubicación por defecto</h2>
          <p className="text-xs text-gray-400 mt-1">
            Se usa para pre-rellenar el mapa al publicar un libro.
          </p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {/* Dirección guardada actualmente */}
          {savedAddress ? (
            <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <span className="text-green-600 mt-0.5 flex-shrink-0">📍</span>
              <p className="text-sm text-green-800">{savedAddress}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin ubicación guardada.</p>
          )}

          {/* Botón GPS */}
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geolocating}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {geolocating ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            )}
            {geolocating ? "Obteniendo ubicación..." : (defaultLat ? "Actualizar con GPS" : "Usar mi ubicación actual")}
          </button>

          {/* Búsqueda por dirección */}
          <div className="relative">
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => { setAddressQuery(e.target.value); setLocationError(null); }}
              onKeyDown={handleAddressSearch}
              placeholder="O escribe una dirección y presiona Enter..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 pr-8"
            />
            {searching && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            )}
          </div>

          {locationError && (
            <p className="text-xs text-red-600">⚠ {locationError}</p>
          )}
          {locationSaved && (
            <p className="text-xs text-green-600">✓ Ubicación guardada correctamente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
