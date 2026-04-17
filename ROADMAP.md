# tuslibros.cl — Master Plan

Última actualización: 16 abril 2026 (noche)

---

## Sesión 16 abril 2026 — tarde/noche

**Hitos grandes del día:**
- [x] **Zdravko respondió al testimonio** — autorizado para publicar como "Z." Cita completa en `memory/project_primer_comprador.md`. Ya vive en el home como `TestimonialBanner`.
- [x] **Primer nuevo vendedor tras el lanzamiento beta: Nicolás Eltit** (`nicoeltit@gmail.com`, Las Condes) — registro OK, MP conectado. Único listing: Mein Kampf a $35.000. Marcado como `deprioritized` por tono.
- [x] **Catálogo curado**: top 10 destacados con orden controlado (`featured_rank`) + fila nueva de coleccionables + 4 libros marcados como colección (Parra Nascimento 1972 + Emar "Un Año" + Emar "Ayer" + De Rokha Habana 1991).

**Cambios de código y BD:**
- [x] Columna `listings.deprioritized` (boolean) — baja en el orden sin esconder. Aplicada al sort de home, mapa, API `/api/listings`, y búsqueda.
- [x] Columna `listings.featured_rank` (int) — orden controlado manualmente para los destacados. `getFeaturedListings` ahora ordena por rank.
- [x] Columna `listings.is_collectible` (boolean) — para objetos de colección (propiedad del ejemplar, no del libro en abstracto). Nuevo componente `CollectibleRow` en home + badge "Colección" en `ListingCard`.
- [x] **Top 10 destacados con orden fijo**: 1. Parra (Nascimento 1972, colección) 2. Donoso 3. Borges (El Aleph) 4. García Márquez (General en su laberinto) 5. Vargas Llosa (Conversación I) 6. Fuentes (La Región Más Transparente) 7. Wilde (Canterville) 8. Kundera 9. Monterroso (La Letra E) 10. Franzen (Libertad).
- [x] **Mapa "con más alma"**: markers diferenciados por tier (coleccionable ink+borde dorado, featured ámbar, regular dorado), thumbnails de portada en sidebar, copy cálido "Libros a la vuelta de la esquina", leyenda visual.
- [x] **3 coleccionables publicados bajo seller vero**: Juan Emar "Un Año" ($12k, slug `un-ano`), Emar "Ayer" ($14k, slug `ayer`), Pablo de Rokha "Lo humano en la poesía" ($14k, slug `lo-humano-en-la-poesia`, edición cubana 1991 con 4 fotos). Script reutilizable: `scripts/publish_collectibles.mjs`.
- [x] **Email testimonio Zdravko enviado** via Resend (ID `b1bf8684-cb8f-4a8c-8c6d-fab435dcbb51`, desde `noreply@tuslibros.cl` reply-to `vero@economics.cl`) y **respondido** esa misma madrugada.
- [x] **SEO overhaul** (post auditoría):
  - Hero del home reescrito: titular claro "Libros usados en Chile, con envío o retiro en mano" + precio desde + dos CTA (Explorar / Publicar). Reemplaza el hero poético.
  - Metadata global con keywords de intención ("libros usados santiago/chile").
  - Fichas de libro: title con precio `(Título — Autor — $PRECIO, usado)` para mejor CTR en SERPs.
  - Schema.org Product con `itemCondition: UsedCondition` y `brand`.
  - **Sitemap crítico**: ahora usa `/libro/username/slug` en vez de `/listings/UUID`. Antes Google indexaba URLs feas.
- [x] Novedades actualizada con todas las entradas del día.

**Scripts nuevos (reutilizables):**
- `scripts/check_nicolas.mjs` — diagnóstico vendedor
- `scripts/rank_featured_candidates.mjs` — ranquea catálogo por heurística autor/portada/precio/idioma/MP
- `scripts/build_featured_sql.mjs` — genera SQL para top 10
- `scripts/verify_featured.mjs` — verifica featured y coleccionables aplicados
- `scripts/publish_collectibles.mjs` — publica libros con múltiples fotos + is_collectible
- `scripts/audit_entry_exit.mjs` — entry/exit pages, bounce, referrers, catálogo invisible, embudo

