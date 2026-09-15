// Los otros proyectos de Vero, para enlazarlos desde tuslibros.cl (footer,
// /sobre-nosotros y su perfil de vendedora). La lista canónica vive en
// ~/dev/web_eco/src/lib/laboratorios.ts: si allá se agrega o cae uno, copiarlo acá.
export type OtroProyecto = {
  titulo: string;
  url: string;
  bajada: string;
};

export const otrosProyectos: OtroProyecto[] = [
  {
    titulo: "economics.cl",
    url: "https://economics.cl",
    bajada: "Asesoría financiera para pymes: un lugar donde pensar tu empresa en voz alta, con alguien que responde.",
  },
  {
    titulo: "Barlovento",
    url: "https://barlovento.economics.cl",
    bajada: "El precio del tomate visto desde el satélite: precios de ODEPA cruzados con imágenes de los campos de Quillota.",
  },
  {
    titulo: "Vero Quant Lab",
    url: "https://lab.economics.cl",
    bajada: "Mi laboratorio de investigación cuantitativa: hipótesis puestas a prueba, con método y bitácora.",
  },
  {
    titulo: "El Espejo Activo",
    url: "https://eea.economics.cl",
    bajada: "Para preparar una conversación difícil antes de tenerla, no después.",
  },
  {
    titulo: "Paicio",
    url: "https://paicio.economics.cl",
    bajada: "Economía que se juega: decides como ministra de Economía frente a crisis reales.",
  },
  {
    titulo: "iSenior",
    url: "https://isenior.economics.cl",
    bajada: "Para que a un adulto mayor en residencia nunca le falten sus insumos esenciales.",
  },
  {
    titulo: "LCE",
    url: "https://lce.economics.cl",
    bajada: "Libros contables electrónicos: se generan, se firman y se envían al SII.",
  },
];

export const TODOS_LOS_PROYECTOS_URL = "https://economics.cl/laboratorios";
