import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto">
      {/* Newsletter */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">Newsletter</h3>
            <p className="text-sm text-gray-500 mt-1">
              Suscríbete para obtener guías, descuentos y novedades de Libros Libres
            </p>
          </div>
          <form className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              placeholder="Email"
              className="flex-1 md:w-72 px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-md text-sm transition-colors whitespace-nowrap"
            >
              Suscríbete
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Categorías</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link href="/?genre=Ficción" className="hover:text-gray-700 transition-colors">Ficción</Link></li>
              <li><Link href="/?genre=Ciencia" className="hover:text-gray-700 transition-colors">Ciencia</Link></li>
              <li><Link href="/?genre=Historia" className="hover:text-gray-700 transition-colors">Historia</Link></li>
              <li><Link href="/?genre=Infantil" className="hover:text-gray-700 transition-colors">Infantil</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Información</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link href="/sobre-nosotros" className="hover:text-gray-700 transition-colors">Sobre nosotros</Link></li>
              <li><Link href="/como-funciona" className="hover:text-gray-700 transition-colors">Cómo funciona</Link></li>
              <li><Link href="/faq" className="hover:text-gray-700 transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Legal</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link href="/terminos" className="hover:text-gray-700 transition-colors">Términos y condiciones</Link></li>
              <li><Link href="/privacidad" className="hover:text-gray-700 transition-colors">Privacidad</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Enlaces rápidos</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link href="/publish" className="hover:text-gray-700 transition-colors">Vende tu libro</Link></li>
              <li><Link href="/mapa" className="hover:text-gray-700 transition-colors">Mapa</Link></li>
              <li><Link href="/search" className="hover:text-gray-700 transition-colors">Buscar</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Libros Libres — tuslibros.cl</span>
          <span>Libre, sin comisiones</span>
        </div>
      </div>
    </footer>
  );
}