**Auditoría 30d al cierre del día:**
- 339 sessions / 1000 pageviews / 2.95 views/sesión
- **Bounce rate 72.6%** — 246 sessions de 1 sola página
- 97% entra por `/` home (329/339)
- 72.9% del catálogo invisible — 137 de 188 listings sin una sola visita en 30d
- Embudo compra: 0 carritos, 0 checkouts, 2 logins, 0 registros, 0 órdenes
- Google trajo solo 46 visitas en 30d. IG+FB+LinkedIn: 4 visitas combinadas.
- **Top visitados son paradójicos**: Kokoschka (24), Máximas y Aforismos (7), Lecciones Ciencias Ocultas (6) — NO los autores comerciales → quien llega son buscadores de rarezas, no lectores generales.

**Acciones autónomas ejecutadas (deploy en prod):**
- Commits: `2d6807e` (deprioritized), `5bf0687` (top10 + coleccionables + mapa), `b38c126` (3 coleccionables nuevos), `18341da` (testimonio), `09a7d33` (SEO + hero).
- Dos SQL pegados por Vero en Supabase Editor: (1) `deprioritized` column + marcar Nicolás, (2) `featured_rank` + `is_collectible` + top 10 + marcar Parra coleccionable.

**Fixes finales (internos, no van a /novedades):**
- [x] Portadas de los Emar habían quedado acostadas por EXIF Orientation=6 ignorado al cortar con magick. Fix: `-auto-orient -strip` antes del crop, luego rotar 90° CCW porque los libros estaban apilados arriba-abajo en la foto horizontal original. Script `scripts/_fix_emar_covers.mjs` regenera y re-sube las dos portadas actualizando `cover_image_url`. Patrón reutilizable para futuras fotos de iPhone.

**Pendientes post-sesión:**
- [ ] **Hobsbawm "Un tiempo de rupturas"** quedó con `featured=true` sin `featured_rank` (huérfano). No aparece en el top 10 por el `limit(10)` pero técnicamente está marcado. Limpiar: `update listings set featured=false where featured_rank is null and featured=true;`
- [ ] **Google Search Console**: re-submit del sitemap cambiado (URLs `/libro/…` nuevas). Vero debe hacerlo desde su GSC.
- [ ] **PostHog + Sentry** — instrumentación de eventos (clicks, scroll, abandono, errores). Requiere cuentas de Vero para DSN/project key.
- [ ] **Componente testimonios escalable** — hoy TestimonialBanner está hardcodeado. Cuando haya ≥3, migrar a tabla `testimonials` + widget.
- [ ] **Campañas con deep link** a libros específicos (no al home) en IG/WhatsApp — las redes traen casi cero tráfico hoy.
- [ ] **Post LinkedIn para `/vender`** — Vero quiere distribuir la landing de captación. Draft listo, tono confesional, CTA a https://tuslibros.cl/vender. Texto consensuado en la sesión (ver chat). Acompañar con 3 imágenes 1080×1080 (mismo estilo que `whatsapp_universitarios_*.png`, pasos "Escanea / Precio / Listo") — no se renderizaron en esta sesión, reusar Playwright + HTML como en `scripts/render_whatsapp_images.mjs`. Horario óptimo: martes–jueves 9–11 AM.
- [ ] **Distribución multi-canal de `/vender`**: WhatsApp Status + cadenas, IG feed + Stories, Reddit r/chile (draft en `docs/reddit_r_chile_post.md`), email a los 150+ vendedores históricos, grupos FB "Libros Chile", Goodreads.
- [ ] **SEO de `/vender`** — hoy title/description existen pero podrían apuntar más a la intención de búsqueda ("vender libros usados Chile", "cómo vender mis libros online"). Rápido.

