# Librerías de confianza + reseñas — diagnóstico, decisiones y prompts
**07-09-2026 · Continúa `claude/ESTADO_SHIPIT_FASE1_2026_09_07.md`, pendiente 1. Repo `~/dev/libros-libres`.**

---

## REGLA PARA CLAUDE CODE — leer antes de cualquier prompt

> No implementes nada hasta recibir "aprobado, implementa". Cada prompt parte con diagnóstico o diseño: muestra código existente, propón, espera. Si encuentras algo que contradice esta guía, dilo antes de seguir. No arregles nada fuera del alcance del prompt. Todo el copy en español de Chile (tú/usted, nunca voseo), sin emojis. No tocar checkout, MercadoPago, webhooks ni el worker de Shipit.

---

## 1. Qué hay hoy en producción (verificado 07-09)

| Superficie | Estado | Problema |
|---|---|---|
| Home, sección "Librerías de confianza" | Existe, 10 tiendas, tercera sección | Criterio de selección no refleja ventas: incluye tiendas con 1–7 libros y sin ventas; excluye a Libro de Ocasión, CIMLibros, Buhardilla y scarlett.santis (92% del volumen). Tarjeta = inicial + comuna + "N libros". Sin portadas, sin señal de confianza |
| `/vendedor/[slug]` | Cabecera: nombre, comuna, "miembro desde", "Pago seguro MercadoPago", N libros, precio promedio, géneros | Sin ventas entregadas, sin reseñas, sin courier/tiempo de despacho. Expone `mailto:` con el correo personal del vendedor. Meta description dice "coordinación por WhatsApp" |
| Reseñas | Flujo existe: "Lo recibí" → `delivered` → correo de reseña | No consta dónde se guardan ni si se muestran en alguna página |
| Dato base | Solo 13 de 211 sesiones a páginas de tienda vienen del home. Tienda → ficha 40%, tienda → checkout 4% | La sección del home no está cumpliendo su función de puerta de entrada |

Lectura: el activo (tiendas que convierten) existe; falta el puente (home) y la prueba (reseñas y ventas visibles).

---

## 2. Decisiones de Vero (bloquean el diseño)

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| C1 | Criterio de "confianza" | (a) manual, lista curada por Vero; (b) automático por datos; (c) automático + exclusión manual | **(c)**. Automático: MP conectado **y** al menos 1 venta pagada en plataforma con estado `delivered` en los últimos 90 días **y** ≥ 5 libros activos. Flag `users.featured_seller_blocked` para sacar a alguien a mano. Sin ventas entregadas no hay confianza que mostrar, por definición |
| C2 | Orden dentro de la sección | por ventas 90d / por reseñas / mixto | **Mixto**: score = ventas entregadas 90d × 3 + reseñas promedio × conteo reseñas + libros activos / 50. Simple, explicable, sesga a quien entrega |
| C3 | Tienda de Vero (`vero`) en la sección | incluir / excluir / incluir sin ser "tienda de la semana" | **Excluir**. Posicionamiento institucional: la plataforma no se autopromociona. Vero ya ocupa 10 de 21 slots destacados de libros |
| C4 | "Tienda de la semana" | manual (Vero elige, admin) / automática (mejor score 7d) | **Manual con fallback automático**: `featured_week_seller_id` + `featured_week_until` en una tabla de configuración; si está vacío o vencido, toma el mejor score. Rotación obligatoria: no repetir la misma tienda dos semanas seguidas. Libro de Ocasión (45% del catálogo) no puede ser la cara permanente |
| C5 | Reseñas: quién, qué, cuándo se muestran | solo comprador con orden `delivered`; 1–5 estrellas + texto ≤ 300; se publica de inmediato con ocultamiento posterior por Vero / moderación previa | **Comprador con `delivered`, publicación inmediata, ocultar a mano**. Promedio visible solo con ≥ 3 reseñas; bajo ese umbral se muestra "N ventas entregadas". Respuesta del vendedor: fase 2 |
| C6 | Correo del vendedor en la página de tienda | mantener / quitar | **Quitar**. Es un canal fuera de plataforma y un dato personal expuesto sin base. Queda "Mensaje" (mensajería interna) |

