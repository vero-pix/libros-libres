# Tablero de sesión — tuslibros.cl · 08-09-2026
**Ir matando uno por uno. Verde = cerrado, en curso = trabajándose, pendiente = no arranca.**

---

## PIEZA CERRADA ✅ — Librerías de confianza + reseñas

| Paso | Qué | Estado |
|---|---|---|
| a | Migración: seller_stats, site_config, reviews (ALTER), featured_seller_blocked | ✅ cerrado |
| b | Refresco seller_stats + trust_score (tope catálogo min(activos,250)/50) | ✅ cerrado — 8 tiendas califican |
| c | Componente tarjeta + sección home (2 slots) | ✅ cerrado — barra aleatoria eliminada |
| — | Fix service worker (sw.js → tuslibros-v3, no cachear HTML) | ✅ cerrado — riesgo mayor resuelto |
| d | Página de tienda: cabecera, reseñas, JSON-LD, sin mailto, meta corregida | ✅ cerrado + fix RLS courier/reseñas |
| e | Línea de prueba en ficha de libro + tarjeta invitación (grilla en 10) | ✅ cerrado |
| f | Página de reseña desde correo (/resena/[orderId], 3 clics con comentario) | ✅ cerrado |
| g | Admin CLI: ocultar reseña + fijar tienda semana + frase casa | ✅ cerrado (3 brechas corregidas: impide/order_id/versionado) |
| — | Portada estacional "Para el 18" hasta 18-sep | ✅ cerrado |

**Contenido fijado:**
- [x] Frase de la casa: *"Los que releo, los que regalo y los que me cuesta soltar. Mi mesa de noche."* ✅
- [x] Tienda semana inaugural: **Lorena Cortés (Concepción)** ✅
- [x] Verificado en incógnito ✅

**PIEZA 100% CERRADA.**

---

## HALLAZGO EN VIVO — post-compra con retiro — RESUELTO ✅

Un comprador (Josefina) pagó "Agua fresca en los espejos" ($5.000, tienda de Scarlett) con entrega en persona y no supo qué hacer — escribió a Vero por WhatsApp. El post-pago no daba instrucciones.

RESUELTO hoy (commit b216c41, probado en vivo): pantalla de confirmación nueva ("Ya le avisé a la vendedora, te va a escribir... No pagues nada al recibirlo") con 3 botones — escribir por mensajería interna (no WhatsApp, protege el experimento de captura), ver pedido, y WhatsApp de Vero si no responde en días. Correo espejo con replyTo al buzón personal, arreglado el "1 libros". Caso de Josefina cubierto de raíz; ella y Scarlett ya conectadas.
PENDIENTE menor (después): botón "Escribir" en Mis Pedidos y chequeo automático a los 3 días para compras en persona quietas.

---

## HALLAZGO QUE CAMBIA LA PRIORIDAD 🔴

**El cuello NO es captar libreros. Es ACTIVAR los que ya hay.**

- José Santis (147 libros) + Juan Adrián (116 libros) = **263 libros publicados que nadie puede comprar** (sin MercadoPago).
- 8 libreros con inventario = 1.436 libros → solo 10 ventas en 90 días.
- Captar libreros nuevos solo agrega catálogo que tampoco vende. El cuello son los compradores/activación, no la oferta.

**Estrategia corregida: activación en 2 frentes, NO captación.**

| # | Acción | Tipo | Estado |
|---|---|---|---|
| A1 | Correo a José Santis (activación) + Juan Adrián (reactivación) | mensaje | ✅ ENVIADOS por Resend + WhatsApp a José. Efecto se mide el 21-09 (¿conectaron MP?) |
| — | Fix del `next` en /api/auth/mercadopago (link no cae en /perfil) | código | ✅ desplegado y verificado |
| A2 | Onboarding: MercadoPago ANTES del catálogo | fix estructural | ✅ DESPLEGADO |
| A3 | Carga masiva: subir tope de 500 o procesar por tandas | fix | congelado hasta probar activación |
| A4 | Captar libreros nuevos | estrategia | CONGELADO — primero activar los actuales |

---

## COMUNICACIÓN A VENDEDORES

Las 3 novedades a comunicar (texto base, un solo canal por persona):
1. **Despacho automático en el checkout** — el comprador paga y el envío se coordina solo con courier; el vendedor no despacha por fuera, el pago le llega directo.
2. **Reseñas verificadas** — el comprador califica la tienda tras recibir; reputación visible en la página del vendedor.
3. **Librerías de confianza en la portada** — sección nueva en la home con las tiendas que venden y despachan por la plataforma.