---

## Sesión 16 abril 2026 — mañana

- [x] **Auditoría tracción** — 3 días secos de registros (último: Zdravko + Belen el 13 abril). 20 libros publicados en 3 días pero concentrados en @fabian. Tráfico cayendo: 178 → 141 → 75 → 50. Script reutilizable: `scripts/check_recent_activity.mjs`.
- [x] **Imágenes WhatsApp universitarios** (1080×1080) — dos ángulos: A arriendo (cream), B venta + arriendo (navy). Para que cliente con hija en U forwardee. Archivos: `docs/whatsapp_universitarios_{a,b}.png`. HTML fuente: `docs/whatsapp_universitarios.html`. Render via Playwright: `scripts/render_whatsapp_images.mjs`.

---

## Sesión 15 abril 2026

- [x] Sort de home por idioma: featured pagos → con portada → en español → resto. Libros alemanes al final.
- [x] Columna `books.language` (default `es`) + migración `20260415_add_book_language.sql` aplicada.
- [x] Backfill language: 26 libros alemanes detectados via Open Library + heurística, aplicados. 6 adicionales marcados manual.
- [x] Badge visible de idioma en `ListingCard` cuando `language !== 'es'`.
- [x] Fix bug publish form: al tocar campo ISBN después de abrir modo manual, se borraba el formulario — afectaba libros antiguos sin ISBN. Corregido en `components/books/ISBNSearch.tsx`.
- [x] Merge vs overwrite en ISBNSearch cuando la API devuelve libro sin título.
- [x] Badge "Pago seguro MercadoPago" en perfil vendedor (`/vendedor/[id]`) y ficha del libro (`ListingDetail`) cuando el vendedor tiene MP conectado.
- [x] Libros De La Buhardilla marcado como vendedor destacado (featured=true).
- [x] Memoria consolidada de 40 archivos → 3 (`MEMORY.md`, `user_veronica.md`, `context.md`).
- [x] Limpieza BD: borradas 4 orders de prueba + 3 carritos de prueba + 39 page_views de cuenta Alicuota + el usuario completo. Métricas ahora reflejan tráfico real.

## Infraestructura de medición (ya operativa — confirmado 15 abril)

- [x] Google Analytics GA4 activo (ID `G-N243GH70EQ`)
- [x] Google Search Console verificado (archivo `public/google265a60d87748f586.html`)
- [x] Vercel Analytics activo
- [x] PageTracker propio en `page_views` (tabla Supabase) — listings vistos, fuente de tráfico, usuario

## Acciones de Vero — estado 15 abril tarde

- [ ] **Post LinkedIn** — movido al **próximo martes 21 abril**. Tracción previa bajísima, decisión de Vero de posponer una semana con mejor preparación (anécdotas de visitas a librerías).
- [ ] **🔴 PENDIENTE URGENTE — Visitas a librerías físicas de Santiago**. Pospuesto desde el 11 abril, sigue sin ejecutar. Alta prioridad declarada por Vero el 15 abril.
- [ ] **Post narrativo en r/chile** — Vero pidió ayuda **esta noche (15 abril)**. Necesita draft con tono confesional + call honesta de feedback, sin disfraz de marketing.
- [ ] **Decisión Meta (Instagram / Facebook)** — Vero reconoce que "que siga pendiente es terrible decisión". Pendiente crear cuentas nuevas con `admin@tuslibros.cl` + 2FA.
- [x] **Responder a Felipe (Libros De La Buhardilla)** — email enviado 15 abril con fix + oferta de ayuda + destacado.

## Testimonio Zdravko