Vero completa la columna con su decisión antes del PROMPT 1. Si no responde, Claude Code asume la recomendación y lo anota en el diseño.

---

### Decisiones tomadas por Vero (07-09-2026)

Reemplazan la columna "Recomendación" donde difieren.

| # | Decisión de Vero |
|---|---|
| C1 | **Fallback, sin exigir `delivered` todavía**: MP conectado + al menos 1 venta **pagada** en los últimos 90 días + ≥ 5 libros activos. Da **8 tiendas** hoy. El copy de la tarjeta dice "N ventas por la plataforma", no "entregadas". Se migra a `delivered` cuando la fase 2 de Shipit puebla ese estado. Motivo: con `delivered` estricto hoy califica **una sola tienda** (lorena.cortes), porque casi nadie marca la entrega. |
| C2 | Score mixto, con `reviews_avg` **pesando 0** mientras la tabla esté vacía: `ventas_pagadas_90d * 3 + activos / 50`. |
| C3 | `vero` **excluida del criterio automático** de Librerías de confianza. |
| C4 | **"Tienda de la semana" = slot permanente de `vero`**, rotulado **"Selección de la casa · por Vero"**, con el nombre visible y sin camuflar. Las otras 7 tarjetas rotan por score. Libro de Ocasión nunca abre la fila ni se repite dos semanas seguidas. |
| C5 | Reseña del comprador con orden `delivered`, publicación inmediata, ocultamiento a mano. Promedio visible solo con ≥ 3 reseñas. |
| C6 | Quitar el `mailto:` de la página de tienda. |

**Reseñas: se extiende la tabla `reviews` existente**, no se crea otra. Conserva `listing_id` y `reviewer_id`; se le agregan `order_head_id`, `seller_id` (derivado del listing), `hidden_at` y `hidden_reason`. Esto corrige el PROMPT 2, que asumía una tabla nueva.

**Ruta real**: `/vendedor/[id]`, archivo `app/(main)/vendedor/[id]/page.tsx`. El parámetro se llama `id` y acepta username o UUID. Donde la guía dice `[slug]`, léase `[id]`.

### Las 8 tiendas que califican hoy con C1 (verificado 07-09-2026)

| Tienda | Comuna | Pagadas 90d | Activos | Score |
|---|---|---|---|---|
| Libro de Ocasión | Santiago | 6 | 1.713 | 52,26 |
| Scarlett Santis | La Florida | 2 | 141 | 8,82 |
| Libros De La Buhardilla | La Florida | 1 | 261 | 8,22 |
| Libros del Bardo | Melipeuco | 1 | 249 | 7,98 |
| CIMLibros | La Florida | 1 | 227 | 7,54 |
| Lorena Cortés | Concepción | 1 | 104 | 5,08 |
| Manuel | Lo Prado | 1 | 26 | 3,52 |
| Nicole Sepúlveda | Talca | 1 | 19 | 3,38 |

Ojo con el score: Libro de Ocasión saca 52 contra 8 del segundo, porque `activos / 50` con 1.713 libros domina todo. Con C4 no abre la fila igual, pero el orden interno queda decidido por tamaño de catálogo, no por ventas. Revisar en el diseño si `activos` entra con tope o con logaritmo.

### Correcciones de hecho a la sección 1

- La sección del home **sí** incluye hoy a CIMLibros y a Buhardilla (`users.featured = true`). Los excluidos son Libro de Ocasión, scarlett.santis y vero.
- Las reseñas **sí** tienen dónde guardarse y dónde mostrarse: la tabla `reviews` existe desde `20260407_reviews.sql` con RLS, y `app/(main)/vendedor/[id]/page.tsx` ya renderiza promedio, estrellas y lista (líneas 199-206 y 354). Están **vacías**, no ausentes: `reviews` y `book_reviews` tienen 0 filas.
- El criterio actual del home es `users.featured = true` con `.limit(10)` y **sin `ORDER BY`** (`app/(main)/page.tsx:338-371`), más un id fijo que ancla a Bárbara y un barajado aleatorio en cada carga (`components/home/FeaturedRow.tsx:24-29`). Hay 15 marcados para 10 cupos.
- No existe vista materializada ni tabla de agregados por vendedor. Lo único parecido es `site_stats` (`key` / `value bigint` / `updated_at`).

