# Tablero de sesión — tuslibros.cl · 24-09-2026

**Objetivo del día:** sumar librerías de usados como vendedoras para competir con Mercado Libre y Buscalibre.
**Regla:** una cosa a la vez. Se cierra un punto antes de abrir el siguiente.

---

## 1. PRIMERO — Arreglo de venta doble (P0, bloquea todo lo demás)

Sin este arreglo no se puede recibir a ninguna librería con libros únicos.

| Paso | Qué | Estado |
|---|---|---|
| 1a | Claude Code entregó el plan (reserva atómica + webhook condicional) | ✅ recibido |
| 1b | Enviarle la respuesta con los 4 ajustes (ver abajo) | ✅ cerrado |
| 1c | Revisar la migración ajustada antes de dar el OK | ✅ cerrado |
| 1d | Prueba con libro de @vero + comprador de prueba | ✅ cerrado |
| 1e | Deploy y verificación en producción | ✅ cerrado |
| 1f | Mostrar "reservado" en la ficha (segundo paso, después del fix) | ✅ cerrado |

**Bitácora:**
- 24-09 — 1b: respuesta con los 4 ajustes recibida. Duraciones: MercadoPago 60 min, transferencia 24 h, máximo 3 compras por transferencia pendientes por comprador.
- 24-09 — 1c: migración escrita en `supabase/migrations/20260924_reservas_venta_doble.sql`, **sin aplicar**. Un cambio respecto del ajuste 1: la reserva va en una tabla aparte (`listing_reservations`) y no en columnas de `listings`, porque `listings` se lee sin sesión (dejaba a la vista quién compra qué) y el vendedor puede editar su fila (podía borrar una reserva ajena). Lo demás, como se pidió.
- 24-09 — 1c: OK de Vero; migración `reservas_venta_doble` aplicada en Supabase. Solo `service_role` puede ejecutar las tres funciones (verificado).
- 24-09 — 1d: prueba contra la base, 16/16 OK: dos compradores simultáneos → gana uno; reintento del mismo comprador pasa; carrito parcial se revierte entero; duplicados; tope de 3 transferencias; cobro doble registra el incidente una sola vez y no marca vendido. Prueba del endpoint en local con sesión real, 4/4 OK: 200 + 409, reserva de 24 h, reintento sin 409. Sin correos ni Telegram (claves vacías, confirmado en el log). Todo borrado: 0 usuarios, 0 órdenes, 0 reservas, libros activos.
- 24-09 — hallazgo aparte, no tocado: la compra como invitado (`guest_info` sin sesión) falla por RLS al insertar la orden. Hoy no se usa porque el checkout exige login; es código muerto desde el 24-04.
- 24-09 — 1e: commit `6bec57a` en producción (deploy Ready 15:54, creado 5 s después del commit). Home, /libros-antiguos y /vendedor/vero responden 200; /api/orders sin sesión sigue en 401. MercadoPago acepta `expires` + `expiration_date_to` (preferencia de prueba creada con vencimiento de 1 minuto, sin notification_url). Falta ver una compra real con el arreglo puesto.
- 24-09 — 1f: la ficha consulta `/api/listings/[id]/reserva` (sin caché; la ficha se cachea 60 s) y, si otra persona tiene el libro reservado, cambia el botón de comprar por el aviso "Reservado: alguien lo está comprando" + "Enviar mensaje", y esconde la barra fija del celular. La API responde solo sí/no, sin decir quién ni hasta cuándo. Probado en local con Playwright, escritorio y iPhone, 11/11 OK, con las métricas bloqueadas (0 visitas registradas) y todo borrado.

