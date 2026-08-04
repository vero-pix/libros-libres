/**
 * Bloque de contenido para las landings de autor: quién fue y para quién es.
 *
 * Nace de comparar nuestra página de Simenon con la de un competidor. En lo
 * técnico les ganábamos (title, meta, FAQ) pero ellos tenían lo que de verdad
 * se lee: una biografía y una lista de a qué lector le sirve el autor. Ese
 * segundo bloque es el que responde búsquedas de cola larga ("novela negra
 * psicológica", "libros parecidos a Maigret") y el material que los asistentes
 * de IA citan al recomendar — hoy la segunda fuente de tráfico del sitio.
 *
 * Va DESPUÉS del listado de libros: primero lo que se puede comprar, después
 * el contexto. La página sigue siendo una vitrina, no un artículo.
 */
interface Props {
  /** Nombre del autor tal como se muestra. */
  name: string;
  /** Biografía, un string por párrafo. */
  bio: string[];
  /** Perfiles de lector a los que le calza este autor. */
  forWhom: string[];
  /** Cierre en voz de Vero: por qué lo tenemos, qué buscar. Opcional. */
  note?: string;
}

export default function AuthorProfile({ name, bio, forWhom, note }: Props) {
  return (
    <section className="mb-16 max-w-3xl">
      <h2 className="font-display text-2xl font-bold text-ink mb-5">
        Quién fue {name}
      </h2>

      <div className="space-y-4">
        {bio.map((p, i) => (
          <p key={i} className="text-ink-muted leading-relaxed">
            {p}
          </p>
        ))}
      </div>

      <h3 className="font-display text-xl font-bold text-ink mt-10 mb-4">
        Para quién es {name}
      </h3>
      <ul className="space-y-2.5">
        {forWhom.map((f, i) => (
          <li key={i} className="flex gap-3 text-ink-muted leading-relaxed">
            <span aria-hidden className="text-brand-500 mt-[2px]">
              —
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {note && (
        <p className="mt-8 text-ink-muted leading-relaxed border-l-2 border-brand-500/40 pl-4 italic">
          {note}
        </p>
      )}
    </section>
  );
}