---

## 3. Prompts

### PROMPT 1 — diagnóstico (sin código)

```
Lee docs/prompts/librerias-confianza-resenas.md, sección "REGLA PARA
CLAUDE CODE". No implementes nada en este prompt.

CONTEXTO: la sección "Librerías de confianza" del home muestra tiendas
sin ventas y omite a las que venden. La página /vendedor/[slug] no
muestra ventas ni reseñas. Necesito saber qué existe antes de diseñar.

1. Sección del home: muéstrame el componente y la query que elige las
   10 tiendas. ¿Cuál es el criterio actual (fecha, aleatorio, flag)?
   Archivo y línea.
2. Reseñas: ¿existe tabla de reseñas? Muéstrame el esquema, RLS, cuántas
   filas hay en producción y desde qué página se crean. ¿Se renderizan
   en alguna parte? Si no, dímelo explícitamente.
3. Ventas por vendedor: escribe la query (solo SELECT, no la ejecutes
   contra producción sin decirme) que devuelva por seller_id: ventas
   pagadas, entregadas (delivered), últimas 90 días, libros activos,
   MP conectado, shipit_auto_enabled, promedio y conteo de reseñas.
   Muéstrame el resultado para los 20 primeros por ventas entregadas.
4. Página de tienda: muéstrame app/(main)/vendedor/[slug]/page.tsx.
   Confirma dónde sale el mailto: y de qué campo. Confirma el texto de
   la meta description ("coordinación por WhatsApp") y desde dónde se
   genera.
5. Ficha /libro/[vendedor]/[slug]: ¿qué muestra hoy del vendedor
   (nombre, comuna, avatar)? Archivo y componente.
6. Dime si hay una vista materializada o tabla de agregados por
   vendedor. Si no, propón `seller_stats` (vista o tabla refrescada
   por cron) con las columnas del punto 3.

Entrega hallazgos con evidencia de código y la tabla del punto 3.
Espera mi aprobación.
```

Criterio de aceptación: sabemos qué elige hoy las 10 tiendas, cuántas reseñas reales existen, y tenemos la tabla de 20 vendedores con ventas entregadas para validar C1 contra datos.

### PROMPT 2 — diseño (sin código)

```
Aprobado el diagnóstico. Diseña, no implementes.

DECISIONES: [pegar la tabla de la sección 2 con la columna de Vero].

1. Modelo:
   - `seller_stats` (vista o tabla): seller_id, delivered_90d,
     paid_total, active_listings, mp_connected, shipit_auto_enabled,
     reviews_count, reviews_avg, last_delivered_at, trust_score,
     is_trusted (boolean derivado de C1), updated_at.
   - `reviews` si no existe: id, order_head_id UNIQUE, seller_id,
     buyer_id, rating 1–5, body text ≤ 300, created_at, hidden_at,
     hidden_reason. RLS: insert solo el buyer de una orden delivered
     sin reseña previa; select público donde hidden_at IS NULL;
     update solo service_role.
   - `users.featured_seller_blocked boolean default false`.
   - Config "tienda de la semana": tabla `site_config` (key/value) o
     columnas en users; justifica.
2. Sección del home (reemplaza la actual):
   - Título "Librerías de confianza" + subtítulo con la regla en una
     línea: "Venden por la plataforma, despachan y sus compradores
     lo confirman".
   - Tarjeta: 3 portadas reales (los 3 libros activos más vistos del
     vendedor, fallback a más recientes), nombre, comuna, y UNA línea
     de prueba: "12 ventas entregadas · 4,8 (9 reseñas)" o "3 ventas
     entregadas" si reviews_count < 3. Sin "N libros" como dato
     principal. Link a /vendedor/[slug].
   - Primera tarjeta doble ancho: "Tienda de la semana", mismos datos
     + una frase de Vero (campo texto, ≤ 120 chars).
   - Máximo 8 tarjetas + "Ver todas las tiendas → /tiendas".
   - Mover la sección arriba de "Esta semana en el velador": la
     confianza precede a la curaduría. Justifica si discrepas.
3. Página de tienda:
   - Cabecera: agregar "N ventas entregadas", promedio de reseñas (si
     ≥ 3), courier con el que despacha (desde shipments) y comuna de
     origen. Quitar el mailto: (C6). Corregir meta description:
     "Compra libros de {nombre} en {comuna}. Pago protegido con
     MercadoPago y despacho a todo Chile."
   - Bloque "Reseñas de compradores" bajo la cabecera: lista con
     rating, texto, fecha, nombre de pila del comprador. Vacío → "Aún
     sin reseñas. Las primeras compras entregadas aparecerán aquí."
   - JSON-LD: agregar AggregateRating al Organization/Person existente
     SOLO cuando reviews_count ≥ 3. Confirma qué tipo usa hoy la página.
4. Ficha de libro: bajo el nombre del vendedor, la misma línea de
   prueba de la tarjeta. Es el punto de decisión de compra.
5. Flujo de reseña: revisa el correo que se envía en `delivered` y la
   página de destino. La reseña debe poder dejarse en ≤ 30 segundos
   desde el correo, con sesión iniciada, sin buscar la orden.
6. Cron: `seller_stats` se refresca cada hora (o al cambiar una orden
   a delivered). Dime cuál y por qué.

Entrega migración como texto, wireframe en texto de la tarjeta y de la
cabecera de tienda, y lista de archivos a tocar. Espera "aprobado,
implementa".
```