| Vendedor | Canal | Ajuste propio | Estado |
|---|---|---|---|
| CIM / Carlos | WhatsApp (hilo abierto por él) | 3 novedades + pedir testimonio | ✅ ENVIADO |
| Buhardilla | correo | activo parejo | ✅ ENVIADO |
| Libro de Ocasión | correo | tono medido (mayor concentración) | ✅ ENVIADO |
| Scarlett Santis | correo | es la tienda de la semana actual → gancho | ✅ ENVIADO |
| Nicole Sepúlveda | correo | ya despacha con Bluexpress → reconocerlo | ✅ ENVIADO |

Reply-to: el buzón de VERO_INBOX_EMAIL (cuenta viva; vero@ suspendida). Enviados desde Resend, sin copia oculta. Frente de comunicación a vendedores COMPLETO.

---

## CRECIMIENTO SEO — páginas de autor

Infraestructura YA existía (/autor/[slug] indexable, JSON-LD completo, sitemap, enlace desde fichas). Faltaba escala: estaba configurada para 12 autores que NO incluían a los de más catálogo.

| Lote | Autores | Estado |
|---|---|---|
| 1 | Pablo Neruda (42 fichas), Mario Vargas Llosa (40 fichas) | ✅ EN PRODUCCIÓN, verificado 200 (eran 404) |
| 2 | García Márquez, Cortázar, Saramago, Borges, Benedetti, Marcela Paz/Papelucho | ✅ EN PRODUCCIÓN, 200, solicitadas en GSC (8 URLs de autor total + índice /autor) |
| 3 | Octavio Paz, Eco, Fuentes, Orwell, Roth, Coetzee, etc. | esperar a medir lotes 1-2, NO amontonar |

Criterio de selección: canon en español con búsqueda estable + repartido entre varios vendedores. DESCARTADA romántica comercial (Steel, Sparks, Maxwell, Kellen, Godoy, Ron) por costo SEO prohibitivo. DESCARTADOS los de 1 solo vendedor (Arciniegas, Time Life — este último ni es autor, es colección editorial).

Umbral: 8+ libros (con menos, thin content y riesgo de vaciado). Script `autores-candidatos.mjs` genera andamiaje; Vero escribe solo los párrafos.

Deuda de datos detectada (para limpiar en algún lote): títulos duplicados por capitalización ("La casa verde"/"La Casa Verde"), registros con 2 títulos en un campo, y variantes de nombre múltiples (García Márquez en 5 formas incl. "Märquez").

S2 — más páginas de ciudad (Temuco/La Serena crecen en GSC): anotado, no arrancado.

GSC agosto: 1.070 clics, 1.050 de Chile, 734 móvil. Tráfico sigue siendo marca + genérico. Las páginas de autor son el motor para encender el long-tail.

---

## NOVEDADES — CERRADO ✅

- [x] Titular reescrito: ya NO expone concentración (sin "1.729", sin "se duplicó"). Ahora habla de hito de producto.
- [x] Contadores nuevos sin dejar ver conversión: 126 tiendas, títulos distintos, 12 regiones, #1 en Google.
- [x] Entrada del 29-ago reescrita ("Entró de una vez la biblioteca completa de una librería") sin cifras de concentración.
- [x] Desplegado junto con el checkout.

---

## DIFUSIÓN (anotado, NO hoy)

- [ ] IG: 1 post del lanzamiento
- [ ] LinkedIn: post
- [ ] Reddit: SOLO con historial de cuenta y ángulo build técnico (no venta), tras medir. No en caliente.

---

## DESCARTADO ✅

- Compra-reventa con IA (buscar libro pedido, comprar, revender). Convierte marketplace en retailer con inventario, inmoviliza caja en activo ilíquido, contradice el foco. Eventual experimento manual acotado, nunca funcionalidad.

---

## DOCUMENTOS DE LA SESIÓN

- `docs/prompts/librerias-confianza-resenas.md` — guía de la pieza (commiteada)
- `docs/RESENAS_COMO_SENAL.md` — documento de norte, 4 capas (commiteado)
- Este tablero — seguimiento vivo

---

## VENTAS — tendencia (dato de ánimo, revisar rigor)

Ventas por mes 2026: May 22 · Jun 3 · Jul 8 · Ago 14 · Sep en curso.
Desde junio se duplica mes a mes (3→8→14). Si sep mantiene ritmo, cierra sobre 20.
OJO: el contador del sitio puede mezclar ventas por plataforma con ventas por fuera (Carlos despachó por Blue directo y transfiere aparte = captura cero). La meta no es solo que suba el contador, es que más ventas pasen por el checkout.

---

## LO QUE YA SE MATÓ HOY ✅

