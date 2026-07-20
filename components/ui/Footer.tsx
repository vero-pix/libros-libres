import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="mt-auto">
      {/* Footer reforzado — tres destacados */}
      <div className="bg-cream border-t border-line">
        <div className="max-w-6xl mx-auto px-6 pt-12">
          {/* Grilla a 2 columnas: "Gente de confianza" guardada por ahora (20 jul 2026). Volver a sm:grid-cols-3 al revivirla. */}
          <div className="grid sm:grid-cols-2 rounded-2xl border border-line overflow-hidden bg-paper-card">
            <Link href="/solicitudes" className="group p-6 sm:p-7 border-b sm:border-b-0 sm:border-r border-line hover:bg-cream-warm/50 transition-colors">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-coral font-semibold">Economía inversa</p>
              <h4 className="font-display text-xl text-ink mt-3 mb-2 tracking-[-0.01em]">Se busca</h4>
              <p className="text-[13px] text-ink-muted leading-relaxed">¿No está en el catálogo? Pídelo. Alguien cerca de ti puede tenerlo durmiendo en su estante.</p>
            </Link>
            {/* Guardada por ahora — "Gente de confianza" (sección vacía, sin contactos aún):
            <Link href="/gente-de-confianza" className="group p-6 sm:p-7 border-b sm:border-b-0 sm:border-r border-line hover:bg-cream-warm/50 transition-colors">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-coral font-semibold">Gente de confianza</p>
              <h4 className="font-display text-xl text-ink mt-3 mb-2 tracking-[-0.01em]">Vendedores reales</h4>
              <p className="text-[13px] text-ink-muted leading-relaxed">Personas y librerías de viejo con pago protegido por MercadoPago y reseñas. Sabes a quién le compras.</p>
            </Link>
            */}
            <Link href="/?category=escolar" className="group p-6 sm:p-7 hover:bg-cream-warm/50 transition-colors">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-coral font-semibold">De vuelta a clases</p>
              <h4 className="font-display text-xl text-ink mt-3 mb-2 tracking-[-0.01em]">Libros escolares</h4>
              <p className="text-[13px] text-ink-muted leading-relaxed">Listas del MINEDUC, textos de estudio y lectura complementaria — usados, a precio honesto.</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-cream-warm border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl text-ink">Newsletter</h3>
            <p className="text-sm text-ink-muted mt-2 max-w-sm">
              Recibe recomendaciones, novedades y libros destacados cada semana.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Links */}
      <div className="bg-cream border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink mb-4 font-semibold">Categorías</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/?subcategory=ficcion-novela" className="hover:text-coral transition-colors">Novela y Ficción</Link></li>
              <li><Link href="/?subcategory=ficcion-poesia" className="hover:text-coral transition-colors">Poesía</Link></li>
              <li><Link href="/?subcategory=no-ficcion-ensayo" className="hover:text-coral transition-colors">Ensayo</Link></li>
              <li><Link href="/?subcategory=no-ficcion-historia" className="hover:text-coral transition-colors">Historia</Link></li>
              <li><Link href="/?category=escolar" className="hover:text-coral transition-colors">Libros escolares</Link></li>
              <li><Link href="/?collectible=1" className="hover:text-coral transition-colors">Coleccionables</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink mb-4 font-semibold">Información</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/sobre-nosotros" className="hover:text-coral transition-colors">Sobre nosotros</Link></li>
              <li><Link href="/historia" className="hover:text-coral transition-colors">Nuestra historia</Link></li>
              <li><Link href="/como-funciona" className="hover:text-coral transition-colors">Cómo funciona</Link></li>
              <li><Link href="/faq" className="hover:text-coral transition-colors">FAQ</Link></li>
              <li><Link href="/alianzas" className="hover:text-coral transition-colors">Alianzas</Link></li>
              {/* <li><Link href="/gente-de-confianza" ...>Gente de confianza</Link></li> guardada por ahora (20 jul 2026) */}
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink mb-4 font-semibold">Legal</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/terminos" className="hover:text-coral transition-colors">Términos y condiciones</Link></li>
              <li><Link href="/privacidad" className="hover:text-coral transition-colors">Privacidad</Link></li>
              <li><Link href="/devoluciones" className="hover:text-coral transition-colors">Devoluciones</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink mb-4 font-semibold">Descubre</h4>
            <ul className="space-y-2.5 text-ink-muted">
              <li><Link href="/solicitudes" className="font-semibold text-coral hover:text-coral-deep transition-colors">Se busca · economía inversa</Link></li>
              <li><Link href="/comprar-libros-usados" className="hover:text-coral transition-colors">Comprar libros usados</Link></li>
              <li><Link href="/libros-usados-baratos" className="hover:text-coral transition-colors">Libros usados baratos</Link></li>
              <li><Link href="/vender" className="hover:text-coral transition-colors">Vende tu libro</Link></li>
              <li><Link href="/mapa" className="hover:text-coral transition-colors">Mapa de librerías</Link></li>
              <li><Link href="/tiendas" className="hover:text-coral transition-colors">Tiendas y librerías</Link></li>
              <li><Link href="/novedades" className="hover:text-coral transition-colors">Novedades</Link></li>
              <li><Link href="/search" className="hover:text-coral transition-colors">Buscar</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-line bg-cream-warm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span>© {new Date().getFullYear()} tuslibros.cl</span>
            <span className="hidden sm:inline">·</span>
            <span>Santiago, Chile</span>
            <span className="hidden sm:inline">·</span>
            <a href="/sobre-nosotros" className="hover:text-coral transition-colors">Un proyecto de Verónica Velásquez</a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/tuslibros.cl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Tuslibros en Instagram"
              className="text-ink-muted hover:text-coral transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5.5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="https://facebook.com/vendetuslibros.cl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Tuslibros en Facebook"
              className="text-ink-muted hover:text-coral transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/tuslibros/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Tuslibros en LinkedIn"
              className="text-ink-muted hover:text-coral transition-colors"
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
              className="text-ink-muted hover:text-coral transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
          <a href="mailto:vero@tuslibros.cl" className="hover:text-coral transition-colors">¿Dudas? vero@tuslibros.cl</a>
        </div>
      </div>
    </footer>
  );
}