### PROMPT 3 — implementación (solo tras aprobación)

```
Aprobado el diseño. Implementa en este orden y detente después de cada
paso para revisión:

a) Migración: seller_stats, reviews (o ajustes), featured_seller_blocked,
   config de tienda de la semana. RLS.
b) Refresco de seller_stats + trust_score. Script scripts/seller-stats.mjs
   que imprima la tabla de is_trusted=true ordenada por score, para
   validar contra la tabla del PROMPT 1.
c) Componente TrustedStoreCard + sección del home. Solo is_trusted y
   no featured_seller_blocked, excluye seller 'vero'. Tienda de la
   semana con fallback.
d) Página de tienda: cabecera, bloque de reseñas, JSON-LD condicional,
   sin mailto:, meta description nueva.
e) Línea de prueba del vendedor en la ficha.
f) Página de dejar reseña desde el correo de delivered (ruta protegida,
   una reseña por orden, 1–5 + texto ≤ 300).
g) Admin mínimo: ocultar reseña (hidden_at + motivo) y fijar tienda de
   la semana con frase. Puede ser un script CLI si no hay panel admin.

Validación al cierre:
- `curl -s https://tuslibros.cl | grep -c 'ventas entregadas'` > 0
- /vendedor/nicole.sepulveda muestra "1 venta entregada" y no contiene
  "mailto:".