- [x] **Email enviado 16 abril** via Resend a `zdravko.miroslav@gmail.com` (ID `83c40ecf-3734-45a9-a84a-2effe6c0fc7b`). From `noreply@tuslibros.cl`, reply-to `vero@economics.cl`. HTML con botón CTA "Escribir mi testimonio" (mailto pre-llenado). Script reutilizable: `scripts/send_zdravko_email.mjs`.
- [ ] **Si responde** → publicar en home sección "Compraron y cuentan" + reutilizar en Reddit/LinkedIn.
- [ ] **Si no responde al 21 abril** (5 días) → seguimiento corto de 2 líneas o dejarlo ir.

## Feature pendiente — sistema de testimonios post-compra automático

- [ ] Cron que detecta orders con `status = completed` o `shipping_status = delivered` hace >3 días y envía email solicitando testimonio al comprador
- [ ] Template Resend con link/form para responder rápido
- [ ] Tabla `testimonials` (order_id, user_id, text, rating, published boolean, admin_approved)
- [ ] Widget "Compraron y cuentan" en home + perfil vendedor
- [ ] Prioridad alta — convierte mejor que cualquier copy propio

## Acciones autónomas (mi lado) — ejecutadas 15 abril noche

- [x] **Incidente home 500 → resuelto.** El cache de home del commit `5e8a415` envolvía `createClient()` SSR (con `cookies()`) dentro de `unstable_cache` → Next.js crasheaba el path sin filtros. Dos commits: (1) revert rápido `3d0c513` para levantar prod, (2) fix correcto `9b1179b` con `lib/supabase/public.ts` (cliente anon sin cookies) que recupera el ahorro de CPU. Verificado 5/5 tests QA contra prod.
- [x] **Auditoría full** — crawl 60 páginas sin 404s, integridad BD OK, funnel 30d: 508 sessions → 1 compra (Zdravko / La Marina / $5.000 paid). Scripts reutilizables en `scripts/audit-*.mjs`.
- [x] **Fix SEO: listings eliminados ahora redirigen con 308 al home** en vez de 404. Antes: 12 visitas/30d caían en páginas de error por IDs obsoletos indexados en Google. Archivos: `app/(main)/listings/[id]/page.tsx` + `app/(main)/libro/[username]/[slug]/page.tsx`. También borré los 12 page_views contaminando métricas.
- [x] **Agente QA con Playwright** — setup completo. `playwright.config.ts` + `tests/e2e/golden-paths.spec.ts` con 5 flujos (home, search, ficha, publish requiere login, footer). Comandos: `npm run qa` (local), `npm run qa:prod` (contra tuslibros.cl), `npm run qa:ui` (modo interactivo). Retry 1 + screenshots + video en fallos.

## Acciones autónomas (mi lado) — ejecutadas 15 abril tarde

- [x] **Tab "Negocio" en `/admin`** — embudo de conversión (visitas → registro → orden → pago), revenue confirmado, carritos abandonados con tiempo, órdenes pendientes de pago, top vendedores. Endpoint nuevo: `/api/admin/business-metrics`. Te permite ver todo esto sin pedirme queries.
- [x] **Fix OG images**: el share en WhatsApp/redes ahora usa la foto del vendedor (`cover_image_url`) primero, después Open Library. Aplicado en `/libro/[username]/[slug]` y `/listings/[id]`. Los 2 PATHS estaban con el mismo gap.
- [x] **Borrador post Reddit r/chile** en `docs/reddit_r_chile_post.md` — dos opciones de tono (confesional corta + pregunta directa), notas tácticas, métricas a monitorear antes/después.

## Acciones autónomas pendientes (no bloqueantes, las hago cuando vuelvas)

- [ ] Email de carrito abandonado automático (cron + Resend + template). NO se construyó hoy porque post-limpieza solo queda el carrito de Fabian ya vendido por WhatsApp — la automatización no tendría efecto inmediato. Volver cuando haya carritos nuevos que justifiquen la infra.
- [ ] Páginas SEO de colecciones (`/coleccion/maigret`, `/coleccion/biblioteca-de-babel`). NO se construyó hoy porque requiere contenido editorial que merece decisión tuya de tono.

