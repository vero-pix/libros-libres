import Navbar from "@/components/ui/Navbar";
import Image from "next/image";

export const metadata = {
  title: "Preguntas Frecuentes — Libros Libres",
};

const faqSections = [
  {
    title: "Para compradores",
    questions: [
      {
        q: "¿Cómo compro un libro?",
        a: (
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Busca el libro en el mapa o usa la barra de búsqueda</li>
            <li>Haz clic en el pin del libro que te interesa</li>
            <li>Contacta al vendedor directamente por WhatsApp</li>
            <li>Coordina la entrega o el retiro con el vendedor</li>
          </ol>
        ),
      },
      {
        q: "¿Cuánto cuesta comprar?",
        a: "Libros Libres no cobra comisión. Pagas solo el precio acordado con el vendedor.",
      },
      {
        q: "¿Puedo negociar el precio?",
        a: "Sí, el precio es negociable directamente con el vendedor a través de WhatsApp.",
      },
      {
        q: "¿Cómo sé si el libro está en buen estado?",
        a: (
          <span>
            Cada publicación incluye el estado del libro: <strong>Como nuevo</strong>, <strong>Buen estado</strong>, <strong>Estado regular</strong> o <strong>Con detalles</strong>. También puedes preguntarle directamente al vendedor antes de acordar la compra.
          </span>
        ),
      },
    ],
  },
  {
    title: "Para vendedores",
    questions: [
      {
        q: "¿Cuánto cuesta publicar?",
        a: "Publicar es 100% gratis. No cobramos comisiones en ventas directas entre usuarios.",
      },
      {
        q: "¿Cómo publico un libro?",
        a: (
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Inicia sesión en tu cuenta</li>
            <li>Haz clic en <strong>Publicar libro</strong></li>
            <li>Escanea el código de barras o ingresa el ISBN</li>
            <li>Completa precio y estado del libro</li>
            <li>Marca la ubicación en el mapa</li>
            <li>Tu libro aparece en el mapa al instante</li>
          </ol>
        ),
      },
      {
        q: "¿Cómo me contactan los compradores?",
        a: "Los compradores te escriben directamente por WhatsApp al número que registraste en tu perfil.",
      },
      {
        q: "¿Puedo publicar muchos libros?",
        a: "Sí, sin límite. Puedes publicar toda tu biblioteca.",
      },
      {
        q: "¿Cómo elimino una publicación?",
        a: "Por ahora puedes pausar o eliminar publicaciones desde tu perfil. Si necesitas ayuda, escríbenos a hola@tuslibros.cl",
      },
    ],
  },
  {
    title: "Cuenta y perfil",
    questions: [
      {
        q: "¿Cómo creo una cuenta?",
        a: (
          <span>
            Haz clic en <strong>Registrarse</strong> e ingresa tu nombre, correo y contraseña. No necesitas tarjeta de crédito.
          </span>
        ),
      },
      {
        q: "Olvidé mi contraseña, ¿qué hago?",
        a: (
          <span>
            En la pantalla de inicio de sesión, haz clic en <strong>¿Olvidaste tu contraseña?</strong> para recibir un correo de recuperación.
          </span>
        ),
      },
      {
        q: "¿Puedo usar Libros Libres sin cuenta?",
        a: "Puedes ver el mapa y buscar libros sin cuenta. Para publicar o contactar vendedores necesitas registrarte.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80"
          alt="Librería"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-2">Preguntas Frecuentes</h1>
          <p className="text-gray-200 text-lg max-w-xl">Resolvemos tus dudas sobre Libros Libres</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {faqSections.map((section) => (
          <div key={section.title} className="mb-10">
            <h2 className="text-2xl font-bold text-[#2d3436] mb-4 border-b-2 border-[#d4a017] pb-2 inline-block">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.questions.map((item) => (
                <div
                  key={item.q}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="bg-[#2d3436] px-5 py-3">
                    <h3 className="font-semibold text-white text-base">{item.q}</h3>
                  </div>
                  <div className="px-5 py-4 text-gray-700 leading-relaxed">
                    {typeof item.a === "string" ? <p>{item.a}</p> : item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