**Hallazgos de las capturas:** ✅ cerrados el 24-09 (ver abajo).
- ✅ 24-09 — idea de Vero: donde no cabe el nombre entero (tarjetas del catálogo, "Vendido por", página del pedido, correos al comprador), un nombre que empieza con artículo va como sigla: **"La Biblioteca de Vero" → "LBV"**. El resto sigue con la primera palabra ("Juan Adrián" → "Juan"). Función `nombreCortoVendedor` en `lib/nombreVendedor.ts`. Hoy solo afecta a @vero, la única cuenta cuyo nombre empieza con artículo. Los correos donde se saluda al propio vendedor no cambian.
- ✅ 25-09 — **Logo LBV "Ex libris"** (fondo azul tinta, LBV en crema, "La Biblioteca de Vero"), elegido por Vero entre 3 propuestas. Solo en la cabecera de su tienda (`/vendedor/vero`) y en el JSON-LD de la tienda; en fichas, tarjetas y checkout sigue su foto. PNG en `covers/tiendas/lbv-ex-libris.png`, registrado en `site_config.logo_tienda` por username.
- ✅ La ficha firmaba la nota con la primera palabra del nombre ("— La, dueño del libro"). Ahora firma con el nombre completo: "— La Biblioteca de Vero".
- ✅ La ficha ofrecía "Despacho courier · Starken · Chilexpress · 24-48h · desde $2.900" (tarifa de Shipit, apagado desde el 15-09). Ahora dice "Despacho a todo Chile · 2 a 5 días hábiles desde que el vendedor despacha · desde $5.490", con la tarifa leída de `site_config` según la región del vendedor, y **solo si el vendedor cobra en el sitio** (MP o transferencia). Sin cobro, queda solo "Encuentro en persona" (decisión P16 del 08-09). Probado en local con un libro de @vero (despacho visible) y uno de juan.adrian (oculto).

**Respuesta para pegarle:**

```
Apruebo el plan con estos ajustes antes de aplicar la migración:

1. Reintento del mismo comprador: agrega reserved_by (comprador) a listings.
   La función debe permitir reservar si la reserva vigente es del mismo
   comprador, y al iniciar un checkout nuevo se liberan las reservas de sus
   órdenes pendientes anteriores. Un comprador nunca debe recibir 409 por su
   propia reserva.
2. En reservar_listings, quita duplicados de p_ids antes de comparar con
   row_count.
3. Webhook (MP y pago-recibido): marca vendido solo si
   (reserved_bundle = este bundle) o (reserved_until is null o < now()).
   Si otra persona tiene una reserva vigente, va al aviso de choque.
4. Cobro doble: registra el incidente en una tabla (idempotente por
   payment_id) y dispara Telegram desde ahí. Nada de avisos repetidos por
   los reintentos de MP.

Duraciones: MercadoPago 60 minutos. Transferencia 24 horas, no 72, con un
máximo de 3 órdenes por transferencia pendientes por comprador.

Prueba: sí, con un libro de @vero y un comprador de prueba. Sin correos,
sin WhatsApp, sin etiquetas de Shipit y sin que las órdenes queden en
métricas. Borra todo al terminar.

Mostrar "reservado" en la ficha: sí, como segundo paso, después de este fix.

Muéstrame la migración ajustada antes de ejecutarla.
```

---

## 2. SEGUNDO — Revisar la medición del 21-09 (decide si se capta o no)

El 08-09 congelaste la captación hasta probar que los libreros actuales venden.

| Pregunta | Respuesta |
|---|---|
| ¿José Santis y Juan Adrián conectaron MercadoPago? | ❌ **No, ninguno.** José sigue publicando (198 activos, último el 24-09); Juan Adrián, 116 activos, no publica desde el 14-07. |
| ¿Se movieron las ventas de los 8 libreros con inventario? | 🟡 **Sí, pero concentrado.** Hoy califican 6 tiendas de confianza, no 8 (no quedó guardada la lista del 08-09). Compras pagadas: 10 en los 30 días previos al 08-09 → 11 en los 16 días siguientes (≈ el doble por día). **7 de las 11 son de libro.de.ocasion**; nicolas, cimlibros y lorena.cortes, 0. Se mezcla con el experimento del WhatsApp (25-08). |
| ¿Sesiones de la portada a tiendas subieron de 6% a más de 15%? | ❌ **No.** 5,7% antes (09-08 al 07-09, 2.367 sesiones) → 6,9% después (09-09 al 24-09, 1.180 sesiones), contando /vendedor y /tiendas y sin bots. |

