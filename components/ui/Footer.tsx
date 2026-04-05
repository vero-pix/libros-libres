import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="mt-auto">
      {/* Newsletter */}
      <div className="bg-cream-warm border-t border-cream-dark">
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-ink">Newsletter</h3>
            <p className="text-sm text-ink-muted mt-2 max-w-sm">
              Recibe recomendaciones, novedades y libros destacados cada semana.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Links */}
      <div className="bg-cream border-t border-cream-dark">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-display font-bold text-ink mb-4 text-sm">Categorías</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/?genre=Ficción" className="hover:text-ink transition-colors">Ficción</Link></li>
              <li><Link href="/?genre=Ciencia" className="hover:text-ink transition-colors">Ciencia</Link></li>
              <li><Link href="/?genre=Historia" className="hover:text-ink transition-colors">Historia</Link></li>
              <li><Link href="/?genre=Infantil" className="hover:text-ink transition-colors">Infantil</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-ink mb-4 text-sm">Información</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/sobre-nosotros" className="hover:text-ink transition-colors">Sobre nosotros</Link></li>
              <li><Link href="/como-funciona" className="hover:text-ink transition-colors">Cómo funciona</Link></li>
              <li><Link href="/faq" className="hover:text-ink transition-colors">FAQ</Link></li>
              <li><Link href="/historia" className="hover:text-ink transition-colors">Nuestra historia</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-ink mb-4 text-sm">Legal</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/terminos" className="hover:text-ink transition-colors">Términos y condiciones</Link></li>
              <li><Link href="/privacidad" className="hover:text-ink transition-colors">Privacidad</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-ink mb-4 text-sm">Accesos</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/publish" className="hover:text-ink transition-colors">Vende tu libro</Link></li>
              <li><Link href="/mapa" className="hover:text-ink transition-colors">Mapa</Link></li>
              <li><Link href="/search" className="hover:text-ink transition-colors">Buscar</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-cream-dark bg-cream-warm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-muted">
          <span>© {new Date().getFullYear()} Libros Libres — tuslibros.cl</span>
          <span className="font-display italic">Libre, sin comisiones</span>
        </div>
      </div>
    </footer>
  );
}