- [ ] Detector preciso de francés e inglés (franc-min u otra lib). La heurística actual tiene muchos falsos positivos con títulos en español que comparten palabras (la, le, de, of, in). Esto NO se hizo hoy porque requiere instalar una dependencia nueva (`franc-min`) y evaluarla contra el catálogo — lo dejo solo en caso de que molesten los 7 libros que quedaron marcados como `fr` erróneamente; si no se notan, no vale el tiempo.

---

## Completado

### Infraestructura
- [x] Next.js 14 + Supabase + Vercel
- [x] Dominio tuslibros.cl (NIC Chile → Vercel nameservers)
- [x] Banner beta
- [x] Webhook MercadoPago + clave secreta
- [x] Resend SMTP + API (noreply@tuslibros.cl)
- [x] Confirmación email
- [x] Google OAuth ✅ funcionando
- [x] LinkedIn OAuth ✅ funcionando
- [x] Sitemap + robots.txt + SEO redirects (WordPress legacy → Next.js + /libro/:slug)
- [x] Compresión imágenes
- [x] PWA instalable (manifest + iconos + service worker offline)
- [x] Env vars producción actualizadas
- [x] RESEND_API_KEY configurada en Vercel ✅
- [x] Primera venta real completada (6 abril 2026) — split payment funciona ✅
- [x] Correo @tuslibros.cl (ImprovMX catch-all)
- [x] Google Merchant Center operativo (18 clicks últimos 28 días)
- [x] Google Business Profile (4.3 estrellas, 4 opiniones)
- [x] Stitch MCP configurado para diseño visual con IA

### UI/UX — Estilo Martfury
- [x] Paleta cream unificada todas las páginas
- [x] Navbar sticky + fix dropdowns (Mi cuenta, Ayuda)
- [x] Categorías agrupadas (6 grupos) + mobile drawer + colapsables
- [x] Autocompletado + filtro autor
- [x] Paginación numérica
- [x] Ficha libro: tabs Descripción / Preguntas / Reseñas (integrados)
- [x] Libros relacionados + breadcrumbs
- [x] Quickview modal + vista lista
- [x] Vistos recientemente
- [x] Login split + OAuth social
- [x] Registro País/Región/Comuna
- [x] Bio vendedor + placeholder cards
- [x] OG image + planes + contacto WhatsApp
- [x] Precios con descuento (tachado + badge)
- [x] ListingCard: badges, hover, avatar vendedor, placeholder blur
- [x] Footer, HeroBar, Back to top, Sidebar sticky
- [x] Terminología unificada: "Arriendo" en toda la app
- [x] Filtro modalidad: "Arriendo" muestra loan + both
- [x] Portada generada con título+autor cuando no hay imagen
- [x] Etiquetas género clickeables en perfil vendedor
- [x] Botón Instagram en ShareButtons
- [x] Galería imágenes con ancho fijo (fix colapso w-full → w-[280px])

### Marketplace
- [x] Split Payment producción ✅ verificado con venta real
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%)
- [x] Checkout 3 formas entrega (courier "próximamente")
- [x] WhatsApp como alternativa sin MP (gratis, sin comisión)
- [x] Arriendos completos con flujo devolución
- [x] Dashboard ventas + carrito persistente
- [x] Galería imágenes (publicación + post + edición)
- [x] Reviews/valoraciones + estrellas en cards
- [x] Marcar como vendido + badge "Vendido" visible en catálogo
- [x] Libros destacados por plan (badge "Destacado", prioridad en grilla)
- [x] Filtro "Cerca de mí" (geolocalización navegador + haversine)
- [x] Sistema de recomendaciones (por género/autor, con cache)
- [x] Preguntas públicas al vendedor (estilo MercadoLibre + emails)
- [x] Importador masivo CSV desde la web
- [x] Botones compartir en redes (WhatsApp, Facebook, Instagram, X, copiar link)
- [x] Botón Editar en ficha propia (va directo al libro con ?edit=ID)
- [x] Fotos adicionales al editar libro (ImageUploadMultiple en EditForm)
- [x] Primera foto extra se asigna como portada si no hay cover
- [x] CoverUpload mobile: galería + cámara (sin capture forzado) + eliminar portada
- [x] Bundle checkout — compra múltiple en un solo pago por vendedor
- [x] Badge del carrito reactivo en header
- [x] Vista vendedor: carritos con mis libros (rescate de ventas)
- [x] Perfil progresivo — datos justos cuando se necesitan

