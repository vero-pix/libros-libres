/**
 * Las preguntas de la encuesta de producto (jul 2026).
 *
 * Viven acá y no dentro del formulario para que agregar o cambiar una alternativa
 * sea editar una lista, no tocar JSX. Las respuestas se guardan con el TEXTO de la
 * alternativa, no con un id: así el volcado de resultados se lee solo, sin tener
 * que cruzarlo contra este archivo.
 *
 * Qué NO se pregunta y por qué: el uso de lo que ya existe está medido en
 * `page_views` (el mapa tuvo 12 sesiones en 30 días; las solicitudes, 224). Acá solo
 * van las preguntas que los datos no pueden responder — por qué alguien NO hizo
 * algo, qué falta que no existe, y qué avisos querría recibir.
 */

export type Grupo = "vendedor" | "no_publico";

export interface Pregunta {
  id: string;
  texto: string;
  ayuda?: string;
  tipo: "multiple" | "unica" | "texto";
  opciones?: string[];
}

/** Vendedores con libros activos: qué les falta para vender más. */
const VENDEDOR: Pregunta[] = [
  {
    id: "falta",
    texto: "¿Qué te falta para vender más?",
    ayuda: "Marca todas las que apliquen.",
    tipo: "multiple",
    opciones: [
      "Que lleguen más compradores",
      "Subir mis libros más rápido",
      "Saber cuándo alguien mira mi libro",
      "Que el comprador confíe en el pago",
      "Que el despacho sea más simple",
      "Poder pausar mis libros cuando no estoy",
    ],
  },
  {
    id: "conocia",
    texto: "¿Cuáles de estas sabías que ya existen?",
    ayuda: "Sin vergüenza: si no las conocías es problema mío, no tuyo.",
    tipo: "multiple",
    opciones: [
      "Subir muchos libros de una vez con un Excel",
      "Poner puntos de entrega en tu perfil",
      "Modo vacaciones para pausar todo",
      "Programa de referidos",
      "«Se busca»: ver qué libros están pidiendo",
    ],
  },
  {
    id: "avisos",
    texto: "Si te avisara cuando pasa algo, ¿qué aviso querrías recibir?",
    ayuda: "Esto decide qué construyo. Sé honesta.",
    tipo: "multiple",
    opciones: [
      "Alguien miró mi libro",
      "Alguien está buscando un libro que yo tengo",
      "Alguien publicó el mismo libro que yo",
      "Solo avísame cuando me compren",
      "Ninguno, ya recibo suficientes avisos",
    ],
  },
  {
    id: "libre",
    texto: "¿Qué te falta que hoy no existe?",
    ayuda: "Lo que sea. Esta es la respuesta que más me sirve.",
    tipo: "texto",
  },
];

/** Registrados que nunca publicaron: el 66% de la base. Qué los detuvo. */
const NO_PUBLICO: Pregunta[] = [
  {
    id: "detuvo",
    texto: "Te registraste pero no publicaste ningún libro. ¿Qué te detuvo?",
    ayuda: "No hay respuesta mala. Marca todas las que apliquen.",
    tipo: "multiple",
    opciones: [
      "Me dio lata subirlos de a uno",
      "No entendí cómo se hacía",
      "No sabía qué precio poner",
      "Solo estaba mirando",
      "Desconfié del pago",
      "Me pidió cosas que no quería dar (teléfono, ubicación)",
    ],
  },
  {
    id: "haria",
    texto: "¿Qué te haría publicar esta semana?",
    tipo: "multiple",
    opciones: [
      "Que alguien los suba por mí",
      "Que me sugieran el precio",
      "Poder hacerlo sin dar mi teléfono",
      "Saber que alguien está buscando mis libros",
      "Nada, en realidad no me interesa vender",
    ],
  },
  {
    id: "compraba",
    texto: "¿Entraste a comprar en vez de a vender?",
    tipo: "unica",
    opciones: ["Sí, entré a comprar", "No, quería vender", "Las dos cosas"],
  },
  {
    id: "libre",
    texto: "¿Qué esperabas encontrar y no encontraste?",
    tipo: "texto",
  },
];

export const PREGUNTAS: Record<Grupo, Pregunta[]> = {
  vendedor: VENDEDOR,
  no_publico: NO_PUBLICO,
};

export const INTRO: Record<Grupo, { titulo: string; bajada: string }> = {
  vendedor: {
    titulo: "Ayúdame a decidir qué construir",
    bajada:
      "Tienes libros publicados, así que sabes cómo funciona esto mejor que nadie. Son cuatro preguntas y dos minutos. Las leo yo, una por una.",
  },
  no_publico: {
    titulo: "¿Qué te faltó para publicar?",
    bajada:
      "Te registraste y no llegaste a publicar. Eso es información mía, no tuya: algo del camino no funcionó. Son cuatro preguntas y dos minutos.",
  },
};

/** El grupo viene por querystring (?g=a|b). Cualquier otra cosa se ignora. */
export function grupoDesdeParam(g?: string): Grupo | null {
  if (g === "a" || g === "vendedor") return "vendedor";
  if (g === "b" || g === "no_publico") return "no_publico";
  return null;
}
