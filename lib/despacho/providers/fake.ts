import { COMUNAS_CHILE, getRegionForComuna } from "@/lib/comunas";
import { foldAccents } from "@/lib/accentSearch";
import type { EnvioProveedor, EstadoCourier, ProviderAdapter, RetiroProveedor } from "../core";

/**
 * Proveedor falso para pruebas: no llama a nadie y siempre responde lo mismo
 * ante la misma secuencia de llamadas. Sirve para recorrer todos los pasos del
 * worker sin courier real (PR 1.1), y para el modo de pruebas del proveedor
 * nuevo antes de tener credenciales.
 *
 * Guion de un envío, por cada `consultarEnvio` sobre el mismo id:
 *   1ª consulta → created, todavía sin tracking ni etiqueta (como Shipit los
 *                 primeros ~20 s)
 *   2ª consulta → created, con tracking y etiqueta
 *   3ª consulta → in_transit
 *   4ª y siguientes → delivered
 *
 * Sin retiros: el falso siempre es dropoff. El estado vive en memoria de la
 * instancia, así que solo es determinista dentro de un mismo proceso.
 */

/** Región de la RM en la numeración de este falso (la de Shipit, para no confundir). */
const REGION_RM_FALSA = 7;

/**
 * PDF mínimo válido de más de 1 KB: el worker exige `%PDF` al inicio y al
 * menos 1.024 bytes antes de guardarlo. Se entrega como `data:` URL, que
 * `fetch` de Node lee sin red.
 */
function etiquetaFalsa(reference: string): string {
  const relleno = "%" + " ".repeat(1100) + "\n";
  const pdf =
    "%PDF-1.4\n" +
    relleno +
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n` +
    `2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj\n` +
    `% etiqueta falsa ${reference}\n` +
    "trailer << /Root 1 0 R >>\n%%EOF\n";
  return "data:application/pdf;base64," + Buffer.from(pdf, "latin1").toString("base64");
}

/** Id estable a partir de un texto: el mismo `reference` da siempre el mismo id. */
function idDesde(texto: string): number {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 900_000_000 + (h % 99_999_999);
}

/** Estado según cuántas consultas lleva el envío (índice = consultas; 0 = recién creado). */
const ESTADO_POR_CONSULTA: EstadoCourier[] = ["created", "created", "created", "in_transit", "delivered"];

export function crearAdaptadorFalso(): ProviderAdapter {
  const envios = new Map<number, { reference: string; courier: string; consultas: number }>();

  function respuesta(id: number): EnvioProveedor {
    const e = envios.get(id);
    if (!e) {
      return {
        id: null,
        estadoCrudo: null,
        estado: "unknown",
        courier: null,
        trackingNumber: null,
        etiquetaUrl: null,
        costoClp: null,
        retiroCrudo: null,
        error: `envío falso ${id} no existe`,
        httpStatus: 404,
        raw: { error: "not_found" },
      };
    }
    const n = e.consultas;
    const estado = ESTADO_POR_CONSULTA[Math.min(n, ESTADO_POR_CONSULTA.length - 1)];
    const conEtiqueta = n >= 2;
    return {
      id,
      estadoCrudo: estado,
      estado,
      courier: e.courier,
      trackingNumber: conEtiqueta ? `FAKE${id}` : null,
      etiquetaUrl: conEtiqueta ? etiquetaFalsa(e.reference) : null,
      costoClp: 3700,
      retiroCrudo: null,
      httpStatus: 200,
      raw: { id, status: estado, reference: e.reference, fake: true },
    };
  }

  return {
    id: "fake",
    couriersDropoff: ["bluexpress", "starken", "chilexpress"],
    regionRM: REGION_RM_FALSA,
    origenCompartidoRM: () => 1,
    medidasPaquete: (items) => {
      const n = Math.max(1, Math.min(items, 20));
      return { width: 20, height: 22, length: Math.min(30, 4 + 3 * n), weight: Math.max(0.5, Math.min(10, 0.1 + 0.4 * n)) };
    },
    buscarComuna: async (nombre) => {
      const buscada = foldAccents(nombre).trim().toLowerCase();
      if (!buscada) return null;
      const i = COMUNAS_CHILE.findIndex((c) => foldAccents(c).toLowerCase() === buscada);
      if (i < 0) return null;
      const comuna = COMUNAS_CHILE[i];
      return {
        id: i + 1,
        name: foldAccents(comuna).toUpperCase(),
        region_id: getRegionForComuna(comuna) === "Metropolitana" ? REGION_RM_FALSA : 0,
      };
    },
    armarSolicitud: (s) => ({
      reference: s.reference,
      origin_id: s.originId,
      courier: s.courier.toLowerCase(),
      items: s.items,
      sizes: s.sizes,
      destiny: s.destiny,
    }),
    crearEnvio: async (body) => {
      const reference = String((body as any)?.reference ?? "");
      if (!reference) return { ...respuesta(-1), error: "sin reference", httpStatus: 422 };
      const id = idDesde(reference);
      if (!envios.has(id)) {
        envios.set(id, { reference, courier: String((body as any)?.courier ?? ""), consultas: 0 });
      }
      return respuesta(id);
    },
    consultarEnvio: async (id) => {
      const e = envios.get(id);
      if (e) e.consultas++;
      return respuesta(id);
    },
    idDesdeRespuesta: (raw) => {
      const id = (raw as any)?.id;
      return typeof id === "number" ? id : null;
    },
    leerRetiro: (): RetiroProveedor | null => null,
    retiroCumplido: () => false,
  };
}