- Rich Results Test en una tienda con ≥ 3 reseñas (cuando exista).
- Sin voseo en ningún texto nuevo.
```

---

## 4. Riesgos y trade-offs

- **Sección vacía o corta al inicio.** Con el criterio C1 probablemente califican 4–6 tiendas hoy. Es correcto: seis tiendas con prueba valen más que diez sin ella. Si quedan menos de 4, el fallback es "MP conectado + ≥ 1 venta pagada" sin exigir `delivered`, anotado en la tarjeta como "vende por la plataforma".
- **Concentración visible.** Libro de Ocasión y CIMLibros van a dominar el score. Tope de 1 tarjeta por vendedor y rotación obligatoria de la tienda de la semana mitigan la lectura de "esto es una tienda con dos proveedores".
- **Reseñas negativas.** Con volumen bajo, una reseña de 2 estrellas pesa mucho. Umbral de 3 para mostrar promedio y ocultamiento con motivo (no borrado) mantienen credibilidad sin exponer a un vendedor por un incidente aislado. Nunca ocultar por "es negativa": solo por spam, datos personales o incumplimiento de términos.
- **Reseñas de Vero como vendedora.** Se muestran en su tienda pero su tienda no entra a la sección (C3). Consistente.
- **Correo del vendedor.** Quitarlo puede generar una consulta de algún vendedor. Respuesta: la mensajería interna es el canal; el correo expuesto viola la política de datos que ya se le exige al comprador.

## 5. Métrica de éxito (revisar 21-09)

- Sesiones home → tienda: de 13/211 (6%) a > 15% de las sesiones a tienda.
- Reseñas creadas / órdenes `delivered` en la semana: meta > 40%.
- Conversión tienda → checkout se mantiene ≥ 4% con más tráfico entrante (si cae, el tráfico nuevo es de peor intención y hay que revisar el orden de la sección).

## 6. Fuera de alcance (hilo aparte)

El home tiene 15 secciones antes del footer: Se busca, velador, librerías, tienda con categorías, recién subidos, ocho carruseles de colección, ediciones especiales, "para cuando sabes lo que buscas", manifiesto, actividad. Esa longitud diluye cualquier sección nueva. Después de medir el 21-09, corresponde una decisión de jerarquía del home (qué se queda arriba del pliegue y qué baja a `/colecciones`), no antes.

---

# DISEÑO (PROMPT 2) — 07-09-2026. No implementado.

## 0. Contradicciones con las decisiones, antes de diseñar

| # | Qué dice la decisión | Qué dice el código | Propuesta |
|---|---|---|---|
| X1 | `reviews.order_head_id UNIQUE`, "1 reseña por orden" | Un bundle tiene **una fila de `orders` por libro** (hay bundles de 3). `order_head_id` es, en `shipments`, la orden **cabeza** del bundle. Con `UNIQUE(order_head_id)` un comprador que lleva 3 libros del mismo vendedor puede dejar **una sola** reseña, y la tabla actual permite 3 (`UNIQUE(listing_id, reviewer_id)`) | Usar **`order_id UUID UNIQUE REFERENCES orders(id)`**: una reseña por línea de compra. Se conserva la intención ("una por orden") sin castigar al que compra varios |
| X2 | C5: reseña solo con orden `delivered` | `POST /api/reviews` acepta hoy `paid`, `shipped` y `delivered`. Y en producción **solo 3 órdenes en la historia llegaron a `delivered`** | Mantener `delivered` (es la señal honesta), pero asumir que el volumen de reseñas depende de que se use "Lo recibí". Es la misma trampa de C1: sin ese dato, el bloque nace vacío |
| X3 | C2: `score = paid_90d*3 + activos/50 + reviews_avg*reviews_count` | Con 1.713 activos, Libro de Ocasión saca **52,26** contra 8,82 del segundo. El orden lo decide el tamaño del catálogo, no la venta | Topar el término de catálogo: `least(activos, 250) / 50` (máximo 5 puntos). Con eso el orden pasa a mandarlo `paid_90d` |
| X4 | "3 libros activos más vistos" | `page_views.listing_id` existe, pero la tabla está **inflada por bots** (fueron el 64% del tráfico) y es la que costó IO esta semana | Calcular el top 3 **dentro del refresco de `seller_stats`**, filtrando `user_agent`, nunca por request |
| X5 | Config de destacados en `site_stats` | `site_stats` es `key text / value bigint / updated_at`. **No puede guardar un UUID ni una frase** | Tabla nueva `site_config` (`key text PK`, `value jsonb`, `updated_at`) |
| X6 | "Agrega AggregateRating al tipo existente" en la tienda | La página de tienda **no tiene ningún JSON-LD** (0 bloques `ld+json`) | Crear el bloque `Organization` desde cero y colgarle `aggregateRating` cuando `reviews_count >= 3` |

## 1. Modelo

### 1.1 `seller_stats`: tabla refrescada por cron, no vista materializada

Justificación: una vista materializada en Supabase se refresca con `REFRESH MATERIALIZED VIEW`, que **bloquea lecturas** salvo con `CONCURRENTLY` (que exige índice único y hace un seq scan completo). Además el top 3 de portadas necesita filtrar bots de `page_views`, que es la tabla grande. Una tabla común escrita por el cron permite refrescar por vendedor, dejar `updated_at` por fila y no tocar el resto si uno falla.

```sql
create table public.seller_stats (
  seller_id            uuid primary key references public.users(id) on delete cascade,
  paid_90d             int         not null default 0,
  delivered_90d        int         not null default 0,  -- calculada, NO filtra todavía (C1)
  paid_total           int         not null default 0,
  active_listings      int         not null default 0,
  mp_connected         boolean     not null default false,
  shipit_auto_enabled  boolean     not null default false,
  reviews_count        int         not null default 0,
  reviews_avg          numeric(3,2),
  last_sale_at         timestamptz,
  top_listing_ids      uuid[]      not null default '{}',  -- 3 portadas, ya resueltas
  trust_score          numeric(8,2) not null default 0,
  is_trusted           boolean     not null default false,
  updated_at           timestamptz not null default now()
);

