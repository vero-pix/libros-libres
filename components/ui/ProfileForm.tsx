"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import Image from "next/image";

interface Props {
  userId: string;
  initialFullName: string;
  initialUsername?: string;
  initialPhone: string;
  initialBio?: string;
  initialAvatarUrl?: string | null;
  initialPublicEmail?: string;
  initialInstagram?: string;
  email: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultAddress?: string | null;
  initialPickupPoints?: PickupPoint[];
}

interface PickupPoint {
  label: string;
  comuna?: string | null;
}

const PHONE_REGEX = /^\+56[0-9]{9}$/;
/** Lo que puede ir en /libro/[username]/… sin romper la URL. */
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9.-]{1,38})[a-z0-9]$/;
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
  initialUsername,
  initialPhone,
  initialBio,
  initialAvatarUrl,
  initialPublicEmail,
  initialInstagram,
  email,
  defaultLat,
  defaultLng,
  defaultAddress,
  initialPickupPoints,
}: Props) {
  const supabase = createClient();

  // Datos personales
  const [fullName, setFullName] = useState(initialFullName);
  // El nombre de usuario se generaba solo desde el nombre al registrarse y no
  // había forma de cambiarlo, aunque es lo que sale en la URL pública de cada
  // libro. Un vendedor quedó con uno impresentable y tuvo que pedirlo por
  // correo. (8 ago 2026)
  const [username, setUsername] = useState(initialUsername ?? "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [phone, setPhone] = useState(initialPhone);
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [publicEmail, setPublicEmail] = useState(initialPublicEmail ?? "");
  const [instagram, setInstagram] = useState(initialInstagram ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // El error de la foto se muestra: antes se tragaba con un console.error y el
  // usuario veía que "no pasaba nada". Un vendedor lo intentó cinco veces sin
  // saber que estaba fallando. (5 ago 2026)
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Puntos de entrega en persona (por tienda; idea de Carlos/CIMLibros)
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>(
    (initialPickupPoints ?? []).map((p) => ({ label: p.label ?? "", comuna: p.comuna ?? "" }))
  );
  const addPickupPoint = () => setPickupPoints((prev) => [...prev, { label: "", comuna: "" }]);
  const removePickupPoint = (i: number) => setPickupPoints((prev) => prev.filter((_, idx) => idx !== i));
  const updatePickupPoint = (i: number, field: "label" | "comuna", value: string) =>
    setPickupPoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  // Ubicación
  const [savedAddress, setSavedAddress] = useState(defaultAddress ?? "");
  const [savedCoords, setSavedCoords] = useState<{ lat: number; lng: number } | null>(
    defaultLat != null && defaultLng != null ? { lat: defaultLat, lng: defaultLng } : null
  );
  const [addressQuery, setAddressQuery] = useState("");
  const [geolocating, setGeolocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Propagación a las publicaciones ya hechas. Sin esto, cambiar la ubicación
  // del perfil no arregla nada de lo publicado y el vendedor queda sin salida:
  // hasta el 7-08-2026 había que corregirlo a mano en la base de datos.
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [confirmingApply, setConfirmingApply] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", userId)
      .in("status", ["active", "paused"])
      .then(({ count }) => {
        if (!cancelled) setPublishedCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function saveLocation(lat: number, lng: number, address: string) {
    const { error: err } = await supabase
      .from("users")
      .update({ default_latitude: lat, default_longitude: lng, default_address: address })
      .eq("id", userId);
    if (err) {
      setLocationError("No se pudo guardar la ubicación.");
    } else {
      setSavedAddress(address);
      setSavedCoords({ lat, lng });
      setLocationSaved(true);
      setLocationError(null);
      setAppliedCount(null);
      setConfirmingApply(false);
      setTimeout(() => setLocationSaved(false), 3000);
    }
  }

  /** Copia la ubicación del perfil a todas las publicaciones vivas del vendedor. */
  async function applyLocationToListings() {
    if (!savedCoords || !savedAddress) return;
    setApplying(true);
    setLocationError(null);
    // `listings.location` es columna generada desde latitude/longitude: no se
    // escribe, se recalcula sola.
    const { data, error: err } = await supabase
      .from("listings")
      .update({
        latitude: savedCoords.lat,
        longitude: savedCoords.lng,
        address: savedAddress,
      })
      .eq("seller_id", userId)
      .in("status", ["active", "paused"])
      .select("id");
    setApplying(false);
    setConfirmingApply(false);
    if (err) {
      setLocationError("No se pudieron actualizar las publicaciones. Intenta de nuevo.");
      return;
    }
    setAppliedCount(data?.length ?? 0);
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
    e.preventDefault();
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
    const nuevoUsername = username.trim().toLowerCase();
    const cambioUsername = nuevoUsername !== (initialUsername ?? "").toLowerCase();
    if (cambioUsername && nuevoUsername && !USERNAME_REGEX.test(nuevoUsername)) {
      setUsernameError(
        "Usa entre 3 y 40 caracteres: letras sin tilde, números, puntos o guiones."
      );
      return;
    }
    setUsernameError(null);
    setLoading(true);
    setSaved(false);
    setError(null);

    const cambios: Record<string, unknown> = {
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      public_email: publicEmail.trim() || null,
      instagram: instagram.trim().replace(/^@/, "") || null,
      pickup_points: pickupPoints
        .filter((p) => p.label.trim())
        .map((p) => ({ label: p.label.trim(), comuna: (p.comuna ?? "").trim() || null })),
    };
    // Solo se manda si cambió: mandarlo igual chocaría contra el índice único
    // consigo mismo en algunas configuraciones.
    if (cambioUsername && nuevoUsername) cambios.username = nuevoUsername;

    const { error: updateError } = await supabase.from("users").update(cambios).eq("id", userId);

    setLoading(false);
    if (updateError) {
      // 23505 = violación de unicidad. El mensaje crudo de Postgres no le dice
      // nada a nadie.
      if (updateError.code === "23505" || /duplicate|unique/i.test(updateError.message)) {
        setUsernameError(`"${nuevoUsername}" ya está tomado. Prueba con otro.`);
      } else {
        setError("No se pudieron guardar los cambios: " + updateError.message);
      }
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Logo / Avatar de tienda ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Logo de tu tienda</h2>
          <p className="text-xs text-gray-400 mt-1">Aparece en tu tienda de vendedor y en tus publicaciones.</p>
        </div>
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Logo" width={80} height={80} className="rounded-full object-cover border-2 border-cream-dark" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl font-bold border-2 border-cream-dark">
                {(fullName || "T")[0].toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
            >
              {uploadingAvatar ? (
                <span className="w-3 h-3 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-400">
            <p>JPG o PNG, máximo 2MB</p>
            <p>Recomendado: cuadrado, mínimo 200x200px</p>
            {avatarUrl && (
              <button
                type="button"
                onClick={async () => {
                  setAvatarError(null);
                  setUploadingAvatar(true);
                  // Basta con soltar la referencia en el perfil: el archivo
                  // huérfano en el bucket no se muestra en ninguna parte y
                  // borrarlo depende de una política que no siempre aplica.
                  const { error: delErr } = await supabase
                    .from("users")
                    .update({ avatar_url: null })
                    .eq("id", userId);
                  if (delErr) {
                    setAvatarError("No pudimos quitar la foto. Inténtalo de nuevo.");
                  } else {
                    setAvatarUrl("");
                  }
                  setUploadingAvatar(false);
                }}
                disabled={uploadingAvatar}
                className="mt-1.5 text-gray-500 underline underline-offset-2 hover:text-gray-700 disabled:opacity-50"
              >
                Quitar foto
              </button>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) {
                setAvatarError("La imagen pesa más de 2 MB. Prueba con una más liviana.");
                e.target.value = "";
                return;
              }
              setUploadingAvatar(true);
              setAvatarError(null);
              try {
                const compressed = await compressImage(file, 400, 400, 0.85);
                const ext = "jpg";
                const path = `avatars/${userId}.${ext}`;
                const { error: upErr } = await supabase.storage.from("covers").upload(path, compressed, { upsert: true });
                if (upErr) throw upErr;
                const { data: { publicUrl } } = supabase.storage.from("covers").getPublicUrl(path);
                // Guardar URL limpia en BD, mostrar con cache-buster para forzar
                // recarga en el navegador (la ruta es siempre la misma, el CDN
                // cachea la imagen anterior si no agregamos el timestamp).
                await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", userId);
                setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
              } catch (err) {
                console.error("Avatar upload error:", err);
                setAvatarError(
                  "No pudimos guardar la foto. Vuelve a intentarlo y si sigue fallando escríbenos: es problema nuestro, no tuyo."
                );
              }
              setUploadingAvatar(false);
              // Sin esto, elegir el MISMO archivo dos veces seguidas no dispara
              // el onChange y parece que el botón no hace nada.
              e.target.value = "";
            }}
          />
        </div>
        {avatarError && (
          <p className="px-6 pb-5 -mt-2 text-xs text-red-600">{avatarError}</p>
        )}
      </div>

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
                Nombre de usuario
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-400 transition-colors">
                <span className="pl-3 pr-1 py-2.5 text-sm text-gray-400 select-none whitespace-nowrap">
                  tuslibros.cl/libro/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""));
                    setUsernameError(null);
                  }}
                  placeholder="tu.nombre"
                  className="flex-1 min-w-0 pr-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
              {usernameError ? (
                <p className="text-xs text-red-600 mt-1.5">⚠ {usernameError}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1.5">
                  Es la dirección pública de tus libros. Si la cambias, los enlaces
                  antiguos siguen funcionando, pero conviene actualizar los que tengas
                  compartidos.
                </p>
              )}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email público de contacto
              </label>
              <input
                type="email"
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                placeholder="tienda@ejemplo.cl"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Opcional — visible para compradores como canal de contacto alternativo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Instagram
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                  placeholder="tu_usuario"
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Opcional — se mostrará en tus publicaciones y tu tienda.
              </p>
            </div>
          </div>
        </div>

        {/* ── Puntos de entrega en persona (por tienda) ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Dónde entregas en persona</h2>
            <p className="text-xs text-gray-400 mt-1">
              Si entregas en varios lugares, agrégalos acá. Se muestran en tus libros para
              que el comprador sepa dónde retirar. (Opcional)
            </p>
          </div>
          <div className="px-6 py-5 space-y-3">
            {pickupPoints.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={p.label}
                  onChange={(e) => updatePickupPoint(i, "label", e.target.value)}
                  placeholder="Ej: Metro Los Leones"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <input
                  type="text"
                  value={p.comuna ?? ""}
                  onChange={(e) => updatePickupPoint(i, "comuna", e.target.value)}
                  placeholder="Comuna"
                  className="w-32 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={() => removePickupPoint(i)}
                  aria-label="Quitar punto"
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPickupPoint}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              <span className="text-base leading-none">+</span> Agregar un punto de entrega
            </button>
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
            Pre-rellena el mapa al publicar y, si quieres, corrige de una vez la dirección de
            los libros que ya tienes publicados.
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
          <div className="flex gap-2">
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => { setAddressQuery(e.target.value); setLocationError(null); }}
              onKeyDown={handleAddressSearch}
              placeholder="Escribe una dirección completa..."
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="button"
              onClick={async () => {
                if (!addressQuery.trim()) return;
                setSearching(true);
                setLocationError(null);
                const result = await forwardGeocode(addressQuery.trim());
                setSearching(false);
                if (!result) {
                  setLocationError("No encontramos esa dirección. Intenta ser más específico (ej: Del Mirador 2070, Providencia).");
                  return;
                }
                await saveLocation(result.lat, result.lng, result.address);
                setAddressQuery("");
              }}
              disabled={searching || !addressQuery.trim()}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
            >
              {searching ? "..." : "Buscar"}
            </button>
          </div>

          {locationError && (
            <p className="text-xs text-red-600">⚠ {locationError}</p>
          )}
          {locationSaved && (
            <p className="text-xs text-green-600">✓ Ubicación guardada correctamente.</p>
          )}

          {/* Aplicar a lo ya publicado */}
          {savedAddress && savedCoords && publishedCount != null && publishedCount > 0 && (
            <div className="pt-3 mt-1 border-t border-gray-100 space-y-2">
              {appliedCount != null ? (
                <p className="text-xs text-green-600">
                  ✓ Listo: {appliedCount}{" "}
                  {appliedCount === 1 ? "publicación quedó" : "publicaciones quedaron"} con esta
                  dirección.
                </p>
              ) : confirmingApply ? (
                <>
                  <p className="text-xs text-gray-600">
                    Se le va a poner esta dirección a tus {publishedCount}{" "}
                    {publishedCount === 1 ? "publicación" : "publicaciones"} activas y en pausa.
                    Afecta desde dónde se cotiza el despacho.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={applyLocationToListings}
                      disabled={applying}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-colors"
                    >
                      {applying ? "Actualizando..." : "Sí, aplicar a todas"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingApply(false)}
                      disabled={applying}
                      className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmingApply(true)}
                    className="w-full py-2.5 border border-brand-200 text-brand-700 hover:bg-brand-50 rounded-xl text-sm font-medium transition-colors"
                  >
                    Aplicar esta dirección a mis {publishedCount}{" "}
                    {publishedCount === 1 ? "publicación" : "publicaciones"}
                  </button>
                  <p className="text-xs text-gray-400">
                    Cambiar tu ubicación acá no mueve los libros que ya publicaste. Usa este botón
                    si todos están donde tú estás.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
