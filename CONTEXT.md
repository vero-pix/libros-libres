# Libros Libres — Contexto del proyecto

## Producto
"El Uber de los libros" — cada estantería es una librería. Geolocalización en tiempo real,
pago seguro, despacho a domicilio. Publicar siempre gratis, sin comisiones al vendedor.
URL producción: **tuslibros.cl** (dominio definitivo, DNS configurados en NIC Chile → Vercel)
Repo: github.com/vero-pix/libros-libres

## Stack
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Supabase (DB + Auth + RLS + PostGIS) — project ID: tfaqvnsdasaegkcahaal
- Mapbox GL — centrado en Santiago (-70.6693, -33.4489)
- MercadoPago Checkout Pro — pasarela de pagos
- Open Library API — búsqueda ISBN + portadas (fallback de Google Books)
- Vercel — deploy automático desde main
- Tipografía: Playfair Display (display) + DM Sans (body)

## Base de datos
Tablas: users, books, listings (con PostGIS), orders
Schema en: supabase/schema.sql
Migration de orders: supabase/migrations/20260402_create_orders.sql
API keys: nuevo formato Supabase (`sb_publishable_`, no `eyJ`)

## Diseño
Estética editorial/magazine inspirada en revista literaria:
- Paleta: ink (#1a1a2e), cream (#faf8f4), brand dorado (#d4a017)
- Tipografía serif (Playfair Display) para títulos, sans (DM Sans) para body
- Hero: "Cada estantería es una librería" con red de nodos SVG + feed simulado
- Sección tech: "Como Uber, pero para libros"
- Cards sin bordes, hover scale, placeholders con gradiente
- Footer newsletter fondo ink

## Estado actual — 2 abril 2026

### En producción (tuslibros.cl)
- [x] Auth completo (registro, login, logout)
- [x] Publicar libro con ISBN scanner (react-zxing) + búsqueda ISBN (Open Library + Google Books)
- [x] Ingreso manual cuando ISBN no se encuentra en bases de datos
- [x] Mapa interactivo con clustering + sidebar con filtros (cercanía, autor, categoría)
- [x] Geolocalización automática GPS
- [x] Contacto por WhatsApp
- [x] Flujo de pagos MercadoPago Checkout Pro
- [x] Checkout con envío estándar ($2.900 Chilexpress) / rápido ($4.500 Rappi)
- [x] Webhook IPN para confirmar pagos + marcar listing como completado
- [x] Notificaciones al vendedor (WhatsApp)
- [x] Mis Pedidos (tabs compras/ventas)
- [x] Búsqueda avanzada (precio, condición, modalidad)
- [x] Categorías traducidas al español (desde inglés de Google Books)
- [x] Landing page editorial: hero "Uber de libros", feed simulado, pitch tech
- [x] Sección "Voces reales" con quotes busca/ofrece
- [x] Páginas de contenido con hero images (FAQ, Cómo Funciona, Sobre Nosotros, Términos, Privacidad)
- [x] Página /historia (case study para LinkedIn)
- [x] OG tags optimizados para LinkedIn
- [x] Footer multi-sección con newsletter
- [x] API backfill portadas (/api/admin/backfill-covers)
- [x] Dominio tuslibros.cl configurado (NIC Chile → Vercel nameservers)
- [x] Supabase: tabla orders creada, RLS activo, URL auth actualizada

### Pendiente activación
- [ ] MERCADOPAGO_ACCESS_TOKEN en Vercel env vars (para pagos reales)
- [ ] SUPABASE_SERVICE_ROLE_KEY en Vercel env vars (para webhook)
- [ ] Webhook URL en MercadoPago: https://tuslibros.cl/api/webhooks/mercadopago
- [ ] Google Books API key válida (actualmente placeholder, Open Library cubre como fallback)
- [ ] Imagen og-image.png (1200x630) en /public

### Bugs conocidos
- ISBNs de editoriales chilenas locales no se encuentran en Google Books ni Open Library → flujo manual funciona
- Portadas: 2 de 5 libros sin cover (ediciones locales sin datos en APIs externas)

### Próximos pasos
- [ ] OAuth Google/Apple (después de confirmar dominio definitivo)
- [ ] Subir foto de portada manualmente (para libros sin cover en APIs)
- [ ] Integración real con couriers (API Chilexpress, Rappi)
- [ ] Cotización envío en tiempo real según distancia
- [ ] Panel vendedor (mis ventas, historial)
- [ ] Cápsulas de contenido para LinkedIn (5 posts planificados)
- [ ] Imagen OG para compartir en LinkedIn

## Modelo de negocio
- Publicar: gratis ("Libre, sin comisiones" para vendedores)
- Fee fijo de servicio: $1.500 CLP al comprador
- Envío estándar (Chilexpress): $2.900 / Rápido (Rappi): $4.500
- Ingreso neto por transacción: ~$423-480 después de comisión MercadoPago

## Decisiones técnicas
- Idioma: español chileno (tú, no vos)
- Publicar siempre gratis, fee fijo al comprador
- ISBN como eje central — Open Library + Google Books como fuentes
- Mapa como feature secundario (/mapa), home es grid editorial
- MercadoPago Checkout Pro (redirect, no embed)
- Estética editorial/magazine (Playfair Display + DM Sans)
- Concepto: "Cada estantería es una librería" — distributed bookshelf network