1. Pieza Librerías de confianza + reseñas — completa (frase casa + tienda Lorena)
2. Fix service worker (HTML viejo a recurrentes) — el bug más grave
3. Fix RLS en courier/reseñas (dependían de tabla protegida, invisibles a anónimos)
4. Fix del `next` en link de MercadoPago
5. Correos activación/reactivación a José y Juan Adrián — enviados
6. WhatsApp a Carlos (novedades + testimonio) — enviado
7. 4 correos de novedades a Buhardilla, LDO, Scarlett, Nicole — enviados
8. WhatsApp a José — enviado
9. Fix onboarding "MP antes del catálogo" — desplegado
10. Páginas de autor Neruda + Vargas Llosa + 6 del lote 2 (8 total) — en producción, indexándose
11. Fix del sitemap: 52 tiendas con catálogo destapadas (de 74 a 126), Lorena incluida
12. Novedades reescrito — ya NO expone concentración (sin "1.729", sin "se duplicó"); contadores nuevos
13. Checkout nivel 1 — entrega en persona ya no viene por defecto; casilla ámbar de confirmación; probado en navegador
14. 9 URLs solicitadas en GSC + sitemap releído
15. Hallazgos: el cuello es activación (no captación); 69% se registra y no publica; loop logístico depende de Vero a mano

## EL PROBLEMA DE FONDO 🔴 — el loop logístico depende de Vero

Patrón repetido todo el día: Carlos vende por fuera y transfiere aparte; comprador de "Agua fresca" perdido tras pagar; Sarah con retiro fallido sin saber qué hacer; comprador pregunta por "Hijo de ladrón" que SÍ está en el sitio. El sitio publica y cobra bien, pero el tramo despacho→entrega→cierre y la búsqueda obligan a intervención manual de Vero. Cada venta = una conversación de WhatsApp.

DATO CONFIRMADO Y RESUELTO HOY: la etiqueta automática de Shipit SÍ funciona. Se pasó de 6 a 78 vendedores activados + 11 orígenes propios creados y guardados hoy (9 región + Bardo + CIMLibros + Buhardilla). Crear el origen es MANUAL por límite de Shipit (su API no tiene POST para orígenes, solo GET) — no es olvido, está en la decisión D1. Todo lo que rodea al paso manual está automatizado (gong con los 6 campos, freno en needs_origin).

### Orígenes Shipit — CERRADO ✅ (doc: SHIPIT_ORIGENES_9)
Guardados hoy con --set: fernando.romero, ayleen.perez, veronica, andrea.dip, rodrigo.cumsille, josefa.cerda, emilia.quezada, lorena.cortes, nicolas (Libros del Bardo, 249 libros), cimlibros (Carlos), buhardilla. Ya tenían: Nicole, LDO, Scarlett. Carlos y Buhardilla ya NO despachan con el remitente de Vero — usan el propio.
PENDIENTE: 6 vendedores con catálogo pero SIN calle en su dirección (guardaron solo comuna por bug del mapa): Ruth Díaz (Puerto Varas, 63 libros), Sebastián Mora (16), Sandra Alarcón (10), Giovani Bassaletti (5), Elizabet Ramos (3), Bryan (1). Hay que pedirles calle+número antes de crear su origen.

### Ciclo de retiro — CERRADO ✅
- **Pieza A** (commit 8e79a1e, desplegada): worker lee el retiro de Shipit; si hay retiro agendado, Mis Ventas dice "el courier pasa el [fecha]" en vez de "déjalo en sucursal". Arregló la contradicción que confundió a Sarah.
- **Pieza B** (commit 32b55e2, desplegada, probada en vivo): 3 salidas del vendedor sin escribir a Vero — pedir otro retiro / dejar en sucursal / no puedo despacharlo (cancela, republica el libro, avisa al comprador, gong para reembolso a mano).
- OJO por confirmar en real: el DELETE de pickups de Shipit dio 404 con id de prueba. La 1ª vez que un vendedor use "lo dejo en sucursal" con retiro real, verificar en el panel que se anuló; si no, el gong avisa para hacerlo a mano.

## BUGS/CASOS NUEVOS (anotados, no urgentes)
- **Primer clic perdido**: tras cargar la página, el primer clic en los botones de retiro a veces no registra. Pasó en las 3 pruebas. Riesgo: vendedor cree que no funciona y escribe por WhatsApp. Arreglar.
- **Buscador vs WhatsApp**: comprador preguntó por "Hijo de ladrón" (está en el sitio) en vez de buscarlo. Diagnóstico pendiente: ¿por qué van a WhatsApp? NO poner bot — arreglar la raíz (buscador más prominente, tolerar sin tilde, WhatsApp menos visible).

## LO QUE QUEDA (por retorno real, dado el reloj de infraestructura)

