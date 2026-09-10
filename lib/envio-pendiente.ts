/**
 * "Ya tienes un envío en preparación de este vendedor."
 *
 * Nace del caso de Don Luis (09-09-2026): compró tres veces a Casa Emunah en
 * tres días —dos de ellas con 18 minutos de diferencia— y pagó flete las tres.
 * $16.230 de despacho sobre $75.000 en libros. El bundle funciona bien DENTRO
 * de una compra; el hueco estaba ENTRE compras: cada checkout cotizaba de cero
 * sin mirar si ese comprador ya tenía un paquete armándose donde ese vendedor.
 *
 * La regla física manda: solo se puede sumar a un paquete que todavía NO salió
 * y cuya etiqueta todavía NO se imprimió. Después de `label_ready` el peso y la
 * etiqueta ya están comprometidos con Shipit, y meter libros de más deja al
 * vendedor con un bulto que no corresponde a lo que declaró.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Estados en los que el paquete todavía se puede engordar sin romper nada. */
const ESTADOS_ABIERTOS = ["pending", "created"] as const;

/** Ventana de gracia: más allá de esto el vendedor ya empacó, aunque el estado diga otra cosa. */
const HORAS_DE_GRACIA = 24;

export interface EnvioAbierto {
  bundleId: string;
  /** Cuánto pagó de flete en esa compra, para poder decírselo al comprador. */
  fletePagado: number;
  /** Dirección exacta de esa compra: sumar solo sirve si el paquete va al mismo lugar. */
  direccion: string;
  titulos: string[];
  creadoEn: string;
}

/** Normaliza una dirección para comparar: sin tildes, sin dobles espacios, minúsculas. */
export function normalizarDireccion(dir: string | null | undefined): string {
  return (dir ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Busca un envío del mismo vendedor al mismo comprador y a la misma dirección
 * que todavía admite más libros. Devuelve null cuando no hay ninguno — que es
 * el caso normal y no es un error.
 *
 * Se le pasa un cliente con permiso de leer `orders` del comprador (el de la
 * request autenticada basta: las policies dejan al comprador ver lo suyo).
 */
export async function buscarEnvioAbierto(
  sb: SupabaseClient,
  opts: { buyerId: string; sellerId: string; direccion: string | null }
): Promise<EnvioAbierto | null> {
  const desde = new Date(Date.now() - HORAS_DE_GRACIA * 60 * 60 * 1000).toISOString();

  const { data: envios, error } = await sb
    .from("shipments")
    .select("bundle_id, status, created_at")
    .eq("buyer_id", opts.buyerId)
    .eq("seller_id", opts.sellerId)
    .in("status", ESTADOS_ABIERTOS as unknown as string[])
    .gte("created_at", desde)
    .order("created_at", { ascending: false });

  // Un fallo leyendo esto no puede voltear una compra: se cobra el flete
  // normal, que es el comportamiento de siempre.
  if (error || !envios?.length) return null;

  const objetivo = normalizarDireccion(opts.direccion);
  if (!objetivo) return null;

  for (const envio of envios) {
    const { data: ordenes } = await sb
      .from("orders")
      .select("shipping_cost, buyer_address, created_at, listing:listings(book:books(title))")
      .eq("bundle_id", envio.bundle_id);

    if (!ordenes?.length) continue;
    if (normalizarDireccion(ordenes[0].buyer_address) !== objetivo) continue;

    const titulos = ordenes
      .map((o: any) => (Array.isArray(o.listing) ? o.listing[0] : o.listing)?.book)
      .map((b: any) => (Array.isArray(b) ? b[0] : b)?.title)
      .filter((t: unknown): t is string => typeof t === "string" && t.length > 0);

    return {
      bundleId: envio.bundle_id,
      fletePagado: ordenes.reduce((s: number, o: any) => s + Number(o.shipping_cost ?? 0), 0),
      direccion: ordenes[0].buyer_address ?? "",
      titulos,
      creadoEn: envio.created_at,
    };
  }

  return null;
}
