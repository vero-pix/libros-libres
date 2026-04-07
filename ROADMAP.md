# tuslibros.cl — Master Plan

Última actualización: 7 abril 2026

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
- [x] AdSense + ads.txt
- [x] Sitemap + robots.txt + SEO redirects (WordPress legacy → Next.js)
- [x] Compresión imágenes
- [x] PWA instalable (manifest + iconos)
- [x] Env vars producción actualizadas (SUPABASE_SERVICE_ROLE_KEY formato nuevo sb_secret_)
- [x] RESEND_API_KEY configurada en Vercel ✅

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
- [x] ListingCard: badges "Nuevo"/"Oferta", hover con quickview + comprar, avatar vendedor
- [x] Footer: link /mapa→/planes, tagline, hover dorado
- [x] HeroBar: "Explorar catálogo" con contador, cards rounded-xl, gradiente card Arrienda
- [x] Página detalle: fondo bg-cream consistente
- [x] Back to top button
- [x] Sidebar categorías sticky con scroll propio

### Marketplace
- [x] Split Payment producción ✅ verificado
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%)
- [x] Checkout 3 formas entrega (courier "próximamente")
- [x] Sin fee en entrega persona/retiro
- [x] WhatsApp como alternativa sin MP
- [x] Arriendos completos con flujo devolución
- [x] Dashboard ventas + carrito persistente
- [x] Galería imágenes (publicación + post)
- [x] Reviews/valoraciones
- [x] Estrellas en cards (promedio + count server-side)
- [x] Marcar como vendido
- [x] Script carga masiva CSV (bulk-upload-csv.ts)
- [x] 60+ libros publicados (15 originales + 49 carga masiva)
- [x] Open Library API corregida
- [x] Libros destacados por plan (badge "Destacado", prioridad en grilla)
- [x] Filtro "Cerca de mí" (geolocalización navegador + haversine)
- [x] Sistema de recomendaciones (por género/autor, con cache)

### Emails
- [x] Confirmación registro
- [x] Bienvenida newsletter
- [x] Notificación contacto → vero@economics.cl
- [x] Confirmación compra/arriendo → comprador
- [x] Notificación venta/arriendo → vendedor
- [x] Cambios estado arriendo (entrega, devolución, vencido)
- [x] Newsletter sender (admin panel + template "El Uber de los libros") ✅ funciona

### Admin
- [x] Panel con stats, delete individual/masivo, filtros por status
- [x] Tab Newsletter con preview y botón enviar

### LinkedIn / Marketing
- [x] 3 posts certificados Anthropic (AI Fluency, Claude Cowork, Claude Code in Action)
- [x] Post lanzamiento tuslibros.cl redactado
- [x] URL LinkedIn corregida en /historia (/in/economista-veronica-velasquez/)

### SEO & Performance (auditoría 7 abril — 16/16 items)
- [x] Metadata dinámica en listing detail + search (generateMetadata)
- [x] JSON-LD schemas (Product, BreadcrumbList, Organization)
- [x] Lazy load mapbox en formularios de publicación
- [x] next/image en todos los componentes + alt descriptivos + aria-labels
- [x] h1 en home, ISR en listing detail, Suspense skeletons
- [x] Vercel Analytics + Service worker PWA + placeholder blur + cache API

---

## En progreso

### Shipit courier
- [x] Integración código lista
- [ ] Email enviado a ayuda@shipit.cl para activar tarifas — esperando respuesta

---

## Pendiente

### Requiere acción de Verónica
- [ ] Apple OAuth ($99/año) — decidir si vale la pena
- [ ] Carga masiva 500 libros (script listo, preparar CSV grande)
- [ ] Recontactar 150+ vendedores históricos de tuslibros.cl

### Features futuros
- [x] Flujo emails comprador↔vendedor (ya implementado en webhook MP) ✅
- [x] Preguntas públicas al vendedor (estilo MercadoLibre — visibles para todos) ✅
- [ ] Páginas newsletter: testimonios, historia García Márquez, voces reales
- [ ] Sección "Voces reales" en home o landing
- [ ] Checkout múltiple carrito (pagar varios libros de distintos vendedores)
- [ ] Tracking envíos (cuando Shipit active tarifas)
- [ ] OAuth Facebook/Instagram
- [ ] Dominio personalizado Supabase
- [ ] Cápsulas LinkedIn (videos cortos)
- [ ] Cotización envío en tiempo real según distancia
- [ ] Infinite scroll como alternativa a paginación
- [x] Importador masivo CSV desde la web (gratis por ahora) ✅

---

## Datos actuales (7 abril 2026)
- 60+ libros publicados
- 5+ usuarios registrados
- 3 suscriptores newsletter
- Split payment MercadoPago verificado en producción
- 7+ emails transaccionales + newsletter funcionando
- PWA instalable + service worker offline
- Filtro geolocalización activo
- Planes con diferenciación real (destacados en grilla)
- SEO score ~10/10 (metadata, JSON-LD, ISR, analytics)
- Stack: Next.js 14, Supabase, MercadoPago, Mapbox, Resend, Vercel Analytics, Shipit (pendiente tarifas)

---

## Documentos de referencia
- `MODELO-NEGOCIO.md` — flujos de pago, planes, comisiones, ciclo arriendo
- `MARTFURY_TO_NEXTJS_SPEC.md` — spec migración tema WP, mapping componentes
- `CONTEXT.md` — contexto técnico del proyecto (desactualizado, consolidado aquí)
