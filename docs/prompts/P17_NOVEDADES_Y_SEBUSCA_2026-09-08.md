# P17 — Novedades: reel, calugas y cierre del "Se busca"

Fecha: 08-09-2026 · Una sesión. Se ejecuta después de P16-A (y B si alcanza).
Origen: revisión de /novedades en móvil por Vero (08-09) + verificación de Claude Code
sobre el match de "Se busca" (158 pedidos, 17 sin contacto, 52 solo WhatsApp).

```
Lee docs/prompts/P00_PROCEDIMIENTO_CONDUCCION.md. Tarea: lote acotado de
arreglos en app/(main)/novedades/page.tsx y en el formulario de
/solicitudes. Aplica SOLO lo listado. No refactorices. Si ves otro
problema, anótalo y sigue.

NOVEDADES
1. Entrada nueva del diario, fecha 8 sep, tag "Lanzamiento": el reel.
   Título: "El reel: la historia en 60 segundos". Texto: dos líneas,
   sin cifras del sitio (las del video son de julio). Link "Ver el reel"
   → /historia#reel (agrega el id al bloque del video en
   app/(main)/historia/page.tsx si no lo tiene). Sin incrustar el video en
   novedades: se ve en /historia.
2. Hero: el párrafo bajo el titular no se lee sobre la foto (azul sobre
   imagen oscura). Usa texto claro sobre un velo más oscuro o saca el
   párrafo fuera de la imagen. Verifica contraste AA en móvil y desktop.
3. Las tres calugas de lanzamiento (:1494-1504) llevan link:
   "La etiqueta se genera sola" → página de ayuda al vendedor (la que
   exista; si no hay, /vender#despacho);
   "Reseñas verificadas" → /vendedor/<tienda de la semana actual, leída
   de site_config>;
   "Librerías de confianza en la portada" → /#librerias-confianza (agrega
   el id a la sección en la home).
4. fetchFulfilledRequests (:1375-1412): si r.author es null, el detalle
   es solo el título (hoy imprime "1984 de null"). Y lee el status del
   listing cumplido: si es completed o no existe, el texto dice "ya se
   vendió" y no lleva link "Ver el libro"; si está active, queda igual.

SE BUSCA — el match solo sirve si hay a quién avisar
5. Formulario de /solicitudes y app/api/requests/route.ts:92: exigir
   correo válido o sesión iniciada. WhatsApp solo se acepta ADEMÁS del
   correo, nunca en vez de. Mensaje al usuario: "Te avisamos por correo
   cuando aparezca". Los 17 pedidos sin contacto y los 52 solo-WhatsApp
   quedan como están (no se borran).
6. Cuando el webhook listing-created cierra un pedido con match fuerte,
   correo al VENDEDOR también: "Tu <título> lo estaba buscando alguien
   [en <comuna>]. Ya le avisamos." Sin datos del solicitante. Reutiliza
   el envío por Resend del mismo archivo.

MÉTRICA
7. scripts/sebusca_cierre.mjs: para cada book_requests con fulfilled=true,
   ¿hubo orden sobre fulfilled_listing_id? ¿el comprador es el
   solicitante (requester_user_id o email)? Imprime pedidos cumplidos,
   con orden, comprados por el solicitante. Suma la línea "Se busca:
   cumplidos / vendidos / al solicitante" al cron daily-summary.

Verificación: npm run build; /novedades en móvil con las cuatro cosas
visibles; un pedido de prueba sin correo se rechaza; un pedido con correo
+ listing que calza dispara correo al solicitante y al vendedor (usa
el buzón de VERO_INBOX_EMAIL para ambos en la prueba); el script corre.
Commit.
```
