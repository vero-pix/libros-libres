/**
 * Seguimiento por courier. Módulo sin dependencias de servidor para que lo
 * usen tanto los correos del worker como los componentes de cliente.
 * URLs según `tracking_url` de GET /v/couriers de Shipit (07-09-2026).
 */
export function urlSeguimiento(courier: string | null | undefined, tracking: string): string | null {
  switch ((courier ?? "").toLowerCase()) {
    case "starken":
      return `https://www.starken.cl/seguimiento?codigo=${encodeURIComponent(tracking)}`;
    case "chilexpress":
      return `https://centrodeayuda.chilexpress.cl/pre-seguimiento/${encodeURIComponent(tracking)}`;
    case "bluexpress":
      return `https://www.blue.cl/enviar/seguimiento?n_seguimiento=${encodeURIComponent(tracking)}`;
    default:
      return null;
  }
}

export function nombreCourier(courier: string | null | undefined): string {
  const c = (courier ?? "").toLowerCase();
  if (c === "starken") return "Starken";
  if (c === "chilexpress") return "Chilexpress";
  if (c === "bluexpress") return "Bluexpress";
  return courier ? courier.charAt(0).toUpperCase() + courier.slice(1) : "el courier";
}