**Bitácora:**
- 24-09 — medición cerrada con la base (SQL de solo lectura). De las tres condiciones, solo las ventas se movieron, y casi todo por un vendedor. La decisión de descongelar es tuya.
- 24-09 — **Decisión de Vero: se descongela la captación.** Sale ella misma a buscar librerías: primero mirando Mercado Libre como compradora, después por Instagram (punto 3).
- 24-09 — **Por qué subieron las ventas en el lanzamiento de libro.de.ocasion (y por qué bajaron):** 16 de las 20 compras del pico (31-08 al 13-09) fueron **con despacho por courier**; en persona se mantuvo en ~2 por semana. Desde el 15-09, día en que se apagó Shipit, las compras con despacho bajaron de 8 por semana a 1 o 2, y el checkout pasó de convertir ~32% a ~14%. Coinciden también los anuncios que tapaban el botón (15-17) y el MP de @vero desconectado (16-09): es correlación. La promo de envío gratis no se usó nunca (descartada). La mitad de lo vendido por libro.de.ocasion es de un solo comprador. ~~Pendiente: revisar el despacho coordinado en el checkout~~ ✅ revisado el 24-09 (ver abajo).
- 24-09 — **Checkout revisado. Hallazgo: quien cobra solo por transferencia no podía vender con despacho.** Tres lugares pedían MercadoPago para ofrecer el despacho coordinado (`/api/shipping/quote` y las páginas `checkout/[id]` y `checkout/bundle`), aunque `POST /api/orders` ya lo aceptaba con transferencia. Desde el 16-09 (MP de @vero desconectado) los libros de @vero solo se podían retirar en persona: el checkout mostraba "Este vendedor todavía no despacha por courier". Arreglado: la regla ahora es MP **o** transferencia en los cuatro lugares. Con MP (libro.de.ocasion, buhardilla) el despacho ya funcionaba ($5.490 / $7.990 / $12.490). Probado en local: cotización para vero a 4 comunas, compra completa por transferencia con despacho a Temuco ($7.990, orden `coordinado` + `transfer`, borrada) y el checkout en pantalla. El checkout de carrito (`bundle`) tiene el mismo cambio, pero no se probó en pantalla. De paso, "Vendido por La" → "Vendido por La Biblioteca de Vero" en el checkout.
- 24-09 — Queda abierto: con MP, libro.de.ocasion pasó de 17 intentos de compra a 2 desde el 15-09 aunque el despacho coordinado sí se le ofrece. El bloqueo de @vero no explica esa caída; hay que seguir mirando (¿precio de $5.490 contra los ~$4.900 de Starken?, ¿los anuncios del 15-17?).

- Si los números se movieron → **se descongela la captación** (punto 3).
- Si no se movieron → captar más solo suma catálogo que no vende. Se sigue activando.

---

## 3. TERCERO — Captación de libreros (solo si el punto 2 da luz verde)

Base: **plan de prospección del 10-09** (Instagram primero, Facebook después, Mercado Libre solo observación).

| # | Prospecto | Canal | Prioridad | Estado |
|---|---|---|---|---|
| 3a | @reliquialiterarias (14,5 mil) | Instagram | alta | pendiente |
| 3b | @librosretro_ (6,9 mil) | Instagram | alta | pendiente |
| 3c | @libros.delsur (6,4 mil, 15 años) | Instagram | alta | pendiente |
| 3d | @euclideslibros (Providencia, tienda física) | Instagram | alta | pendiente |
| 3e | **El Cid Campeador** (Merced 345, ~40 mil libros) | **En persona** | alta, caso especial | pendiente |
| 3f | Libros del Ayer (anticuaria, Las Condes) | Correo o visita | media | pendiente |
| 3g | Eco Lectura (Patronato, 100 mil+) | Visita | media, verificar catálogo digital | pendiente |
| 3h | AveLibros (Paine, sale de Mercado Libre) | Su sitio / correo | media | pendiente |

