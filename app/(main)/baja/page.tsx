import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { decodificarCorreo, verificarBaja } from "@/lib/bajaCorreos";

export const metadata = {
  title: "Darte de baja de los correos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * /baja — destino del link "Date de baja" de los correos masivos y recurrentes.
 *
 * Mostrar esta página no da de baja a nadie: lo hace el botón (POST a
 * /api/baja). Así un antivirus que abre el link para revisarlo no borra a
 * nadie de la lista. Ver lib/bajaCorreos.ts.
 */

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="animate-fade-up rounded-2xl border border-cream-dark/40 bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}

/** Muestra el correo a medias: quien mira por encima del hombro no se lo lleva entero. */
function enmascarar(email: string): string {
  const [usuario, dominio] = email.split("@");
  const visible = usuario.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(1, usuario.length - 2))}@${dominio}`;
}

export default function BajaPage({
  searchParams,
}: {
  searchParams: { e?: string; t?: string; listo?: string; error?: string; invalido?: string };
}) {
  if (searchParams.listo) {
    return (
      <Marco>
        <h1 className="font-display text-2xl font-bold text-ink">Listo, ya no te escribo más</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Te saqué del newsletter y de los avisos del &ldquo;Se busca&rdquo;. Si compras o vendes algo, igual te
          llegan los correos de ese pedido, porque sin ellos no sabrías en qué va.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Gracias por el tiempo que estuviste. Si algún día quieres volver, te suscribes de nuevo desde el pie de
          cualquier página. — Vero
        </p>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Volver a tuslibros.cl
        </Link>
      </Marco>
    );
  }

  if (searchParams.error) {
    return (
      <Marco>
        <h1 className="font-display text-2xl font-bold text-ink">Algo falló de mi lado</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          No pude guardar tu baja. Prueba de nuevo en un rato desde el mismo link del correo, o escríbeme por{" "}
          <a href="https://wa.me/56994583067" className="font-semibold text-brand-600 hover:underline">
            WhatsApp
          </a>{" "}
          y te saco a mano.
        </p>
      </Marco>
    );
  }

  const email = decodificarCorreo(searchParams.e);
  const valido = !searchParams.invalido && !!email && verificarBaja(email, searchParams.t);

  if (!valido) {
    return (
      <Marco>
        <h1 className="font-display text-2xl font-bold text-ink">Este link no me sirve</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Puede que se haya cortado al copiarlo. Prueba abriéndolo directo desde el correo, o escríbeme por{" "}
          <a href="https://wa.me/56994583067" className="font-semibold text-brand-600 hover:underline">
            WhatsApp
          </a>{" "}
          y te saco de la lista yo misma.
        </p>
      </Marco>
    );
  }

  return (
    <Marco>
      <h1 className="font-display text-2xl font-bold text-ink">¿Te saco de la lista?</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Soy Vero. Si confirmas, dejo de escribirle a <strong className="text-ink">{enmascarar(email!)}</strong> con el
        newsletter y los avisos del &ldquo;Se busca&rdquo;. Los correos de tus compras y ventas te siguen llegando.
      </p>
      <form method="post" action="/api/baja" className="mt-6">
        <input type="hidden" name="e" value={searchParams.e} />
        <input type="hidden" name="t" value={searchParams.t} />
        <Button type="submit" fullWidth>
          Sí, darme de baja
        </Button>
      </form>
      <Link href="/" className="mt-4 block text-center text-sm text-ink-muted hover:underline">
        Mejor no, sigo recibiéndolos
      </Link>
    </Marco>
  );
}
