import Link from "next/link";

interface Stat {
  label: string;
  value: string;
  highlight?: boolean;
}

interface Props {
  name: string;
  tagline: string;
  avatarInitials: string;
  rating?: number;
  reviewsCount?: number;
  bio: string;
  stats: Stat[];
  tags: string[];
  whatsapp: string;
  whatsappLabel?: string;
  href?: string;
}

export default function SponsorCard({
  name,
  tagline,
  avatarInitials,
  rating,
  reviewsCount,
  bio,
  stats,
  tags,
  whatsapp,
  whatsappLabel = "Contacto WhatsApp",
  href,
}: Props) {
  const whatsappDigits = whatsapp.replace(/[^0-9]/g, "");
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `Hola ${name.split(" ")[0]}, te vi en tuslibros.cl. Quiero consultarte por tus clases.`
  )}`;

  const CardInner = (
    <div className="bg-white border border-cream-dark rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-cream-dark flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-500 text-white font-display font-bold text-xl sm:text-2xl flex items-center justify-center shadow-sm">
            {avatarInitials}
          </div>
          <span
            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
            aria-label="Disponible"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg sm:text-xl font-bold text-ink leading-tight truncate">
            {name}
          </h3>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5 truncate">{tagline}</p>
        </div>
        {rating != null && (
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-amber-500 text-sm">★</span>
              <span className="font-bold text-ink text-sm">{rating.toFixed(1)}</span>
            </div>
            {reviewsCount != null && (
              <p className="text-[11px] text-ink-muted">{reviewsCount} reseñas</p>
            )}
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="p-5 sm:p-6 space-y-3 text-sm text-ink-muted leading-relaxed">
        <p>{bio}</p>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-cream-warm rounded-lg px-3 py-3 text-center"
              >
                <p className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                  {s.label}
                </p>
                <p
                  className={`font-display font-bold text-sm sm:text-base mt-1 ${
                    s.highlight ? "text-brand-600" : "text-ink"
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-cream-dark pt-5">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted mb-2.5">
            Materias
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-3 py-1 bg-cream border border-cream-dark text-ink text-xs font-medium rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp CTA */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-4 mx-5 sm:mx-6 mb-5 sm:mb-6 bg-emerald-50 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100 rounded-lg px-4 py-3 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
            {whatsappLabel}
          </p>
          <p className="font-mono text-sm text-ink font-semibold truncate">{whatsapp}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md shrink-0">
          Escribir
        </span>
      </a>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {CardInner}
      </Link>
    );
  }
  return CardInner;
}