### Página vendedor
- [x] Perfil: avatar, nombre, ciudad, bio, miembro desde, stats
- [x] Canales contacto: WhatsApp, Instagram, Email
- [x] Sorting: Recientes, Precio ↑↓, Título, Autor

### SEO & Performance
- [x] Metadata dinámica en listing detail + search + vendedor
- [x] JSON-LD schemas (Product, BreadcrumbList, Organization)
- [x] Lazy load mapbox en formularios de publicación
- [x] next/image en todos los componentes + alt descriptivos + aria-labels
- [x] h1 en home, ISR en listing detail, Suspense skeletons
- [x] Vercel Analytics + placeholder blur + cache API recommendations
- [x] Scanner ISBN: timeout 3s Google Books → fallback rápido Open Library
- [x] Meta descriptions truncan en palabra completa (no cortan a la mitad)
- [x] Libros vendidos siguen indexados con schema SoldOut
- [x] Structured data shipping + return policy (Google Search Console)

### Emails (10+ transaccionales)
- [x] Confirmación registro
- [x] Bienvenida newsletter + nuevo usuario
- [x] Notificaciones admin (nuevo usuario, contacto)
- [x] Confirmación compra/arriendo → comprador
- [x] Notificación venta/arriendo → vendedor
- [x] Cambios estado arriendo
- [x] Preguntas → vendedor / respondidas → comprador
- [x] Newsletter sender (admin panel + template)

### Admin
- [x] Panel con stats, delete individual/masivo, filtros por status
- [x] Tab Newsletter con preview y botón enviar
- [x] Tab Analytics: visitas/día, navegadores, OS, dispositivos, páginas top
- [x] Tab Herramientas: botones para portadas, auditoría, sinopsis, metadata + accesos rápidos a todas las funcionalidades
- [x] Tab Categorías: mantenedor CRUD con árbol visual, agregar/editar/reordenar/eliminar
- [x] API /api/admin/enrich-metadata (ejecuta enriquecimiento desde panel)
- [x] PageTracker invisible (registra cada visita en Supabase)
- [x] Selector de vendedor en herramientas (filtrar operaciones por vendedor)
- [x] Toggle featured (estrella) por publicación
- [x] Escudo dorado solo en libros destacados (no en todos con MP)

### Datos y calidad
- [x] 500+ libros publicados (incluyendo 33 Maigret colección Luis de Caralt)
- [x] 92 libros enriquecidos con metadata via Google Books + Open Library
- [x] Portadas validadas con auditoría automática + fallback UI
- [x] 13 sinopsis spam/inglés eliminadas + filtro: solo acepta sinopsis en español
- [x] Validación título/autor obligatorios al publicar
- [x] Detección imágenes placeholder en cards (onLoad size check)
- [x] Categorización automática al publicar (genreNormalizer + tagSuggester)
- [x] 5 categorías principales, 32+ subcategorías, tags controlados

### Contenido y marketing
- [x] Voz personal en todo el sitio (confesional, 1ª persona, español chileno)
- [x] Video marketing v5 (56s, narrado por Vero, guion validado)
- [x] Kit Metralleta v2 confesional (6 mensajes listos) — `docs/kit_metralleta_confesional.html`
- [x] Newsletter 14 abril listo — `docs/newsletter_14abril2026.html`
- [x] Textos para directorios/Reddit/LinkedIn — `docs/listados_directorios.html`
- [x] Landing /vender (conversión vendedores)
- [x] Banners promocionales en /search y /novedades (PromoBanner component)
- [x] Badge 'Nuevo' dinámico en novedades (3 días)
- [x] Landing alianzas institucionales
- [x] Sistema de referidos con código personal
- [x] Página novedades (changelog público)
- [x] Gong Telegram al publicar libro

