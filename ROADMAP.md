# tuslibros.cl — Master Plan

Última actualización: 12 abril 2026

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
- [ ] Setup Playwright contra preview y producción
- [ ] Flujos dorados automatizados: registro, búsqueda, agregar al carrito, bundle checkout, pago sandbox, mensajería, publicar libro
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
- [ ] Scraping automático Buscalibre/MercadoLibre
- [ ] Búsqueda internacional: joyas que valen más fuera de Chile
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

## Datos actuales (12 abril 2026)
- 500+ libros publicados
- 33 Maigret colección Luis de Caralt a $7.990
- 5 categorías principales, 32+ subcategorías (admin CRUD)
- 9+ usuarios registrados
- 4+ suscriptores newsletter
- 1+ ventas reales con split payment
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
