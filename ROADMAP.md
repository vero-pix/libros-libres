# tuslibros.cl — Master Plan

Última actualización: 9 abril 2026, 13:00

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
- [x] Marcar como vendido
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

### Página vendedor
- [x] Perfil: avatar, nombre, ciudad, bio, miembro desde, stats
- [x] Canales contacto: WhatsApp, Instagram, Email
- [x] Sorting: Recientes, Precio ↑↓, Título, Autor

### SEO & Performance (auditoría 7 abril — 16/16 items)
- [x] Metadata dinámica en listing detail + search + vendedor
- [x] JSON-LD schemas (Product, BreadcrumbList, Organization)
- [x] Lazy load mapbox en formularios de publicación
- [x] next/image en todos los componentes + alt descriptivos + aria-labels
- [x] h1 en home, ISR en listing detail, Suspense skeletons
- [x] Vercel Analytics + placeholder blur + cache API recommendations
- [x] Scanner ISBN: timeout 3s Google Books → fallback rápido Open Library

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
- [x] Tab Herramientas: botones para portadas, auditoría, sinopsis, metadata
- [x] API /api/admin/enrich-metadata (ejecuta enriquecimiento desde panel)
- [x] PageTracker invisible (registra cada visita en Supabase)
- [x] Selector de vendedor en herramientas (filtrar operaciones por vendedor)
- [x] Toggle featured (estrella) por publicación
- [x] Escudo dorado solo en libros destacados (no en todos con MP)

### Datos y calidad (sesión 9 abril)
- [x] 116+ libros publicados activos
- [x] 92 libros enriquecidos con metadata (editorial, páginas, sinopsis) via Google Books + Open Library
- [x] 47 portadas arregladas con script fix-covers + 8 de Open Library + 4 recortadas de fotos reales
- [x] 13 sinopsis spam/inglés eliminadas + filtro: solo acepta sinopsis en español
- [x] 13 editoriales falsas ("ISBN Handbook") eliminadas
- [x] Google Books API key inválida → script funciona sin key
- [x] Validación título/autor obligatorios al publicar
- [x] Detección imágenes placeholder en cards (onLoad size check)
- [x] Búsqueda: strip paréntesis para evitar romper PostgREST or()
- [x] Buscador: sugerencias navegan directo al libro (no re-buscan por título)
- [x] Checkout: botón MercadoPago solo si vendedor tiene MP conectado
- [x] CONTEXT.md reescrito como referencia técnica completa
- [x] AdSense eliminado (generaba errores 403/400 sin estar aprobado)
- [x] Tab Ubicación eliminado (redundante con pin de comuna)

---

## En progreso

### Shipit courier
- [x] Webhook endpoint preparado (/api/webhooks/shipit)
- [x] Formato API corregido según docs oficiales (kind, platform, sizes, destiny)
- [x] Respuesta enviada a Camila (Shipit) con detalle de integración
- [ ] Esperando confirmación de Camila sobre couriers activos y tarifas
- [ ] Tarifas no configuradas — Shipit debe activar couriers en la cuenta

### Revisión catálogo (a cargo de Verónica)
- [ ] Revisar portadas que no corresponden a la edición real
- [ ] Subir fotos faltantes manualmente (7 libros sin portada)
- [ ] Corregir sinopsis incorrectas restantes

---

## Pendiente

### ✅ Reorganización de categorías (COMPLETADO 9 abril)
- [x] Tabla categories con árbol: 5 raíces, 32 subcategorías
- [x] Taxonomía: Ficción, No ficción, Infantil/juvenil, Académicos, Coleccionables
- [x] 160 libros migrados automáticamente con genreNormalizer
- [x] Tags controlados (Clásico, Borges, BibliotecaDeBabel, Coleccionable, etc.)
- [x] Sidebar reescrito: categorías desplegables + tags destacados clickeables
- [x] Categorización automática al publicar (genreNormalizer + tagSuggester)
- [x] API /api/books con filtros por category, subcategory, tag, precio
- [x] Tags como chips clickeables en ficha del libro

### ✅ URLs amigables (COMPLETADO 9 abril)
- [x] Ruta /libro/[slug] con metadata, JSON-LD, breadcrumbs
- [x] 111 slugs generados desde títulos
- [x] Slug autogenerado al publicar (con dedup)
- [x] Redirect permanente /listings/[uuid] → /libro/[slug]
- [x] 13 componentes actualizados (cards, mapa, carrito, buscador, recomendaciones)

### 🔴 Distribución y redes sociales (PRIORIDAD)

