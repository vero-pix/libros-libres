import Link from "next/link";

interface PromoBannerProps {
  variant: "publish" | "circulate";
}

export default function PromoBanner({ variant }: PromoBannerProps) {
  if (variant === "publish") {
    return (
      <Link
        href="/vender"
        className="group relative block overflow-hidden rounded-2xl bg-gradient-to-r from-cream-warm to-cream border border-cream-dark/40 transition-all duration-300 hover:shadow-lg hover:border-brand-300"
      >
        <div className="flex items-center gap-6 px-6 py-5 sm:px-8">
          {/* Phone icon */}
          <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-xl bg-brand-100 text-3xl shrink-0 group-hover:scale-105 transition-transform duration-300">
            📱
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-lg sm:text-xl font-bold text-ink leading-tight">
              Publica tu libro en 10 segundos
            </p>
            <p className="text-sm text-ink-muted mt-1">
              Solo escanea el código de barras. Sin fotos perfectas. ¡Listo!
            </p>
          </div>

          <span className="shrink-0 bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-lg group-hover:bg-brand-600 transition-colors duration-200">
            Publicar ahora
          </span>
        </div>

        {/* Subtle animated accent */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Link>
    );
  }

  // variant === "circulate"
  return (
    <Link
      href="/vender"
      className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy-light text-white transition-all duration-300 hover:shadow-lg"
    >
      <div className="flex items-center gap-6 px-6 py-5 sm:px-8">
        <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-xl bg-white/10 text-3xl shrink-0 group-hover:scale-105 transition-transform duration-300">
          📚
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display text-lg sm:text-xl font-bold leading-tight">
            Tus libros merecen circular
          </p>
          <p className="text-sm text-white/70 mt-1">
            Compra, vende o arrienda cerca de ti. Pago seguro.
          </p>
        </div>

        <span className="shrink-0 bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-lg group-hover:bg-brand-400 transition-colors duration-200">
          Empezar
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Link>
  );
}
