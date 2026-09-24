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

**Hallazgos de las capturas (pendientes, no tocados):**
- La ficha firma la nota del vendedor con la primera palabra de su nombre: en la tienda "La Biblioteca de Vero" sale "— La, dueño del libro". Afecta a toda tienda cuyo nombre empiece con artículo. El aviso nuevo no nombra al vendedor para no repetirlo.
- La ficha ofrece "Despacho courier · Starken · Chilexpress · 24-48h · desde $2.900". Shipit está apagado desde el 15-09 y el despacho coordinado parte en $5.490: **por verificar** si ese bloque quedó con el texto viejo.

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
