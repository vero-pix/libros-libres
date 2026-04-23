# tuslibros.cl — Contexto técnico del proyecto

Última actualización: 23 abril 2026

## Producto

Marketplace de libros usados en Chile. Compra, venta y arriendo entre personas, con cercanía geográfica como diferenciador. Publicar siempre gratis. Pago seguro con MercadoPago (split payment) o coordinación directa por WhatsApp sin comisión.

- URL producción: **tuslibros.cl**
- Repo: github.com/vero-pix/libros-libres
- Deploy: Vercel (automático desde main)
- Dominio: NIC Chile → Vercel nameservers

---

## Stack

- **Framework**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL + Auth + RLS + Storage)
- **Pagos**: MercadoPago Checkout Pro con Split Payment
- **Mapas**: Mapbox GL (centrado en Santiago)
- **Datos libros**: Google Books API + Open Library API (ISBN, portadas, metadata)
- **Email**: Resend (SMTP + API, noreply@tuslibros.cl)
- **Courier**: Shipit API v4 (en integración)
- **Analytics**: Vercel Analytics + PageTracker propio (Supabase)
- **Tipografía**: Playfair Display (headings) + DM Sans (body)
- **PWA**: manifest + iconos + service worker offline

---

## Base de datos (Supabase)

### Tablas principales
- **users** — perfil, plan (free/librero/libreria), OAuth (Google, LinkedIn), avatar, ciudad, teléfono, mercadopago_user_id
- **books** — título, autor, ISBN, descripción, portada, género, editorial, páginas, encuadernación, año
- **listings** — publicación de un libro por un vendedor. Slug único para URLs amigables. Precio venta, precio original (oferta), precio arriendo, garantía, modalidad (sale/loan/both), condición, ubicación (lat/lng), status, featured
- **orders** — pedidos con split payment MP, estado, tracking, dirección
- **reviews** — valoraciones con estrellas
- **questions** — preguntas públicas al vendedor (estilo MercadoLibre)
- **listing_images** — fotos adicionales por publicación
- **cart_items** — carrito persistente por usuario
- **messages** — mensajería interna entre compradores y vendedores
- **newsletter_subscribers** — suscriptores
- **contact_messages** — formulario de contacto
- **page_views** — analytics propias (visitas, browser, OS, dispositivo)
- **webhook_logs** — logs de webhooks entrantes

---

## Arquitectura de páginas

### Públicas
- `/` — Home: hero, banners colección, grilla de libros con sidebar categorías, paginación
- `/libro/[slug]` — Ficha del libro (URLs amigables, JSON-LD, tabs descripción/preguntas/reseñas)
- `/search` — Búsqueda con filtros (precio, condición, modalidad, género, autor)
- `/vendedor/[id]` — Perfil público del vendedor con sorting
- `/mapa` — Mapa interactivo con clustering
- `/sobre-nosotros`, `/faq`, `/como-funciona`, `/terminos`, `/privacidad`

### Autenticadas
- `/publish` — Publicar libro (scanner ISBN + manual + fotos + ubicación)
- `/mis-libros` — Gestión de publicaciones propias + edición inline
- `/mis-pedidos` — Compras y ventas con tabs
- `/carrito` — Carrito persistente
- `/checkout/[id]` — Pago (MP si vendedor tiene cuenta, WhatsApp si no)
- `/perfil` — Editar perfil
- `/mensajes` — Mensajería interna

### Admin
- `/admin` — Panel con tabs: Pedidos, Publicaciones, Usuarios, Mensajes, Suscriptores, Analytics, Herramientas
- Herramientas: buscar portadas, auditar portadas, enriquecer sinopsis, enriquecer metadata (filtrable por vendedor)
- Toggle de destacados (estrella) por publicación

---

## Features principales

### Marketplace
- Split Payment MercadoPago en producción (comisiones: Libre 8%, Librero 5%, Librería 3%)
- WhatsApp como alternativa sin comisión
- Checkout condicional: botón MP solo si el vendedor tiene MP conectado
- Arriendos completos con flujo de devolución
- Precios con descuento (precio original tachado + badge oferta)
- Libros destacados (toggle admin, escudo dorado en card, fila en home)

