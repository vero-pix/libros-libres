import Image from "next/image";
import ContactForm from "@/components/ui/ContactForm";

export const metadata = {
  title: "Sobre Nosotros — Libros Libres",
};

const values = [
  { icon: "🆓", title: "Gratuito", description: "Publicar siempre será gratis" },
  { icon: "⚡", title: "Simple", description: "Escanea, publica, vende — en menos de un minuto" },
  { icon: "📍", title: "Local", description: "Conectamos vecinos lectores en el mismo barrio" },
  { icon: "🤝", title: "Directo", description: "Sin plataformas de pago intermedias" },
];

const steps = [
  "Publica tu libro en segundos escaneando el código de barras",
  "Aparece en el mapa para compradores cercanos",
  "Se contactan por WhatsApp y coordinan directamente",
  "Sin comisiones, sin intermediarios, sin complicaciones",
];

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80"
          alt="Comunidad"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-2">Sobre Libros Libres</h1>
          <p className="text-gray-200 text-lg max-w-xl">La historia detrás de Libros Libres</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Mission Card */}
        <section className="mb-12">
          <div className="bg-[#2d3436] rounded-xl p-8 text-center border-l-4 border-[#d4a017]">
            <h2 className="text-sm uppercase tracking-widest text-[#d4a017] font-semibold mb-3">Nuestra misión</h2>
            <p className="text-white text-xl leading-relaxed font-light">
              Facilitar el acceso a libros usados conectando lectores cercanos de forma simple y directa, sin intermediarios.
            </p>
          </div>
        </section>

        {/* Origin Story */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#2d3436] mb-4 border-b-2 border-[#d4a017] pb-2 inline-block">
            Cómo empezó
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              Libros Libres nació de una necesidad simple: encontrar libros usados cerca de casa sin pasar por plataformas complicadas, sin comisiones abusivas y sin esperar días de despacho.
            </p>
            <p className="text-gray-700 leading-relaxed">
              La idea es sencilla: si alguien en tu barrio tiene el libro que buscas, ¿por qué no conectarlos directamente?
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#2d3436] mb-4 border-b-2 border-[#d4a017] pb-2 inline-block">
            Cómo funciona
          </h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4a017] text-white flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#2d3436] mb-6 border-b-2 border-[#d4a017] pb-2 inline-block">
            Nuestros valores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
                <div className="text-3xl mb-2">{v.icon}</div>
                <h3 className="font-bold text-[#2d3436] mb-1">{v.title}</h3>
                <p className="text-gray-600 text-sm">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who is it for */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-[#2d3436] mb-4 border-b-2 border-[#d4a017] pb-2 inline-block">
            ¿Para quién es?
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-gray-700 leading-relaxed">
              Para cualquier persona en Chile que quiera darle una segunda vida a sus libros o encontrar lecturas a buen precio cerca de su casa.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="bg-brand-50 rounded-xl p-6 text-center border border-brand-200">
            <h2 className="text-xl font-bold text-ink mb-2">Contacto</h2>
            <p className="text-ink-muted mb-4">¿Tienes sugerencias, reportes de abuso o necesitas ayuda?</p>
            <a
              href="https://wa.me/56994583067?text=Hola%2C%20tengo%20una%20consulta%20sobre%20tuslibros.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Escríbenos por WhatsApp
            </a>
            <p className="text-xs text-ink-muted mt-3">Respondemos en menos de 24 horas</p>
          </div>
        </section>

        {/* Contact form */}
        <section>
          <ContactForm />
        </section>
      </main>
    </div>
  );
}