**Mercado Libre, mirado a mano por Vero (24-09):** en libros físicos usados hay **119.850 publicaciones**, y con el filtro "Mejores vendedores" (MercadoLíderes) quedan **3.784, el 3,2%**. El usado en Mercado Libre está repartido entre muchos vendedores chicos: los profesionales son pocos y se pueden recorrer a mano. Anotar los que se repitan con "libros", "librería" o "tienda" en el nombre.

**El Cid, antes de ir:**
- [ ] Arreglo de venta doble ya en producción (punto 1)
- [ ] Tu tienda abierta en el teléfono para mostrar
- [ ] Pedirle: el archivo que manda a AbeBooks/Buscalibre + en qué moneda viene
- [ ] Ofrecer piloto de 1.000–2.000 libros (historia de Chile y poesía)
- [ ] No prometer "reserva online, retira en tienda": aún no existe

---

## 4. EN ESPERA — Importador masivo

| Qué | Estado |
|---|---|
| Plan de Claude Code (no emparejar sin ISBN, script local, tandas, /vendedor ampliado) | ✅ aprobado con ajustes |
| Enviarle los ajustes del importador | ⏳ después del punto 1 |
| Archivo real de El Cid | ⏳ depende de la visita (3e) |

---

## 5. TUS LIBROS — precios definidos

Precios y pisos en `docs_desde_claude/PISOS_LIBROS_VERO_2026-09.md` (privado: el repo es público y un piso publicado no sirve para negociar).

| Libro | Pendiente |
|---|---|
| Alcalde, *El panorama ante nosotros*, Nascimento 1969 | — |
| Neruda, *Obras completas*, Losada | verificar si es 1957 (1.264 p.) o 1962 (2.ª ed.) |
| Neruda, *Sumario*, Tallone 1963, N.º 180 | confirmar si es tuyo o de Sebastián en consignación (la memoria dice que es de él) |

---

## 6. IDEAS DE CONTENIDO (anotadas mientras Vero busca librerías)

**Cómo ordena Mercado Libre su página de libros** (captura de Vero, 24-09; no se abrió con herramientas automáticas):
1. Banner de promesa logística: "Envíos en 48 horas · Envío gratis desde $19.990".
2. Fila de **tiendas con logo** (Contrapunto, Librenta, Antártica, Zig-Zag, Santillana…): las librerías como marca, arriba de todo.
3. "Todos los libros que buscas": 4 géneros grandes con foto (novela y ciencia ficción, infantil, negocios, autoayuda) y después 8 chicos (escolares, cómics, romance, terror, cocina, **autores chilenos**, religión, manualidades).
4. "Lo más buscado": novedades, outlets, **estuches y packs**, **escolares y lecturas complementarias**.
5. Libros importados, y abajo el programa de afiliados.

**Qué sirve y qué no, con nuestros datos:**
- ⚠️ No copiar la portada de filas. Acá la gente **busca, no navega**: buscador 1.629 clics contra categorías 103 (medido el 17-09). La portada bajó de 19,6 a 10,7 pantallas a propósito. Las filas de Mercado Libre funcionan para catálogo nuevo con stock repetido; lo nuestro es ejemplar único.
- ✅ La **fila de tiendas con logo arriba** es lo mismo que "Librerías de confianza", pero ML la pone antes que los libros. Cuando entren El Cid y las de Instagram, esa fila vale más con logos reales que con avatares.
- ✅ **"Autores chilenos"** tiene casilla propia en ML. Nosotros tenemos la etiqueta `impreso-chileno` y `/libros-antiguos`, pero no una entrada de "autores chilenos" (usados, no solo antiguos).
- ✅ **"Escolares y lecturas complementarias"**: ya existe `/libros-escolares`. ML confirma que es de lo más buscado; conecta con la demanda de "educación ciudadana 3º medio" (71% de la demanda temática, 22-09).
- ✅ **"Estuches y packs"**: en usados son las **sagas completas** (la colección de fantasía de Cata, tomos I y II como el Plutarco). No tenemos cómo mostrarlas juntas.
- ❌ "Envío en 48 horas": no lo podemos prometer (despacho coordinado, 2 a 5 días hábiles).

