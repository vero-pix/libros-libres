/**
 * Permiso de cookies (Ley 21.719, art. 12). Desde el 04-10-2026 Google
 * Analytics arranca sin cookies (Consent Mode) y AdSense con anuncios no
 * personalizados, hasta que la persona acepte en el aviso de abajo.
 *
 * Se guarda en localStorage del navegador. Si el almacenamiento está bloqueado,
 * vale "sin decidir": se aplica lo necesario y el aviso vuelve a aparecer.
 */
export type Consentimiento = "todo" | "necesario";

export const CLAVE_CONSENTIMIENTO = "tl_cookies";
export const EVENTO_CONSENTIMIENTO = "tl-cookies";
/** Lo dispara el enlace "Preferencias de cookies" del pie para volver a preguntar. */
export const EVENTO_REABRIR = "tl-cookies-reabrir";

export function leerConsentimiento(): Consentimiento | null {
  try {
    const v = localStorage.getItem(CLAVE_CONSENTIMIENTO);
    return v === "todo" || v === "necesario" ? v : null;
  } catch {
    return null;
  }
}

export function guardarConsentimiento(v: Consentimiento): void {
  try {
    localStorage.setItem(CLAVE_CONSENTIMIENTO, v);
  } catch {
    // Sin almacenamiento: vale para esta visita y nada más.
  }
  const g = (window as any).gtag;
  if (typeof g === "function") {
    const estado = v === "todo" ? "granted" : "denied";
    g("consent", "update", {
      analytics_storage: estado,
      ad_storage: estado,
      ad_user_data: estado,
      ad_personalization: estado,
    });
  }
  window.dispatchEvent(new CustomEvent(EVENTO_CONSENTIMIENTO, { detail: v }));
}

/**
 * Va inline en el <head>, ANTES de la configuración de gtag: Consent Mode exige
 * que el valor por defecto exista antes del primer 'config'.
 */
export const SCRIPT_CONSENT_DEFAULT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}var __tlc=null;try{__tlc=localStorage.getItem("${CLAVE_CONSENTIMIENTO}")}catch(e){}var __tlg=__tlc==="todo"?"granted":"denied";gtag('consent','default',{analytics_storage:__tlg,ad_storage:__tlg,ad_user_data:__tlg,ad_personalization:__tlg,wait_for_update:500});if(__tlc!=="todo"){(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=1}`;