create index seller_stats_trusted_idx
  on public.seller_stats (is_trusted, trust_score desc) where is_trusted;

alter table public.seller_stats enable row level security;
create policy "seller_stats visible para todos"
  on public.seller_stats for select using (true);
-- Sin policy de escritura: solo service_role.
```

`is_trusted` y `trust_score` se calculan en el refresco, no como columnas generadas, porque dependen de `users.featured_seller_blocked` y del umbral de C1, que van a cambiar cuando se migre a `delivered`.

- `is_trusted` = `mp_connected AND paid_90d >= 1 AND active_listings >= 5 AND NOT featured_seller_blocked AND username <> 'vero'`
- `trust_score` = `paid_90d * 3 + least(active_listings, 250) / 50.0 + coalesce(reviews_avg, 0) * reviews_count`

### 1.2 `reviews`: ALTER, no CREATE

```sql
alter table public.reviews
  add column if not exists order_id      uuid references public.orders(id) on delete set null,
  add column if not exists seller_id     uuid references public.users(id) on delete cascade,
  add column if not exists hidden_at     timestamptz,
  add column if not exists hidden_reason text;

-- Una reseña por línea de compra (X1). Parcial: las filas viejas sin order_id no chocan.
create unique index if not exists reviews_order_id_key
  on public.reviews (order_id) where order_id is not null;

create index if not exists reviews_seller_idx
  on public.reviews (seller_id) where hidden_at is null;

-- RLS nueva. Se reemplazan las dos policies de 20260407_reviews.sql.
drop policy if exists "Reviews visibles para todos" on public.reviews;
drop policy if exists "Usuario crea review"        on public.reviews;

create policy "Reseñas visibles si no están ocultas"
  on public.reviews for select
  using (hidden_at is null);

create policy "Comprador reseña su orden entregada"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.orders o
      where o.id = reviews.order_id
        and o.buyer_id = auth.uid()
        and o.listing_id = reviews.listing_id
        and o.seller_id  = reviews.seller_id
        and o.status = 'delivered'
    )
  );
-- Sin policy de UPDATE ni DELETE: solo service_role oculta (hidden_at + motivo).
```

`seller_id` se llena en el INSERT desde el endpoint (derivado del listing) y la policy lo verifica contra la orden, así que no puede falsearse.

### 1.3 Columna de bloqueo y config

```sql
alter table public.users
  add column if not exists featured_seller_blocked boolean not null default false;

create table public.site_config (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);
alter table public.site_config enable row level security;
create policy "site_config visible para todos"
  on public.site_config for select using (true);
```

Claves previstas, que cubren los dos slots de C4:

- `casa_slot` → `{"seller_id": "2201d163-…", "frase": "…", "activo": true}` (C4.1, Vero)
- `tienda_semana` → `{"seller_id": "…", "until": "2026-09-14", "frase": "…", "anterior": "…"}` (C4.2)

`anterior` es lo que permite cumplir "no repetir dos semanas seguidas" sin tabla de historial.

## 2. Sección del home

### Wireframe — tarjeta estándar

```
┌──────────────────────────────┐
│ ┌────┐┌────┐┌────┐           │  3 portadas reales, 48×72,
│ │ 📕 ││ 📗 ││ 📘 │           │  superpuestas -8px
│ └────┘└────┘└────┘           │
│                              │
│ Libros De La Buhardilla      │  nombre, 15px semibold
│ La Florida                   │  comuna, 11px muted
│                              │
│ 3 ventas por la plataforma   │  línea de prueba, 12px
│ · 4,8 (9 reseñas)            │  el tramo de rating SOLO si >= 3
└──────────────────────────────┘
   toda la tarjeta enlaza a /vendedor/[username]
