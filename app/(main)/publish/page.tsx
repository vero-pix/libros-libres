import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
            Escanea el ISBN o ingresa los datos manualmente. Autocompletamos portada, sinopsis y categoría.
          </p>

          {/* Mini steps */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { num: "1", text: "Busca por ISBN" },
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
