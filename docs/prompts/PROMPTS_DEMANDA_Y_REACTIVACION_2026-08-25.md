# Prompts para Claude Code — demanda dormida y reactivación (25 ago 2026)

Continúa `docs/prompts/PROMPTS_CAPTURA_2026-08-25.md`. Mismos criterios: rama + `npm run dev`,
`npm run build` verde, español chileno en primera persona, nada de `--no-verify`.

Estos tres no piden fotos nuevas ni trabajo manual. Son código e inteligencia sobre datos que
ya están en la BD.

**Números que justifican el sprint** (Supabase, 25 ago 2026):

| Dato | Valor |
|---|---|
| Pedidos en `book_requests` | 136 · **132 abiertos** · 4 cumplidos (2,9%) |
| Con correo de contacto | 88 filas · 64 correos únicos |
| Antigüedad mediana de los abiertos | 40 días · el más viejo, 128 |
| Búsquedas sin resultado (30d) | 2.491 de 11.129 |
| Libros marcados vendidos (histórico) | 266 |
| Compradores que el sitio conoce | **9** |

Esa última fila es el punto: `listings` no guarda comprador, así que de 266 libros vendidos
sabemos quién compró 9. Cerrar por fuera no solo cuesta comisión — cuesta la lista de clientes.

---

## P7 · Motor de calce para los 132 pedidos abiertos

Es el activo de mayor intención del sitio y lleva meses quieto.

```
Tenemos 136 pedidos en book_requests: 132 abiertos, solo 4 marcados fulfilled, con antigüedad
mediana de 40 días y el más viejo de 128. 88 de esas filas tienen requester_email (64 correos
únicos). Es la gente que escribió el título exacto que buscaba y dejó su contacto: la mayor
intención de compra que tiene el sitio, y no la estamos usando.

Quiero un motor de calce que corra solo y avise cuando aparezca lo que alguien pidió.

ETAPA 1 — diagnóstico, antes de escribir nada del motor.
Un script en scripts/ que cruce los 132 pedidos abiertos contra el catálogo activo
(2.024 listings) y me diga:
- Cuántos pedidos YA tienen un calce razonable en catálogo y nadie avisó. Sospecho que hay
  varios; ese es el desperdicio que quiero ver primero.
- Con qué criterio calzaste (título normalizado, autor, ISBN) y cuántos falsos positivos
  produce cada criterio sobre una muestra que yo pueda revisar a ojo.
- Cuántos pedidos son irrecuperables (títulos ilegibles, duplicados como "Órdenes del amor" y
  "Ordenes delamor" que son el mismo libro pedido dos veces el mismo día).
Muéstrame la tabla. No implementes el motor hasta que yo apruebe el criterio de calce.

ETAPA 2 — el motor, recién cuando aprobemos la etapa 1.
- Cron nuevo o extensión de /api/cron/requests-digest (hoy corre a las 15:00; revisa qué hace
  exactamente y a quién le llega antes de tocarlo).
- Cuando se publica un listing que calza con un pedido abierto, avisar al solicitante por
  correo con link directo a la ficha (con UTM: utm_source=pedido).
- Marcar fulfilled / fulfilled_listing_id cuando el pedido se convierte en venta, para que la
  tasa del 2,9% sea medible de verdad.
- Anti-spam: máximo un correo por persona por día, nunca reenviar el mismo calce dos veces,
  link de baja.

ETAPA 3 — la otra dirección: los pedidos como lista de compra.
Los 132 pedidos y las 2.491 búsquedas sin resultado de los últimos 30 días son demanda que no
podemos servir. Genera un informe semanal, agrupado y deduplicado, con los títulos y autores
más pedidos que NO están en catálogo, ordenado por frecuencia. Lo quiero en un formato que yo
pueda mandarle tal cual a un vendedor. Solo el informe: nada de mandarlo automáticamente.

Ojo con la privacidad: requester_email y requester_whatsapp son datos de terceros. No los
expongas en ningún informe que yo pueda reenviar, ni los metas en logs.
```

---

## P8 · Reactivación por segmentos de intención

La tesis correcta —volver a los que ya levantaron la mano— con el matiz de que "los que me
compraron antes" son nueve personas. El activo real son cuatro segmentos, y merecen mensajes
distintos.