---

## En progreso

### Shipit courier
- [x] Integración completa funcionando en producción
- [x] Cotización en tiempo real, etiquetas, tracking
- [ ] Esperando confirmación de Camila sobre couriers activos y tarifas finales

### Distribución — canales activos
- [x] Google Merchant Center + Business Profile
- [x] WhatsApp Status (video v5)
- [x] LinkedIn — post confesional publicado 13 abril
- [x] Reddit r/chile — publicado 13 abril
- [x] WhatsApp Status — imagen Skich publicada 13 abril
- [x] Cylex — registrado 13 abril
- [ ] Páginas Amarillas
- [ ] GuíaLocal
- [ ] Goodreads grupos Chile
- [ ] Email a centros de alumnos (Kit Metralleta)
- [ ] Email a coordinadores de carrera (mensaje #6 del kit)

---

## Pendiente

### 🟡 Prioridad alta (abril 2026)

**Contenido editorial / Blog (SEO long-tail)**
- [ ] Base técnica SEO está sólida — la debilidad es falta de contenido para long-tail
- [ ] Blog con tono confesional: "Por qué tu Neruda del 2008 vale más de lo que crees"
- [ ] Prioridad baja por ahora — foco en circulación universitaria primero

**Google Search Console**
- [x] Setup y monitoreo — 10 páginas indexadas, structured data shipping/returns agregado

**Agente QA con Playwright**
- [x] Setup Playwright contra local y producción (15 abril)
- [x] 5 flujos dorados iniciales: home, search, ficha libro, publish requiere login, footer
- [ ] Ampliar a: registro real, agregar al carrito, bundle checkout, pago sandbox MP, mensajería, publicar libro con login
- [ ] Subagente `ux-tester` custom que corre flujos bajo demanda con screenshots

### 🟠 Prioridad media

**Mantenedor de categorías sugeridas por vendedores**
- [x] CRUD de categorías en admin (completado 12 abril)
- [ ] Tabla `category_suggestions` (vendedor → admin)
- [ ] Botón "¿No encuentras tu categoría? Sugiérela" en publish form
- [ ] Notificación email/Telegram a admin cuando llega sugerencia

**Reseñas: separar libro vs vendedor**
- [ ] Problema: reseñas pegadas al listing, cuando se vende queda huérfana
- [ ] Migración: tabla `reviews` con `target_type: 'book' | 'seller'`
- [ ] Widget "Reputación del vendedor" en `/vendedor/[id]`

**Botón Mensaje en página del vendedor**
- [x] Botón "Mensaje" junto a WhatsApp/Email en /vendedor/[id]
- [x] Abre conversación en mensajería interna con el vendedor
- [x] ?to=userId crea conversación automáticamente si no existe

**Contactar comprador desde pedidos**
- [x] Botón "Escribir al comprador" en Mis Ventas
- [x] Link directo a mensajería interna vinculada al comprador

**Optimización polling `/api/messages/unread`**
- [ ] Hoy cada 30s — reducir a 2-3 min o migrar a Supabase Realtime
- [ ] Prioridad sube cuando haya 50+ usuarios activos

**Manejo de stock**
- [ ] Cantidad disponible por listing (hoy es 1 o nada)
- [ ] Descontar automáticamente al vender
- [ ] Prioridad: cuando haya vendedores con múltiples copias

### 🔵 Futuro

**Expansión Brasil** (evaluado 12 abril)
- [ ] Gap real: no existe P2P de libros entre personas (Estante Virtual es solo librerías)
- [ ] Mercado universitario fragmentado en WhatsApp/Facebook
- [ ] Modelo de cercanía tendría sentido en São Paulo
- [ ] Decisión: esperar 12-18 meses, validar Chile primero
- [ ] Hijo de Vero en Brasil puede hacer validación informal en su universidad

**Diseño visual con Stitch (Google)**
- [x] MCP configurado y conectado a Claude Code
- [x] Banners promocionales
- [ ] Landing pages por segmento
- [ ] Contenido visual para redes

**Panel analytics vendedores**
- [ ] Dashboard por vendedor: visitas, mensajes, ventas, libros publicados
- [ ] Primeros 50 vendedores: panel gratis de por vida

**Comparador de precios**
- [x] Comparador integrado en ficha del libro (Buscalibre, MercadoLibre, IberLibro)
- [x] Solo visible para el vendedor del libro
- [ ] Scraping automático con precios reales (futuro)
- [x] Comparador manual HTML existente

**Otros features**
- [ ] Filtros por encuadernación, editorial, páginas
- [ ] Buscador en página del vendedor
- [ ] Tracking envíos visual
- [ ] OAuth Facebook/Instagram
- [ ] Newsletter semanal automático
- [ ] Fix INP issue (6.2s según Vercel Toolbar)

### Requiere acción de Verónica
- [ ] Apple OAuth ($99/año) — decidir si vale la pena
- [ ] Recontactar 150+ vendedores históricos
- [ ] WhatsApp Business para tuslibros.cl
- [ ] Configurar verificación 2 pasos Google Cloud (deadline 16 abril)
- [ ] Publicar en Reddit, LinkedIn, Goodreads (textos listos)

### Descartados
- ~~Checkout múltiple carrito~~ — split payment MP no soporta múltiples vendedores → resuelto con bundle checkout por vendedor
- ~~Infinite scroll~~ — paginación numérica es mejor para SEO
- ~~Suscripciones mensuales~~ — foco en comisiones por venta
- ~~Fee fijo~~ — nunca habrá fee fijo
- ~~AdSense~~ — eliminado, generaba errores sin aprobación
- ~~Expansión Brasil inmediata~~ — Chile primero, Brasil en 12-18 meses
- ~~Upgrade Next.js 16 / Tailwind 4~~ — no ahora, sin beneficio inmediato vs riesgo

---

## Monetización actual
- **Comisiones MP**: 3-8% por venta/arriendo (funcionando desde 6 abril)
- **Suscripciones**: descartadas por ahora

---

## Datos actuales (13 abril 2026)
- 183 libros publicados (172 activos, 7 vendidos, 4 pausados)
- 33 Maigret colección Luis de Caralt a $7.990
- 5 categorías principales, 32+ subcategorías (admin CRUD)
- 11 usuarios registrados
- 4+ suscriptores newsletter
- 2 ventas reales con split payment
- Google Analytics GA4 integrado
- Distribución activa: LinkedIn, Reddit, WhatsApp, Cylex
- 10+ emails transaccionales funcionando
- Google Merchant Center activo (18 clicks/28 días)
- Google Business Profile (4.3★, 4 opiniones)
- Stack: Next.js 14, Supabase, MercadoPago, Shipit, Mapbox, Resend, Vercel

---

## Documentos de referencia
- `MODELO-NEGOCIO.md` — flujos de pago, planes, comisiones, ciclo arriendo
- `CLAUDE.md` — convenciones del proyecto para Claude Code
- `docs/kit_metralleta_confesional.html` — mensajes listos tono confesional (v2)
- `docs/newsletter_14abril2026.html` — newsletter lunes 14
- `docs/listados_directorios.html` — textos para Google, Reddit, LinkedIn, directorios
- `docs/tuslibros_gtm.html` — Go-to-market strategy
- `docs/INSTRUCCIONES_CARGA_MASIVA.md` — formato CSV para vendedores