**Fase 1 — Presencia (semana 9-13 abril)**
- [ ] Crear cuenta Instagram @tuslibros.cl
- [ ] Publicar 3 stories con banners Canva
- [ ] Publicar post feed Instagram: carrusel "Qué es tuslibros.cl"
- [ ] Publicar post LinkedIn: lanzamiento tuslibros.cl
- [ ] Enviar newsletter de lanzamiento a suscriptores

**Fase 2 — Tracción (semana 14-20 abril)**
- [ ] Publicar 2-3 posts/semana en Instagram
- [ ] Ejecutar kit metralleta en canales universitarios
- [ ] Compartir en grupos Facebook de lectura/libros Chile
- [ ] Contactar 20 vendedores históricos con mensaje personalizado

**Fase 3 — Escala (semana 21+ abril)**
- [ ] Evaluar herramienta automatización (Buffer/Later)
- [ ] Contenido recurrente: "Libro de la semana", "Colección destacada"
- [ ] Recontactar resto de 150+ vendedores históricos

### Panel analytics vendedores
- [ ] Dashboard por vendedor: visitas, mensajes, ventas, libros publicados
- [ ] Primeros 50 vendedores: panel gratis de por vida
- [ ] Después: feature de plan Librero/Librería

### Cron jobs
- [ ] Google Trends ranking (trending_score)
- [ ] Newsletter automático semanal
- [ ] Limpieza listings inactivos >90 días

### Comparador de precios (inteligencia competitiva)
- [ ] Scraping automático Buscalibre/MercadoLibre (requiere Puppeteer o Browserless)
- [ ] Búsqueda internacional: detectar joyas que fuera de Chile valen mucho más (AbeBooks, Amazon, IberLibro)
- [ ] Dashboard: "tus libros más baratos que la competencia" como argumento de venta
- [x] Comparador manual: HTML con links directos a BL/ML para 109 libros (docs/comparador_precios.html)

### Mis Libros (gestión vendedor)
- [ ] Buscador/filtro en /mis-libros para encontrar publicaciones propias rápido
- [ ] Sorting en /mis-libros (precio, título, fecha)

### Features futuros
- [x] Mensajería interna entre compradores y vendedores
- [ ] Filtros por encuadernación, editorial, páginas en la tienda
- [ ] Buscador en página del vendedor (/vendedor/[id])
- [x] Foto-a-catálogo completo: IA identifica libros de foto grupal → publicación masiva
- [ ] Tracking envíos (cuando Shipit active)
- [ ] OAuth Facebook/Instagram
- [ ] Compartir en Instagram Stories al publicar
- [ ] Newsletter semanal — elegir día estratégico
- [ ] Dominio personalizado Supabase
- [ ] Fix INP issue (botón bloqueó UI 6.2s según Vercel Toolbar)

### Requiere acción de Verónica
- [ ] Apple OAuth ($99/año) — decidir si vale la pena
- [ ] Recontactar 150+ vendedores históricos
- [ ] WhatsApp Business para tuslibros.cl

### Descartados
- ~~Checkout múltiple carrito~~ — split payment MP no soporta múltiples vendedores
- ~~Infinite scroll~~ — paginación numérica es mejor para SEO
- ~~Suscripciones mensuales~~ — foco en comisiones por venta
- ~~Fee fijo~~ — nunca habrá fee fijo
- ~~AdSense~~ — eliminado, generaba errores sin aprobación

---

## Monetización actual
- **Comisiones MP**: 3-8% por venta/arriendo (funcionando desde 6 abril)
- **Suscripciones**: descartadas por ahora

---

## Datos actuales (9 abril 2026)
- 116+ libros publicados activos
- 160 libros con taxonomía (category/subcategory/tags)
- 111 URLs amigables (/libro/slug)
- 92 libros enriquecidos con metadata
- 5 categorías principales, 32 subcategorías
- 5+ usuarios registrados
- 3 suscriptores newsletter
- 1 venta real completada con split payment
- 10+ emails transaccionales funcionando
- PWA instalable + service worker offline
- Analytics propias con tracking de visitas
- Stack: Next.js 14, Supabase, MercadoPago, Mapbox, Resend, Vercel Analytics

---

## Documentos de referencia
- `MODELO-NEGOCIO.md` — flujos de pago, planes, comisiones, ciclo arriendo
- `CONTEXT.md` — contexto técnico del proyecto
- `docs/INSTRUCCIONES_CARGA_MASIVA.md` — formato CSV para vendedores
- `docs/tuslibros_gtm.html` — Go-to-market strategy completa
- `docs/tuslibros_kit_metralleta.html` — Kit táctico de mensajes listos