```

Si `reviews_count < 3`, la línea es solo `3 ventas por la plataforma`. Nunca "N libros" como dato principal.

### Wireframe — slot de la casa (C4.1)

```
┌────────────────────────────────────────┐
│ SELECCIÓN DE LA CASA · POR VERO        │  etiqueta, 10px, mayúsculas,
│                                        │  fondo distinto (crema oscuro)
│ ┌────┐┌────┐┌────┐                     │
│ │ 📕 ││ 📗 ││ 📘 │  Verónica Velásquez │
│ └────┘└────┘└────┘  Providencia        │
│                                        │
│ "…frase editable, hasta 120 chars…"    │  cursiva
└────────────────────────────────────────┘
```

Fijo, no rota, no cuenta como una de las 8. La etiqueta va **arriba y en alto contraste**: es curaduría de la fundadora, no un resultado del ranking.

### Wireframe — tienda de la semana (C4.2)

```
┌──────────────────────────────────────────────────────────┐
│ TIENDA DE LA SEMANA                                      │
│ ┌────┐┌────┐┌────┐   CIMLibros · La Florida              │
│ │ 📕 ││ 📗 ││ 📘 │   1 venta por la plataforma           │
│ └────┘└────┘└────┘   "…frase, hasta 120 chars…"          │
└──────────────────────────────────────────────────────────┘
```

Doble ancho. Sale de la rotación de las 8. Fallback si `until` venció o está vacío: mejor `trust_score` que no sea `anterior` y que no sea `libro.de.ocasion`.

### Layout y orden

```
Librerías de confianza
Venden por la plataforma, despachan y cobran con pago protegido.

[ TIENDA DE LA SEMANA — doble ancho ]  [ SELECCIÓN DE LA CASA ]
[ tarjeta ][ tarjeta ][ tarjeta ][ tarjeta ]
[ tarjeta ][ tarjeta ][ tarjeta ][ tarjeta ]
                                  Ver todas las tiendas →
```

**Recomendación de orden: dejarla donde está, no subirla sobre "Esta semana en el velador".** El argumento de "la confianza precede a la curaduría" es correcto en abstracto, pero el dato lo contradice: el velador es producto y el usuario que llega al home viene a buscar un libro, no un vendedor. Subir la sección compite con la única sección que hoy convierte a ficha. Además, con 15 secciones antes del footer, mover una de lugar no mueve la aguja: eso se decide con la jerarquía completa el 21-09, como dice la sección 6. Lo que sí cambia el resultado es que la sección **tenga prueba**, no que esté 300px más arriba.

## 3. Página de tienda (`app/(main)/vendedor/[id]/page.tsx`)

### Wireframe de cabecera

```
┌───────────────────────────────────────────────┐
│ ( avatar )  CIMLibros                         │
│             La Florida · miembro desde 2026   │
│                                               │
│             1 venta por la plataforma         │  ← nuevo
│             ★★★★★ 4,8 (9 reseñas)             │  ← solo si >= 3
│             Despacha con Starken              │  ← solo si hay shipments
│                                               │
│             227 libros · promedio $12.400     │
│             [ Mensaje ]  [ Instagram ]        │  ← sin "Email" (C6)
└───────────────────────────────────────────────┘
```

- Meta description nueva: `Compra libros de {nombre} en {comuna}. Pago protegido con MercadoPago y despacho a todo Chile.`
- Se elimina el bloque del `mailto:` (líneas ~293-302). El campo `public_email` se conserva en la base, solo deja de exponerse.
- Courier: `select courier from shipments where seller_id = ? and courier is not null order by created_at desc limit 1`. Si no hay, se omite la línea entera.
- Bloque de reseñas: el render ya existe (líneas ~199-208 y ~354). Solo se le aplica el umbral de C5 y el texto vacío: "Aún sin reseñas. Las primeras compras entregadas aparecerán aquí."

### JSON-LD

Hoy la página no tiene ninguno (X6). Se agrega:

```jsonc
{ "@context": "https://schema.org", "@type": "Organization",
  "name": "…", "url": "https://tuslibros.cl/vendedor/…",
  "address": { "@type": "PostalAddress", "addressLocality": "…", "addressCountry": "CL" },
  // solo si reviews_count >= 3:
  "aggregateRating": { "@type": "AggregateRating",
    "ratingValue": "4.8", "reviewCount": 9, "bestRating": 5, "worstRating": 1 }
}
```

## 4. Ficha de libro

Bajo el nombre del vendedor en `components/listings/ListingDetail.tsx` (bloque de las líneas 478-503), la misma línea de prueba de la tarjeta, en 11px muted, al lado de "Pago seguro":

```
Libro de Ocasión
Santiago · Pago seguro · 6 ventas por la plataforma
```

El dato sale de `seller_stats`, que la ficha ya puede leer en el mismo select del listing.

## 5. Flujo de reseña

Hoy: el correo (`lib/resena-email.ts:36`) lleva a `{ficha}#resena-vendedor`, donde está montado `ReviewSection`. Ese componente hace tres viajes (auth, GET de reseñas, chequeo de compra) y si no hay sesión no ofrece nada útil.

