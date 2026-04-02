import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <span>© {new Date().getFullYear()} Libros Libres — tuslibros.cl</span>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/sobre-nosotros" className="hover:text-gray-600 transition-colors">
            Sobre nosotros
          </Link>
          <Link href="/faq" className="hover:text-gray-600 transition-colors">
            FAQ
          </Link>
          <Link href="/terminos" className="hover:text-gray-600 transition-colors">
            Términos
          </Link>
          <Link href="/privacidad" className="hover:text-gray-600 transition-colors">
            Privacidad
          </Link>
          <Link href="/como-funciona" className="hover:text-gray-600 transition-colors">
            Cómo funciona
          </Link>
        </nav>
      </div>
    </footer>
  );
}
