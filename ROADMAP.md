# tuslibros.cl — Master Plan

Última actualización: 7 abril 2026, 13:00

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
- [x] AdSense + ads.txt (esperando aprobación Google — estado "Preparando")
- [x] Sitemap + robots.txt + SEO redirects (WordPress legacy → Next.js + /libro/:slug)
- [x] Compresión imágenes
- [x] PWA instalable (manifest + iconos + service worker offline)
- [x] Env vars producción actualizadas
- [x] RESEND_API_KEY configurada en Vercel ✅
- [x] Primera venta real completada (6 abril 2026) — split payment funciona ✅

### UI/UX — Estilo Martfury
- [x] Paleta cream unificada todas las páginas
- [x] Navbar sticky + fix dropdowns (Mi cuenta, Ayuda)
- [x] Categorías agrupadas (6 grupos) + mobile drawer
- [x] Autocompletado + filtro autor
- [x] Paginación numérica
- [x] Tabs detalle libro
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
- [x] Fix espacio en blanco iOS Safari (AdSlot)

### Marketplace
- [x] Split Payment producción ✅ verificado con venta real
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%)
- [x] Checkout 3 formas entrega (courier "próximamente")
- [x] WhatsApp como alternativa sin MP (gratis, sin comisión)
- [x] Arriendos completos con flujo devolución
- [x] Dashboard ventas + carrito persistente
- [x] Galería imágenes (publicación + post)
- [x] Reviews/valoraciones + estrellas en cards
- [x] Marcar como vendido
- [x] Libros destacados por plan (badge "Destacado", prioridad en grilla)
- [x] Filtro "Cerca de mí" (geolocalización navegador + haversine)
- [x] Sistema de recomendaciones (por género/autor, con cache)
- [x] Preguntas públicas al vendedor (estilo MercadoLibre + emails)
- [x] Importador masivo CSV desde la web (gratis, con preview y portadas automáticas)
- [x] Botones compartir en redes (WhatsApp, Facebook, X, copiar link)

### SEO & Performance (auditoría 7 abril — 16/16 items)
- [x] Metadata dinámica en listing detail + search + vendedor (generateMetadata + OG tags)
- [x] JSON-LD schemas (Product, BreadcrumbList, Organization)
- [x] Lazy load mapbox en formularios de publicación
- [x] next/image en todos los componentes + alt descriptivos + aria-labels
- [x] h1 en home, ISR en listing detail, Suspense skeletons
- [x] Vercel Analytics + placeholder blur + cache API recommendations

### Emails (10+ transaccionales)
- [x] Confirmación registro
- [x] Bienvenida newsletter
- [x] Bienvenida nuevo usuario (3 pasos + CTA publicar)
- [x] Notificación admin cuando se registra usuario nuevo
- [x] Notificación contacto → vero@economics.cl
- [x] Confirmación compra/arriendo → comprador
- [x] Notificación venta/arriendo → vendedor
- [x] Cambios estado arriendo (entrega, devolución, vencido)
- [x] Nueva pregunta → vendedor
- [x] Pregunta respondida → comprador
- [x] Newsletter sender (admin panel + template)

### Contenido UX (7 abril)
- [x] FAQ reescrito: 5 secciones (compradores, vendedores, planes/comisiones, arriendos, cuenta)
- [x] Planes: comparador visual Modo Libre vs Modo Pro
- [x] Cómo Funciona: 3 flujos reales (directa, MercadoPago, arriendo) + 5 beneficios
- [x] CONTEXT.md + MODELO-NEGOCIO.md corregidos (nunca fee fijo)

### Admin
- [x] Panel con stats, delete individual/masivo, filtros por status
- [x] Tab Newsletter con preview y botón enviar
- [x] Tab Analytics: visitas/día, navegadores, OS, dispositivos, páginas top, libros más vistos
- [x] PageTracker invisible (registra cada visita en Supabase)
- [x] Webhook notificación nuevo usuario → admin

### LinkedIn / Marketing
- [x] 3 posts certificados Anthropic
- [x] Post lanzamiento tuslibros.cl redactado
- [x] URL LinkedIn corregida en /historia

### Datos y carga
- [x] 60+ libros publicados (15 originales + 49 carga masiva)
- [x] Script bulk-upload-csv.ts
- [x] Open Library API corregida

---

## En progreso

### Shipit courier
- [x] Integración código lista (lib/shipit.ts + /api/shipping/quote)
- [ ] Tarifas no configuradas — Shipit debe activar couriers en la cuenta (email enviado)

### AdSense
- [x] ads.txt autorizado
- [ ] Sitio en estado "Preparando" — esperando aprobación de Google

---

## Pendiente

### Requiere acción de Verónica
- [ ] Apple OAuth ($99/año) — decidir si vale la pena
- [ ] Carga masiva 500 libros (script listo, preparar CSV grande)
- [ ] Recontactar 150+ vendedores históricos de tuslibros.cl
- [ ] Configurar webhook Supabase para notificación nuevo usuario
- [ ] WhatsApp Business para tuslibros.cl (perfil verificado)

### Features futuros
- [ ] Páginas newsletter: testimonios, historia García Márquez, voces reales
- [ ] Sección "Voces reales" en home o landing
- [ ] Tracking envíos (cuando Shipit active tarifas)
- [ ] Cotización envío en tiempo real (cuando Shipit active tarifas)
- [ ] OAuth Facebook/Instagram
- [ ] Compartir en Instagram Stories al publicar libro (abre app con imagen pre-cargada)
- [ ] Buscador en página del vendedor (/vendedor/[id]) para filtrar sus libros
- [ ] Buscador en /mis-libros para encontrar publicaciones propias rápido
- [ ] Subir múltiples fotos al editar libro en /mis-libros (agregar ImageUploadMultiple al EditForm)
- [ ] Mensajería interna entre compradores y vendedores (bandeja de entrada en la plataforma)
- [ ] Dominio personalizado Supabase
- [ ] Cápsulas LinkedIn (videos cortos)
- [ ] Panel analytics para vendedores Pro (basado en admin analytics)

### Descartados
- ~~Checkout múltiple carrito~~ — split payment MP no soporta múltiples vendedores
- ~~Infinite scroll~~ — paginación numérica es mejor para SEO
- ~~Suscripciones mensuales~~ — no atractivas en esta etapa, foco en comisiones por venta
- ~~Fee fijo~~ — nunca habrá fee fijo

---

## Monetización actual
- **Comisiones MP**: 3-8% por venta/arriendo (ya funcionando, primera venta real 6 abril)
- **AdSense**: esperando aprobación Google (ads.txt listo, AdSlots posicionados)
- **Suscripciones**: descartadas por ahora

---

## Datos actuales (7 abril 2026)
- 60+ libros publicados
- 5+ usuarios registrados
- 3 suscriptores newsletter
- 1 venta real completada con split payment
- 10+ emails transaccionales funcionando
- PWA instalable + service worker offline
- Analytics propias con tracking de visitas
- SEO score ~10/10
- Stack: Next.js 14, Supabase, MercadoPago, Mapbox, Resend, Vercel Analytics

---

## Documentos de referencia
- `MODELO-NEGOCIO.md` — flujos de pago, planes, comisiones, ciclo arriendo
- `MARTFURY_TO_NEXTJS_SPEC.md` — spec migración tema WP, mapping componentes
- `CONTEXT.md` — contexto técnico del proyecto
- `docs/INSTRUCCIONES_CARGA_MASIVA.md` — formato CSV para vendedores
- `docs/PROMPT_CLAUDE_CODE_CONTENIDO_UX.md` — spec overhaul contenido UX