```
Quiero campañas de reactivación, pero antes necesito ver los segmentos reales. Mi intuición es
volver a la gente que ya me compró; el problema es que el sitio solo conoce 9 compradores
(orders.buyer_id) pese a que hay 266 listings marcados como vendidos — el resto se cerró fuera
y listings ni siquiera guarda quién compró.

ETAPA 1 — construir la vista de segmentos. Un script que me entregue, deduplicado por correo:
  A) Compradores con orden pagada (9)
  B) Gente que puso algo al carrito y no compró (25 usuarios distintos)
  C) Quienes pidieron un libro en /solicitudes (64 correos únicos)
  D) Suscriptores del newsletter sin compra ni carrito (461 activos, menos los de arriba)
  E) Usuarios registrados que nunca hicieron nada (299 menos los de arriba)
Para cada segmento: cuántos son, hace cuánto fue su última señal, y qué categorías o autores
tocaron. Quiero saber el tamaño real de cada uno antes de escribir un solo correo.

ETAPA 2 — un mensaje por segmento, no el mismo para todos. Propóneme el ángulo de cada uno y
muéstrame los borradores antes de mandar nada. Mi lectura inicial, discútela si no la compartes:
  A) Son nueve. Esto no es una campaña, es un correo escrito a mano por mí. Dame los nombres y
     qué compró cada uno; lo escribo yo.
  B) El más caliente: dejaron el libro en el carrito. Recordarles qué libro era, con la foto.
  C) Pidieron algo que no teníamos. El correo honesto es "todavía no lo encuentro, pero mira
     esto otro" — solo si el calce de P7 da algo decente. Si no, no escribir.
  D) y E) Nunca han recibido nada nuestro. Va el correo de campaña de /ofertas, no uno especial.

ETAPA 3 — cerrar el agujero de datos. Que el sitio deje de perder compradores: propóneme cómo
registrar quién compró cuando un listing pasa a completed fuera de MercadoPago (¿lo declara el
vendedor al marcar vendido? ¿un campo opcional?). Sin resolver esto, dentro de un año voy a
tener 1.000 libros vendidos y seguiré sin saber a quién. Dame opciones con su costo, no una
sola respuesta.

Reglas: respetar unsubscribed_at siempre, link de baja en todo, modo preview y modo prueba a mi
correo antes de cualquier envío real, y mostrarme la lista de destinatarios antes de mandar.
```

---

## P9 · Piezas de lote sin fotos nuevas

No voy a sacar más fotos. El generador ya compone portadas reales del catálogo.

```
Quiero las piezas de los lotes generadas 100% desde el catálogo, sin fotos nuevas. El generador
scripts/content-cards/ ya tiene una plantilla "lista" que arma una grilla de 3 a 6 portadas —
eso es exactamente un lote. Revisa scripts/content-cards/README.md, templates.ts y brand.ts
antes de proponer nada.

Lo que necesito:
1. Que el spec de un lote (los 5 slugs + nombre + precio cerrado) genere la pieza con la
   plantilla "lista", en 1080×1350, respetando SAFE_X para que Instagram no corte el wordmark.
2. Precio cerrado y precio de referencia visibles en la pieza: "5 novelas negras · $19.990
   (sueltos $34.950)". Hoy la plantilla no muestra precios; agrégalo sin romper las otras.
3. Caption automática con el link al lote y UTM (utm_source=instagram&utm_medium=social&
   utm_campaign=lote-[slug]). Usa el mismo helper de UTM del prompt P4 — no dupliques la lógica.
4. Selección de portadas: prioriza books.cover_url (la tapa de catálogo) por sobre
   listing_images. Ya sabemos que la foto principal de mis listings suele ser la contratapa,
   no la tapa. Si un libro no tiene tapa limpia, que quede fuera del lote y me avise cuál.
5. Solo libros míos (seller 2201d163-4423-4971-91f0-f6cebd00d1bd). Nunca mezclar otros
   vendedores en una pieza de marca.

Dame las 12 piezas de los 12 lotes en una corrida, con su manifest.json.
```

---

## Nota sobre "el evento y la fecha de cierre"

No es una función ni un módulo: es una decisión comercial de dos campos.

Un descuento sin fecha de término es simplemente un precio más bajo — nadie se apura, y en dos
semanas la página de ofertas se vuelve parte del paisaje. Un descuento con nombre y fecha es un
motivo para entrar hoy. Buscalibre no vende por descontar 80%: vende porque le puso apellido
("B-Days de Aniversario"), le puso fecha y no dejó otra puerta que un botón.

Los dos campos que hay que llenar, y que van al header de `/ofertas`, al asunto del correo y a
las captions:

- **Nombre del evento** — el motivo real, dicho como lo dirías tú. "Estoy vaciando mi
  estantería" ya es un nombre y es mejor que cualquier cosa que suene a retail.
- **Fecha de cierre** — 15 de septiembre da tres semanas: suficiente para dos envíos de correo
  y un ciclo de feed, corto para que apure. Después los precios vuelven, y eso hay que cumplirlo
  o la próxima vez nadie te cree.