Propuesta: ruta dedicada **`/resena/[orderId]`**. El correo enlaza ahí. La página resuelve la orden en el servidor, muestra portada y título, y pinta las estrellas y el textarea sin más consultas. Si no hay sesión, redirige a login con `?next=/resena/[orderId]`. Una reseña por orden (`reviews.order_id` UNIQUE). `ReviewSection` en la ficha se mantiene para quien llega por su cuenta.

Eso deja la reseña en dos clics desde el correo: abrir y puntuar.

## 6. Refresco de `seller_stats`

**Cron cada hora**, no en el cambio de estado de la orden. Razones: el trigger por orden solo actualizaría al vendedor de esa orden y dejaría `active_listings` y el top 3 de portadas desactualizados cuando alguien publica o pausa libros, que es lo que más se mueve; y el `top_listing_ids` necesita agregar `page_views`, que es caro y no tiene por qué correr dentro del webhook de pago. Costo: son ~120 vendedores, una query agregada y una de `page_views` filtrada por bots; del orden de 2 segundos por corrida. Se agrega a `vercel.json` como `/api/cron/seller-stats`, `0 * * * *`.

Excepción razonable: llamar al refresco de **un** vendedor cuando una orden pasa a `paid` o `delivered`, para que la línea de prueba no muestre un número viejo justo después de una venta. Es una función `refresh_seller_stats(seller_id uuid)` que el cron llama en bucle y el webhook llama para uno solo.

## 7. Archivos a tocar

**Nuevos**
- `supabase/migrations/20260908_seller_stats_y_resenas.sql`
- `app/api/cron/seller-stats/route.ts`
- `components/home/TrustedStoresSection.tsx` (sección completa)
- `components/home/TrustedStoreCard.tsx` (tarjeta estándar, slot casa y slot semana como variantes)
- `app/(main)/resena/[orderId]/page.tsx`
- `scripts/seller-stats.mjs` (validación: imprime `is_trusted` ordenado por score)

**Modificados**
- `app/(main)/page.tsx` — sacar `getFeaturedSellers` (líneas 338-371), leer `seller_stats`
- `components/home/FeaturedRow.tsx` — quitar el bloque de vendedores y el barajado (líneas 24-29, 93-140); queda solo con libros destacados
- `app/(main)/vendedor/[id]/page.tsx` — cabecera, umbral de reseñas, JSON-LD, sin `mailto:`, meta description
- `components/listings/ListingDetail.tsx` — línea de prueba bajo el vendedor
- `app/api/reviews/route.ts` — exigir `delivered`, guardar `order_id` y `seller_id`
- `lib/resena-email.ts` — enlazar a `/resena/[orderId]`
- `vercel.json` — cron nuevo

**No se tocan**: checkout, MercadoPago, webhooks de pago y el worker de Shipit, salvo la línea del webhook que refresca un vendedor tras una venta, que se deja para el final y se puede omitir.
