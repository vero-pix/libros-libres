# Prompts para Claude Code — sprint de captura (25 ago 2026)

Contexto y números en `docs_desde_claude/CALUGA_Y_CAPTURA.md`.
Ejecutar **de a uno**, en orden. Cada bloque ` ``` ` se pega tal cual en Claude Code.

Reglas que aplican a todos (ya están en `CLAUDE.md`, se repiten porque importan):
probar en local con rama + `npm run dev` antes de push · `npm run build` verde ·
nunca `--no-verify` · español chileno, primera persona · no tocar `/novedades`.

---

## P0 · Sacar el manual de evasión del copy — 10 minutos, hoy

Es el que más urge: contradice el experimento que ya está desplegado.

```
El 25 de agosto desplegamos lib/whatsapp-policy.ts: si el vendedor tiene MercadoPago
conectado, su WhatsApp deja de competir con el botón de comprar. El objetivo es subir la
tasa de captura, que en agosto fue 1,9% ($1.440 de comisión sobre $1.720.981 vendidos).

El problema: nuestro propio copy le enseña a la gente a evadir la comisión.

1. app/api/newsletter/route.ts, línea ~89 (correo de bienvenida):
   "Cobro 8% de comisión solo si la venta pasa por MercadoPago — si la cierras en persona,
   no cobro nada."
2. app/(main)/como-funciona/page.tsx, línea ~87:
   "Si coordinas por WhatsApp y se entregan en persona, no cobro nada."

Reescribe ambos pasajes para que sigan siendo transparentes sobre cuándo se cobra, sin
funcionar como instructivo para saltarse la caja. Dirección propuesta, ajústala a la voz:

   "Publicar es gratis, siempre. Cobro 8% cuando la venta se cierra acá, con el pago
   protegido y el despacho resuelto. Eso es lo que paga el servidor y las horas."

En el mismo correo de bienvenida hay otro punto: ofrece mi WhatsApp personal para subir
libros en volumen ("mándame una foto de la ruma o un Excel por WhatsApp"). Mantén la
oferta de carga masiva —es buena— pero canalízala por la mensajería interna del sitio o
por un formulario, no por WhatsApp.

No inventes cifras de comisión ni cambies el 8%: la fuente es lib/commissions.ts.
Busca en todo el repo si la misma promesa está repetida en otras páginas cara al usuario
(faq, vender, sobre-nosotros, guías de onboarding en docs/) y arréglalas todas en el
mismo commit.
```

---

## P1 · Envío gratis sobre $25.000 con barra de progreso

La palanca de mayor retorno. Un libro a $8.990 con courier de ~$3.500 sale 39% más caro
en el carrito que en la ficha; por eso el carrito no convierte (28 items / 11 personas
en 30 días).

```
Quiero implementar un umbral de envío gratis para subir el ticket promedio y arreglar la
economía del despacho. Hoy la orden promedio es de un libro y la mediana de precio de mi
catálogo es $8.990, así que el flete pesa casi 40% del ticket.

Alcance de esta primera vuelta: SOLO para los listings del seller vero
(2201d163-4423-4971-91f0-f6cebd00d1bd). El flete lo asumo yo, no quiero imponérselo a
otros vendedores todavía.

Requisitos:
1. Umbral configurable en un solo archivo (tipo lib/shipping-promo.ts), con el monto
   ($25.000), la fecha de término y el seller al que aplica. Nada hardcodeado en los
   componentes.
2. En app/(main)/carrito/CartView.tsx: barra de progreso con el texto exacto que falta —
   "Te faltan $8.010 para el envío gratis" — y estado cumplido cuando se pasa el umbral.
   Solo se muestra si el carrito tiene libros elegibles.
3. En el checkout (components/checkout/CheckoutForm.tsx y BundleCheckoutForm.tsx): el
   costo de despacho baja a $0 cuando corresponde, y el desglose lo dice explícito. Revisa
   cómo se calcula hoy el shipping_cost con lib/shipit.ts / lib/chilexpress.ts y no rompas
   el cálculo de service_fee ni el split de MercadoPago.
4. La comisión del 8% se sigue calculando sobre el precio del libro (lib/commissions.ts),
   no sobre el total con despacho. Verifícalo.
5. Badge en ListingCard: no agregues una caluga nueva. La prioridad de badges es estricta
   y de a una (pickPrimaryBadge). Si quieres comunicarlo en la tarjeta, propónmelo antes.

Antes de escribir código: dime qué encontraste sobre cómo se calcula hoy el despacho y
dónde exactamente se inyecta en la orden, para revisar el plan.

