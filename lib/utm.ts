/**
 * Links con UTM — un solo lugar.
 *
 * Los 14 posts del batch de julio salieron a `tuslibros.cl/libro/vero/[slug]`
 * sin un solo parámetro, y por eso no hay forma de saber si Instagram sirve. El
 * dato existe pero no se puede atribuir: `page_views` guarda el path con
 * querystring (`PageTracker.tsx` lo arma con `window.location.search`), así que
 * basta con que los links salgan etiquetados.
 *
 * Dato útil para leer la analítica vieja: el tráfico de Instagram que llega a
 * `/vendedor/buhardilla` viene con `utm_source=ig&utm_medium=social`. Esos NO
 * son nuestros — los pone Buhardilla en su propia cuenta. Por eso conviene que
 * los nuestros digan `instagram`, no `ig`: son distinguibles a simple vista.
 */

export const SITIO = "https://tuslibros.cl";

export type FuenteUtm =
  | "instagram"
  | "facebook"
  | "newsletter"
  | "reddit"
  | "whatsapp"
  | "pedido"
  | "merchant"
  | "meta";

/** El medio que le corresponde a cada fuente. */
const MEDIO: Record<FuenteUtm, string> = {
  instagram: "social",
  facebook: "social",
  reddit: "social",
  whatsapp: "mensaje",
  newsletter: "email",
  pedido: "email",
  merchant: "shopping",
  meta: "shopping",
};

/** Un slug de campaña legible: minúsculas, sin tildes, con guiones. */
export function slugCampana(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Agrega los UTM a una URL. Respeta los parámetros que ya tenga y no pisa
 * ninguno que venga puesto a mano.
 *
 *   conUtm("https://tuslibros.cl/libro/vero/baudolino", "instagram", "lote-negra")
 *   → …/baudolino?utm_source=instagram&utm_medium=social&utm_campaign=lote-negra
 */
export function conUtm(url: string, fuente: FuenteUtm, campana: string): string {
  const u = new URL(url, SITIO);
  u.searchParams.set("utm_source", fuente);
  u.searchParams.set("utm_medium", MEDIO[fuente]);
  u.searchParams.set("utm_campaign", slugCampana(campana));
  return u.toString();
}

/** Atajo para el caso más común: la ficha de un libro publicada en redes. */
export function linkDeFicha(
  ruta: string,
  fuente: FuenteUtm,
  campana: string
): string {
  return conUtm(ruta.startsWith("http") ? ruta : SITIO + ruta, fuente, campana);
}