1. **Post-compra con retiro** — instrucciones automáticas tras pagar (comprador queda perdido). EN CURSO (diagnóstico enviado).
2. **Activar shipit_auto_enabled** para los vendedores con origen en Shipit — los saca del WhatsApp para despachar. Sin desarrollo, es configuración.
3. **Diagnóstico de COSTOS de infraestructura** — Vercel/Supabase/Mapbox/Resend: qué bajar a tier gratis. Compra tiempo antes de que se caiga por no poder pagar.
4. **Buscador vs WhatsApp** — diagnóstico de por qué compradores preguntan por libros que están en el sitio.
5. **Bug del primer clic perdido** en botones de retiro.
6. **Checkout nivel 2** — pedir comuna del comprador antes de mostrar opciones; bloquear retiro entre regiones lejanas.
7. **Cuello del 69%** que se registra y no publica — mayor palanca de crecimiento. HILO NUEVO.
8. **6 vendedores sin dirección** (Ruth Díaz +5) — pedirles calle+número.
9. **Arreglo de captura de dirección** (3 puntos capturan mal: ProfileForm, LocationPicker, endpoint; el mapa guarda comuna sin calle). Proyecto aparte.
10. Lote 3 de autores (tras medir 1-2); difusión IG/LinkedIn.

## CONTEXTO PARA EL HILO DEL 69% (diagnóstico ya hecho hoy)
De 389 registros, 127 publican (32,6%), 262 nunca. Proporción estable: 41% may, 37% jun, 34% jul, 36% ago.
HALLAZGO CLAVE: de los 127 que publican, 94 lo hacen en la 1ª HORA y 108 en las primeras 24h. Solo 10 entre el día 1 y 7. **Quien no publica el primer día, casi no vuelve.** → un recordatorio a los 3 días llega tarde; la batalla se gana en el onboarding inmediato.
NO existe hoy: ningún correo/recordatorio automático a quien se registró y no publicó (el mp-nudge descarta a quien no tiene listings). El único envío fue manual, 24-jun, 8 correos.
Fricción de /publish ya trabajada en tandas (perfil progresivo, landing para deslogueados, Google login, quitar muro "completa perfil", MP antes de catálogo). Login con Google es hoy el canal principal de altas.
El registro NO pide dirección (53 vendedores con city vacía). Conecta con el arreglo de captura de dirección (#9).

## NO HACER (trampas caras)
- Bot / "WhatsApp inteligente" para clientes: parche caro sobre un agujero de diseño. Lo correcto es cerrar el loop para que la conversación no haga falta.
- Captar libreros nuevos: agrega catálogo que no vende. Primero activar los 8 actuales.
- Compra-reventa con IA: convierte marketplace en retailer, inmoviliza caja.

## MEDICIÓN — revisar 21-09

- Sesiones home → tienda: de 6% a >15%
- Reseñas creadas / órdenes delivered: >40%
- ¿José/Juan Adrián conectaron MP?
- ¿Páginas de autor traen tráfico? ("neruda poemas" ya subió 79→21 el 08-sep)
- Medición limpia parte desde el fix del service worker de hoy

## LOTE P16 — decisión de producto (Vero, 08-09-2026)

**Ficha de vendedor SIN MercadoPago: no mostrar la opción de courier ni "desde $2.900".**
En su lugar: *"Solo entrega en persona — este vendedor aún no activa el pago protegido"*.

Razón: hoy la ficha le promete al comprador un despacho que no existe. El cambio deja de
mentirle al comprador y le mete presión indirecta al vendedor, que ve su ficha degradada
frente a las de las librerías de confianza.

**NO hacer:** esconder el WhatsApp en fichas sin MP. Mata la venta sin ganar captura.
La palanca es convertir al vendedor, no castigar al comprador.
(Consistente con `lib/whatsapp-policy.ts` y con el experimento abierto el 25-08.)

## PENDIENTE — ranking de fichas sin MP por precio × visitas (sesión aparte)

Los 64 vendedores sin MP no valen lo mismo. Sacar el ranking, contactar 1 a 1 a los 10
primeros y el resto por correo masivo.

⚠️ Corrección al caso Bárbara (verificado en BD el 08-09): hay **dos** Bárbaras.
`@barbara` (Lo Barnechea, 7 libros) **ya tiene MercadoPago** — es a la que apunta
`scripts/_check_barbara_traffic.mjs:22`, que filtra por `username='barbara'`.
La del Neruda de Algarrobo es **`@barbara.saavedra`**, alta del 30-ago, 1 solo listing.
Su ficha tiene **7 vistas en 30 días** (70 fichas la superan; máximo del mes: 29), y
**no hay ningún pedido de Neruda vivo en Se busca** (el único "obras completas" es del
13-jul, sin autor y ya cumplido). El argumento que sí se sostiene: es su único libro,
cuesta $150.000 y hoy nadie se lo puede pagar por el sitio.
Antes de prometerle despacho automático: confirmar que Shipit retira en Algarrobo (caso
Melipeuco).