Criterio de aceptación: agregar 3 libros de vero al carrito muestra la barra, llega a
$25.000+, el checkout cobra $0 de despacho, la orden se crea con shipping_cost = 0 y el
service_fee intacto. npm run build verde y flujo probado en el navegador.
```

---

## P2 · Lotes temáticos a precio cerrado

Cambia la unidad de venta. Es la "caluga de oferta" bien hecha: no un descuento más
grande, sino un producto distinto.

```
Quiero vender lotes: "5 novelas negras por $19.990", "3 de historia de Chile por $14.990".
Precio cerrado, sin que el comprador tenga que elegir libro por libro. Resuelve tres cosas
a la vez: hace rentable el flete, simplifica la decisión y da salida a los 161 títulos míos
que nadie busca por nombre.

Ya existe la infraestructura de bundle: orders con bundle_id compartido, una preferencia
MP, external_reference = bundle_id, shipping y fee solo en la primera order del bundle.
Revísala antes de proponer nada nuevo (app/(main)/checkout/bundle, BundleCheckoutForm.tsx).

Lo que necesito, en dos etapas:

ETAPA 1 — el script. Un script en scripts/ que arme los lotes desde la BD:
- Solo listings de vero (2201d163-...), status active, ordenados por antigüedad
  (created_at ascendente). Los 198 activos tienen mediana 136 días publicados.
- Agrupa por tag (books.tags es un array text[], vocabulario en lib/tagSuggester.ts).
- 12 lotes de 5 libros = 60 títulos. Precio del lote: redondeo a $990 más cercano de la
  suma de los precios individuales con un descuento adicional que me propongas y me
  muestres en dry-run antes de aplicar.
- Modo --apply, y guardar reversa en JSON igual que scripts/_apply_50_liquidacion.mjs.
  Sin la reversa no lo apliques.

ETAPA 2 — la vitrina. Cómo se muestra un lote en el sitio. NO lo implementes todavía:
primero muéstrame 2 o 3 opciones (¿un listing especial? ¿una entidad nueva? ¿una colección
con checkout de bundle precargado?) con el costo de cada una en archivos tocados y en
migraciones. Elegimos juntos.

Restricción: los lotes son SOLO de libros míos. Nunca mezclar listings de otros vendedores
en una pieza de marca ni en un lote.
```

---

## P3 · `/ofertas` como evento con fecha de cierre

Hoy da 404. Buscalibre no gana por tener más descuento: gana porque el descuento tiene
apellido ("B-Days de Aniversario"), fecha y un solo botón.

```
Construir /ofertas. Hoy es 404 y es el destino que le falta al sitio: no tenemos página de
ofertas ni link-in-bio, y estamos mandando el tráfico de Instagram al home.

Sigue el patrón de app/(main)/coleccion/[slug]/collections.config.ts — config-driven, sin
datos hardcodeados fuera del archivo de config.

Contenido:
1. Encabezado de evento: nombre, motivo y FECHA DE CIERRE visible. Una página de ofertas
   permanente se vuelve invisible en dos semanas; esta tiene que terminar. Copy en primera
   persona, humor confesional, nada de frases de agencia. Punto de partida:
     "Estoy vaciando mi estantería. Doscientos libros que ya leí y que no voy a volver a
      leer. A mitad de precio hasta el 15 de septiembre, y si te llevas tres o más, el
      envío lo pago yo."
2. Grilla de listings con descuento activo (original_price > price). Usa ListingCard tal
   cual: la caluga de -X% ya funciona.
3. Orden por % de descuento descendente como default, más orden por precio. Hoy el sitio
   ordena por precio pero no por descuento.
4. Filtro "solo lotes" si P2 ya está.
5. SEO: metadata propia, ItemList + BreadcrumbList. Que entre al sitemap.
6. Que sirva de link-in-bio: se abre en móvil, carga rápido, y lo primero que se ve es
   producto con precio, no un hero de marca.

Antes de publicarla, una auditoría aparte: script que revise todos los listings con
original_price > price y me liste los que tengan un descuento sospechoso (>60%) o cuyo
original_price nunca haya sido el precio real. En Chile el precio de referencia tachado
tiene que haber sido cobrado de verdad antes; no quiero publicar una página de ofertas con
precios inflados. Muéstrame el listado, no corrijas nada por tu cuenta.
```

---

## P4 · Que el tráfico social sea medible

Los 14 posts de `social/metricool-batch.csv` salieron con links sin UTM. En 8 semanas
Instagram mandó 416 visitas al sitio y **4** llegaron a una ficha mía. No podemos decidir
sobre un canal que no medimos.

```
Nuestro pipeline de contenido social genera links sin UTM y eso nos dejó ciegos: en el
batch de julio (social/metricool-batch.csv, 14 posts) los 14 links van a
tuslibros.cl/libro/vero/[slug] sin ningún parámetro. Desde el 1 de julio hay 416 visitas
con referrer de Instagram y solo 4 llegaron a una ficha de vero. Un solo page_view en toda
la base tiene utm_source=instagram.

Quiero cerrar eso:

1. Que TODOS los generadores de contenido emitan links con UTM. Revisa y arregla:
   - scripts/generar-post-social.mjs (produce social/metricool-batch.csv/json)
   - scripts/content-cards/ (fetchListing.ts ya tiene un campo buyUrl)
   - ideas/instagram-feed/captions.txt (193 piezas ya generadas)
   Convención: ?utm_source=instagram&utm_medium=social&utm_campaign=[nombre-del-lote].
   Un solo helper compartido, no la misma lógica copiada en tres lados.

2. Que los UTM sobrevivan. Verifica que middleware.ts y los redirects de vercel.json no
   se coman los query params, y que page_views guarde el path completo con querystring.
   Si hoy se pierden, arréglalo — es la causa más probable de que solo haya 1 registro.

3. Un script scripts/_social_attribution.mjs que responda: visitas por utm_campaign, a qué
   rutas llegan, cuántas terminan en cart_items y cuántas en orders pagadas. Que sirva para
   correrlo semanal, igual que scripts/_captura.mjs.

Dato que quiero explicado, no asumido: de las 416 visitas de Instagram, 155 fueron a
/vendedor/buhardilla y 0 a rutas de vero. Revisa la data y dime si eso es consistente con
que el tráfico venga de la cuenta de Buhardilla y no de la nuestra.
```

---

## P5 · Primer envío del newsletter

461 suscriptores + 299 usuarios registrados. Cero campañas enviadas.
`components/admin/NewsletterSender.tsx` está construido y sin usar.

```
Quiero mandar la primera campaña de newsletter de la historia del sitio, el mismo día que
abra /ofertas. Tenemos 461 suscriptores en newsletter_subscribers y 299 usuarios
registrados, y nunca les hemos escrito nada que no sea transaccional.

La herramienta ya existe: components/admin/NewsletterSender.tsx. Revísala y dime qué le
falta para mandar una campaña de verdad.

Estructura del correo, copiada de lo que funciona (Buscalibre nos manda esto mismo):
- Asunto con el porcentaje adentro y sin relleno.
- Banner con el nombre del evento, el motivo y la fecha de cierre.
- Tres lotes o tres libros con portada, precio tachado y precio final.
- UN solo botón, a /ofertas con UTM (utm_source=newsletter).
- Nada de párrafos largos. El correo transaccional de bienvenida está bien escrito y es
  largo a propósito; este es lo contrario.

Voz: primera persona, la mía. Humor confesional. Ni una frase de agencia.

Requisitos técnicos:
- Respetar unsubscribed_at: nunca enviar a alguien dado de baja.
- Link de baja en el pie, obligatorio.
- Deduplicar entre newsletter_subscribers y users por email.
- Modo preview y modo prueba (enviarme solo a mí) antes del envío real.
- Registrar el envío para poder medir apertura y clics, aunque sea de forma básica.

Muéstrame el HTML renderizado y la lista final de destinatarios ANTES de mandar nada.
```

---

## P6 · Conectar MercadoPago a los que faltan

458 de 2.024 listings activos (23%) son de vendedores sin MP. Ahí no hay experimento que
valga: sin MercadoPago no hay comisión posible.

```
Hay 458 listings activos (23% del total) de vendedores sin mercadopago_user_id, y 12 de los
20 libros que la gente puso al carrito en 21 días eran de ellos. Sin MP no hay comisión
posible, así que conectarlos es el proyecto de ingresos con mejor relación esfuerzo/retorno
que tenemos.

Ya existe /api/cron/mp-nudge (corre a las 14:00) y components/listings/MercadoPagoNudge.tsx.
Antes de construir nada:

1. Auditá qué hace hoy el nudge, a quién le llega, con qué frecuencia, y cuántas conexiones
   de MP se pueden atribuir a él desde que existe (users.mercadopago_connected_at).
   Si no está funcionando, quiero saberlo con datos, no una hipótesis.
2. Dame la lista priorizada de vendedores sin MP: cuántos listings activos tiene cada uno,
   cuántas vistas recibieron sus fichas en 30 días y cuántas veces sus libros llegaron al
   carrito. Los de arriba de esa lista los llamo yo por teléfono.
3. Recién después propóneme qué cambiar en el nudge.

No mandes ningún correo masivo sin mostrarme antes el texto y la lista.
```

---

## Qué NO hacer todavía

- **No cobrar el espacio destacado.** 21 slots sobre 2.808 vistas de home al mes son ~130
  impresiones por slot: no es vendible y ofrecerlo ahora quema la conversación para cuando
  sí valga. Primero liberar la vitrina (ocupo 10 de 21) y medir clics atribuibles con
  `featured_rank` + analítica `external-click` + el flujo `sponsor-request`.
- **No bajar más los precios.** Ya se liquidó al 50% en junio (`_apply_50_liquidacion.mjs`)
  y no movió la aguja. El problema es el flete, no el precio.
- **No producir más contenido de Instagram.** Hay 193 piezas en `ideas/instagram-feed/` sin
  publicar. El cuello de botella es distribución y medición (P4), no producción.