### Publicación
- Scanner ISBN con timeout 3s Google Books → fallback Open Library
- Autocompletado datos desde APIs (título, autor, portada, género, editorial, páginas)
- Fotos múltiples (portada + adicionales), primera foto extra = portada si no hay cover
- CoverUpload mobile: galería + cámara + eliminar portada
- Slug URL generado automáticamente desde título
- Campos: precio venta, precio original, precio arriendo, garantía, editorial, páginas, encuadernación

### Búsqueda y navegación
- Autocompletado en barra de búsqueda → navega directo al libro
- Búsqueda por título, autor, ISBN (strip paréntesis para PostgREST)
- Filtro "Cerca de mí" (geolocalización + haversine)
- Categorías agrupadas en sidebar + drawer mobile
- Paginación numérica
- Vista grilla y lista
- Quickview modal
- Vistos recientemente (localStorage)
- Recomendaciones por género/autor (con cache)

### Ficha del libro
- Tabs integrados: Descripción / Preguntas / Reseñas
- Galería de imágenes (ancho fijo 280px)
- ISBN, autor clickeable, editorial, páginas, encuadernación
- Botón Editar para el dueño
- Breadcrumbs + JSON-LD (Product, BreadcrumbList)
- Libros relacionados por género
- Botones compartir (WhatsApp, Facebook, Instagram, X, copiar link)

### SEO
- URLs amigables: `/libro/[slug]` con redirect desde `/listings/[uuid]`
- Metadata dinámica en todas las páginas
- JSON-LD schemas (Product, BreadcrumbList, Organization)
- Sitemap + robots.txt
- Canonical URLs
- OG images + Twitter cards
- ISR en fichas de libros

### Emails (10+ transaccionales via Resend)
- Confirmación registro, bienvenida
- Confirmación compra/arriendo → comprador
- Notificación venta/arriendo → vendedor
- Cambios estado arriendo
- Preguntas → vendedor / respondidas → comprador
- Newsletter (admin panel + template)
- Notificaciones admin (nuevo usuario, contacto)

### UI/UX
- Estilo Martfury: paleta cream (#faf8f4), ink (#1a1a2e), brand dorado (#d4a017)
- Navbar sticky con dropdowns
- Banners de colecciones en home
- Login split + OAuth social (Google, LinkedIn)
- Registro con País/Región/Comuna
- Back to top, sidebar sticky, footer multi-sección
- PWA instalable

---

## Modelo de negocio

- Publicar: siempre gratis, nunca habrá fee fijo
- Comisión solo por venta con MercadoPago (split payment):
  - Plan Libre: 8%
  - Plan Librero: 5%
  - Plan Librería: 3%
- WhatsApp + entrega en persona = 100% gratis, sin comisión
- Courier (Shipit): costo envío a cargo del comprador (en integración)
- Primeros 50 vendedores: panel analytics gratis de por vida

---

## Decisiones técnicas

- Idioma: español chileno (tú, no vos)
- ISBN como eje central — Open Library + Google Books como fuentes
- Mapa como feature secundario (/mapa), home es grilla editorial
- MercadoPago Checkout Pro (redirect, no embed) con split payment
- Cercanía geográfica como diferenciador vs otros marketplaces
- Arriendo como feature único en Chile
- No hay checkout múltiple (split payment MP no soporta múltiples vendedores)
- Paginación numérica (mejor para SEO que infinite scroll)
- No AdSense (eliminado, generaba errores sin aprobación)

---

## Datos actuales (23 abril 2026)

- 183+ libros publicados activos (incluye colecciones)
- Tráfico SEO comprobado en GSC para "libros usados" y "venta de libros usados"
- Adquisición orgánica activa vía Google, Bing y Reddit
- 16+ usuarios registrados
- Ventas reales completadas y envíos por courier (Shipit) activos
- Distribución y PR activo: Diario Financiero (Pitch), Reddit (r/chileIT, r/chile)
- SEO Técnico On-Page: 10/10 (Sitemaps dinámicos, Schemas JSON-LD x3, Titles enfocados en conversión)
