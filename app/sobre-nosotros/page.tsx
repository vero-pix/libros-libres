import Navbar from "@/components/ui/Navbar";
import Image from "next/image";

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
      <Navbar />

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
          <div className="bg-[#d4a017]/10 rounded-xl p-6 text-center border border-[#d4a017]/30">
            <h2 className="text-xl font-bold text-[#2d3436] mb-2">Contacto</h2>
            <p className="text-gray-600 mb-2">¿Tienes sugerencias, reportes de abuso o necesitas ayuda?</p>
            <p className="text-[#2d3436] font-semibold">
              Escríbenos a <a href="mailto:hola@tuslibros.cl" className="text-[#2b6cb0] hover:underline">hola@tuslibros.cl</a> — respondemos en menos de 48 horas.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