**Ideas de contenido** (para redes, newsletter o landing; ninguna hecha):
| # | Idea | Por qué |
|---|---|---|
| 6a | "Lecturas complementarias usadas: la lista del colegio a mitad de precio" | ML lo pone en "lo más buscado"; ya hay `/libros-escolares` |
| 6b | "Autores chilenos que ya no se imprimen" (Alcalde, Nascimento, Zig-Zag) | Lo que ML vende nuevo, nosotros lo tenemos agotado |
| 6c | "Sagas completas": una publicación que junta los tomos de una colección | El equivalente usado de "estuches y packs" |
| 6d | "La librería de la semana" con su historia y su logo | La fila de tiendas de ML, pero con historia: lo que Buscalibre le quita a El Cid |
| 6e | "Lo que ML vende nuevo a $X, acá usado a $Y" (un título por semana) | Comparación honesta de precio; verificar cada precio antes de publicar |
| 6f | **Página `/ofertas`** con los libros rebajados | Hoy hay **577 libros activos con precio rebajado, de 94 vendedores** (`original_price > price`, 24-09), y no existe una página que los junte. Top10Books tiene una con 70 y la promociona con Google Ads (el enlace de la captura trae `gad_source`). Mercado Libre pone "Outlets" en "lo más buscado". |

- 24-09 — sección creada a pedido de Vero, a partir de su captura de Mercado Libre.
- 24-09 — captura de **Top10Books** (`/ofertas`): menú por uso (literatura complementaria, técnico y universitario, textos escolares, ofertas), filtro por tramos de precio con conteo ("Hasta $9.900 (17)"), filtro por autor con conteo, etiqueta de % de descuento y "Entrega mañana" en cada libro. Nuestro listado ya filtra por precio (mínimo y máximo) y autor, pero a mano, sin tramos ni conteos. Lo que más sirve es la idea 6f.

---

## 7. MAÑANA 25-09 — revisar en detalle (le preocupa a Vero)

**¿Por qué libro.de.ocasion pasó de 17 intentos de compra a 2 desde el 15-09, si tiene MercadoPago y el despacho coordinado sí se le ofrece?**

| # | Qué revisar | Cómo |
|---|---|---|
| 7a | ¿Los compradores llegan al checkout de libro.de.ocasion y no crean la orden? | `page_views` de `/checkout/<id>` de sus libros, antes y después del 15-09, contra órdenes creadas |
| 7b | Precio: $5.490 coordinado contra ~$4.900 promedio de Starken antes | Comparar el flete que pagaron en el pico con lo que cotiza hoy, por zona |
| 7c | Los anuncios que tapaban el botón (15-17 sep) | Separar esos días del resto |
| 7d | El texto del despacho coordinado ("el vendedor lo manda…, 2 a 5 días desde que lo despacha") ¿asusta frente a "Starken 24-48h"? | Leerlo en el checkout como comprador |
| 7e | ¿Cambió algo en libro.de.ocasion? (pausas, precios, catálogo, vacaciones) | `listings` y `users` de libro.de.ocasion desde el 15-09 |
| 7f | Verificar en producción que tus libros ya ofrecen despacho en el checkout (no se pudo con la sesión de prueba) | Vero con otra cuenta, o alguien de confianza |

- 24-09 — anotado a pedido de Vero para verlo en detalle el 25-09.

---

## DESCARTADO ✅

- **Ranking de vendedores de Mercado Libre por API:** viola los términos de uso (cláusula 7.4, prohíbe usar datos para servicios que compitan con Mercado Libre) y la búsqueda responde 403 desde abril de 2025. No se retoma.
- **Navegación automatizada de Mercado Libre:** descartada por ti.
- **Alternativa válida si se quiere:** mirar tú como compradora, anotar tiendas que se repiten y contactarlas por su canal público (Instagram o sitio propio).

---

## ORDEN

1. ~~Pegar la respuesta del punto 1 a Claude Code~~ ✅ → revisar la migración y dar el OK ← **AHORA**
2. ~~Revisar números del 21-09 (punto 2)~~ ✅ → decidir si se descongela la captación
3. Si hay luz verde: mensajes a los 4 de Instagram + visita a El Cid
4. Importador, cuando llegue el archivo de El Cid
