import type { Metadata } from "next";
import Link from "next/link";
import SponsorCard from "@/components/home/SponsorCard";
import SponsorRequestForm from "@/components/sponsor/SponsorRequestForm";

export const metadata: Metadata = {
  title: "Gente de confianza",
  description:
    "Profesores, talleres y servicios de gente cercana a tuslibros.cl. Contactos que usamos y que funcionan.",
  alternates: { canonical: "https://tuslibros.cl/gente-de-confianza" },
};

export default function GenteDeConfianzaPage() {
  return (
    <div className="min-h-screen bg-cream">
      <section className="bg-cream-warm border-b border-cream-dark">
        <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-600 mb-3">
            Gente de confianza
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-ink leading-tight mb-4">
            Gente que{" "}
            <span className="italic text-brand-600">recomiendo yo.</span>
          </h1>
          <p className="text-ink-muted max-w-2xl mx-auto leading-relaxed">
            Profesores, talleres y servicios de gente cercana a tuslibros. No es
            publicidad fría — son contactos que uso, que funcionan, y que le
            presento a quien me pregunta.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SponsorCard
            name="Jose María Ruiz de Gamboa Velásquez"
            tagline="Profesor · Excel · Power BI · VBA · Portugués"
            avatarInitials="JM"
            rating={5.0}
            reviewsCount={13}
            bio="Economista con +5 años en mercados financieros y +10 años de experiencia docente. Clases prácticas, adaptadas a tu nivel y objetivo real. Desde fórmulas básicas hasta dashboards avanzados, automatización y análisis estratégico de datos. También clases de portugués para todos los niveles."
            stats={[
              { label: "Experiencia", value: "+10 años" },
              { label: "Nivel", value: "Todos" },
              { label: "1ra clase", value: "Gratis", highlight: true },
            ]}
            tags={["Excel", "Power BI", "VBA", "Análisis de datos", "Portugués"]}
            whatsapp="+55 11 97694-4948"
          />
        </div>
      </section>

      <section className="bg-white border-y border-cream-dark">
        <div className="max-w-2xl mx-auto px-6 py-14">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-3">
              ¿Quieres aparecer acá?
            </h2>
            <p className="text-ink-muted leading-relaxed max-w-xl mx-auto">
              Elijo uno por uno. Son contactos que conozco personalmente o que
              alguien de confianza me presenta. Cuéntame qué haces y por qué
              encajas con la página.
            </p>
          </div>
          <SponsorRequestForm />
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-10 text-center">
        <Link href="/" className="text-sm text-ink-muted hover:text-brand-600">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
