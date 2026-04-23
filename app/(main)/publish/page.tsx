import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PublishForm from "@/components/listings/PublishForm";

export default async function PublishPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/publish");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("phone, default_latitude, default_longitude, default_address")
    .eq("id", user.id)
    .single();

  const defaultLocation =
    profile?.default_latitude != null && profile?.default_longitude != null
      ? {
          lat: profile.default_latitude as number,
          lng: profile.default_longitude as number,
          address: (profile.default_address as string | null) ?? "",
        }
      : null;

  // Campos mínimos para publicar: teléfono + dirección (lat/lng)
  const missingPhone = !profile?.phone;
  const missingAddress = !defaultLocation;
  const profileIncomplete = missingPhone || missingAddress;

  if (profileIncomplete) {
    return (
      <div className="min-h-screen bg-cream">
        <main className="max-w-xl mx-auto px-4 py-16">
          <div className="bg-white rounded-xl border border-amber-300 p-8 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-4">
              <span className="text-xs font-semibold text-amber-700">
                Un paso más antes de publicar
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-3">
              Completa tu perfil
            </h1>
            <p className="text-ink-muted text-sm mb-6 leading-relaxed">
              Para que tu libro pueda ser comprado con entrega en persona o por
              courier, necesitamos estos datos tuyos:
            </p>
            <ul className="text-left inline-block space-y-2 mb-6">
              <li
                className={`flex items-center gap-2 text-sm ${missingPhone ? "text-amber-800" : "text-green-700"}`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current/10">
                  {missingPhone ? "!" : "✓"}
                </span>
                <span>
                  <strong>Teléfono</strong>{" "}
                  <span className="text-ink-muted">— para coordinar con compradores por WhatsApp</span>
                </span>
              </li>
              <li
                className={`flex items-center gap-2 text-sm ${missingAddress ? "text-amber-800" : "text-green-700"}`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center bg-current/10">
                  {missingAddress ? "!" : "✓"}
                </span>
                <span>
                  <strong>Dirección / ubicación</strong>{" "}
                  <span className="text-ink-muted">— para calcular cercanía y cotizar envíos</span>
                </span>
              </li>
            </ul>
            <div>
              <Link
                href="/perfil?next=/publish"
                className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Completar mi perfil
              </Link>
            </div>
            <p className="text-xs text-ink-muted mt-4">
              Te tomas 30 segundos y vuelves acá a publicar.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* Hero de publicación */}
      <section className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 px-4 py-1.5 rounded-full mb-4">
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-xs font-semibold text-brand-700">Siempre gratis</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
            Publica tu libro
          </h1>
          <p className="text-ink-muted mt-3 max-w-md mx-auto leading-relaxed">
            Escanea el ISBN, búscalo con el número, o ingrésalo a mano si no lo tienes. Nosotros completamos portada, sinopsis y categoría — tú solo ponle precio.
          </p>

          {/* Mini steps */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { num: "1", text: "Busca el libro (o ingreso manual)" },
              { num: "2", text: "Ponle precio" },
              { num: "3", text: "Marca ubicación" },
            ].map((step, i) => (
              <div key={step.num} className="flex items-center gap-2">
                {i > 0 && (
                  <svg className="w-4 h-4 text-cream-dark -ml-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                  {step.num}
                </span>
                <span className="text-xs font-medium text-ink">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explicación del despacho puerta a puerta */}
      <section className="bg-white border-b border-cream-dark">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-brand-600 font-semibold mb-3 text-center">
            Y cuando alguien lo compre…
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-cream-warm border border-cream-dark/40 rounded-xl p-4">
              <p className="text-xl mb-1">🚪</p>
              <p className="font-semibold text-ink text-sm mb-1">Retiro en mano</p>
              <p className="text-xs text-ink-muted leading-relaxed">
                El comprador pasa a buscar tu libro. Coordinan por WhatsApp.
              </p>
            </div>
            <div className="bg-cream-warm border border-cream-dark/40 rounded-xl p-4">
              <p className="text-xl mb-1">📦</p>
              <p className="font-semibold text-ink text-sm mb-1">Despacho con Shipit</p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Imprimes la etiqueta que te genera el sistema y el courier de Shipit pasa a buscar el libro a tu casa. No tienes que ir a ninguna oficina.
              </p>
            </div>
          </div>

          {/* ¿Tienes muchos libros? Te ayudo yo. */}
          <a
            href="https://wa.me/56994583067?text=Hola%20Vero%2C%20tengo%20varios%20libros%20para%20publicar%20en%20tuslibros.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-start gap-3 bg-gradient-to-br from-brand-50 to-amber-50 border border-brand-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
          >
            <span className="text-2xl flex-shrink-0">📚</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink text-sm mb-1">
                ¿Tienes muchos libros? Te ayudo yo.
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Si tienes una ruma entera, no pierdas la tarde subiéndolos de a uno. Mándame un Excel con los títulos, o una foto de la pila apilada por WhatsApp y yo los cargo por ti. — Vero
              </p>
              <p className="text-xs text-brand-700 font-medium mt-2 group-hover:underline">
                Escribirme por WhatsApp →
              </p>
            </div>
          </a>
        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <PublishForm
          userId={user.id}
          existingPhone={profile?.phone ?? null}
          defaultLocation={defaultLocation}
        />
      </main>
    </div>
  );
}
