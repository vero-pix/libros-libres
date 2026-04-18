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
              <li><Link href="/?category=ficcion" className="hover:text-brand-600 transition-colors">Ficción</Link></li>
              <li><Link href="/?category=no-ficcion" className="hover:text-brand-600 transition-colors">No ficción</Link></li>
              <li><Link href="/?category=academicos" className="hover:text-brand-600 transition-colors">Académicos</Link></li>
              <li><Link href="/?category=coleccionables" className="hover:text-brand-600 transition-colors">Coleccionables</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-ink mb-4 text-sm">Información</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/sobre-nosotros" className="hover:text-brand-600 transition-colors">Sobre nosotros</Link></li>
              <li><Link href="/historia" className="hover:text-brand-600 transition-colors">Nuestra historia</Link></li>
              <li><Link href="/como-funciona" className="hover:text-brand-600 transition-colors">Cómo funciona</Link></li>
              <li><Link href="/faq" className="hover:text-brand-600 transition-colors">FAQ</Link></li>
              <li><Link href="/alianzas" className="hover:text-brand-600 transition-colors">Alianzas <span className="text-[10px] text-ink-muted/70">(próximamente)</span></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-ink mb-4 text-sm">Legal</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/terminos" className="hover:text-brand-600 transition-colors">Términos y condiciones</Link></li>
              <li><Link href="/privacidad" className="hover:text-brand-600 transition-colors">Privacidad</Link></li>
              <li><Link href="/devoluciones" className="hover:text-brand-600 transition-colors">Devoluciones</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold text-ink mb-4 text-sm">Accesos</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/publish" className="hover:text-brand-600 transition-colors">Vende tu libro</Link></li>
              <li><Link href="/search" className="hover:text-brand-600 transition-colors">Buscar</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-cream-dark bg-cream-warm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
          <span>© {new Date().getFullYear()} Libros Libres — tuslibros.cl</span>
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/tuslibros/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Tuslibros en LinkedIn"
              className="text-ink-muted hover:text-brand-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.339 18.338v-8.65H5.667v8.65h2.672zM7.004 8.56a1.548 1.548 0 1 0 0-3.096 1.548 1.548 0 0 0 0 3.096zm11.335 9.777v-4.919c0-2.311-.5-4.087-3.2-4.087-1.3 0-2.17.711-2.526 1.388h-.037V9.688h-2.56v8.65h2.667v-4.28c0-1.128.214-2.22 1.613-2.22 1.379 0 1.397 1.289 1.397 2.292v4.208h2.646z" />
              </svg>
            </a>
            <a
              href="https://x.com/tuslibroscl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Tuslibros en X"
              className="text-ink-muted hover:text-brand-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <a href="mailto:vero@economics.cl" className="hover:text-brand-600 transition-colors">¿Dudas? vero@economics.cl</a>
        </div>
      </div>
    </footer>
  );
}
