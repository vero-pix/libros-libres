# Libros Libres — Contexto del proyecto

## Producto
Marketplace de libros de segunda mano — grid de libros estilo e-commerce con mapa opcional,
modelo fee fijo de servicio ($1.500) + despacho, publicar siempre gratis.
URL producción: tuslibros.economics.cl
Repo: github.com/vero-pix/libros-libres

## Stack
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Supabase (DB + Auth + RLS) — project ID: tfaqvnsdasaegkcahaal
- Mapbox GL — centrado en Santiago (-70.6693, -33.4489)
- MercadoPago Checkout Pro — pasarela de pagos
- Vercel — deploy automático desde main

## Base de datos
Tablas: users, books, listings (con PostGIS), orders
Schema en: supabase/schema.sql
Migration de orders: supabase/migrations/20260402_create_orders.sql

## Diseño
Inspirado en Martfury (theme WordPress de tuslibros.cl original):
- Header de 2 filas: logo + búsqueda + auth / nav navy con links uppercase
- Paleta dorada (#d4a017), navy (#2d3436), links azules (#2b6cb0)
- Grid de libros con sidebar de categorías
- Footer multi-sección con newsletter
- Mapa movido a ruta dedicada /mapa

## Estado actual

### Fase 1 — Completado
- [x] Mapa interactivo funcionando (ahora en /mapa, lazy-loaded)
- [x] Auth completo (registro, login, logout)
- [x] Nav dinámico con usuario logueado
- [x] Publicar libro con ISBN autocomplete (Google Books API)
- [x] Selector de ubicación con pin draggable
- [x] Listings guardados en Supabase con coordenadas
- [x] Pins de libros en el mapa desde Supabase
- [x] Página de detalle del libro
- [x] Contacto por WhatsApp (botón directo con mensaje pre-armado)
- [x] Escáner de código de barras ISBN (react-zxing, cámara trasera, EAN-13)
- [x] Formulario de publicación unificado en /publish
- [x] Teléfono guardado en perfil
- [x] Página /perfil para editar nombre, teléfono y ubicación
- [x] Clustering nativo Mapbox GL
- [x] Geolocalización automática con GPS
- [x] Páginas de contenido MDX (FAQ, términos, privacidad, sobre nosotros, cómo funciona)

### Fase 2 — Rediseño UI (completado)
- [x] Header de 2 filas estilo Martfury (búsqueda prominente + nav navy)
- [x] Home page: grid de libros + sidebar de categorías + toolbar de ordenamiento
- [x] Mapa movido a /mapa con lazy-loading (ahorro ~450KB JS en home)
- [x] ListingCard rediseñado: cover tall, badge Nuevo/Usado, link azul, "Vendido por:"
- [x] Footer multi-sección: newsletter, links por categoría, "Libre, sin comisiones"
- [x] Paleta de colores dorada (de naranja a amber/gold)
- [x] Search page con sidebar de categorías y toolbar

### Fase 3 — Flujo de pagos (completado — pendiente activación)
- [x] Tabla `orders` con migration SQL
- [x] Integración MercadoPago Checkout Pro (crear preferencia, webhook IPN)
- [x] Página de checkout: dirección, envío estándar/rápido, desglose de precios
- [x] Botón "Comprar" en ListingDetail
- [x] Página post-pago (éxito/fallo/pendiente)
- [x] Webhook actualiza orden + marca listing como completado
- [x] Rutas /checkout y /orders protegidas por middleware
- [ ] **PENDIENTE: activar en producción** (ver sección "Para activar")

### Pendiente — Próximos pasos
- [ ] OAuth Google/Apple
- [ ] Búsqueda avanzada (filtros por precio, condición, distancia)
- [ ] Mis pedidos (vista comprador y vendedor)
- [ ] Notificaciones al vendedor cuando se compra su libro
- [ ] Integración real con couriers (API Chilexpress, Rappi, Blue Express)
- [ ] Cotización de envío en tiempo real según distancia
- [ ] Panel vendedor (mis ventas, historial, ganancias)

## Modelo de negocio
- Publicar: gratis ("Libre, sin comisiones" para vendedores)
- Fee fijo de servicio: $1.500 CLP al comprador
- Envío estándar (Chilexpress): $2.900 / Rápido (Rappi): $4.500
- Ingreso neto por transacción: ~$423-480 después de comisión MercadoPago

## Para activar el flujo de pagos
1. Ejecutar `supabase/migrations/20260402_create_orders.sql` en Supabase Dashboard → SQL Editor
2. Agregar en `.env.local`:
   - `MERCADOPAGO_ACCESS_TOKEN=APP_USR-...`
   - `SUPABASE_SERVICE_ROLE_KEY=eyJ...`
3. En MercadoPago Developers → Webhooks, configurar URL: `https://tuslibros.economics.cl/api/webhooks/mercadopago`
4. Deploy a Vercel (push a main)

## Decisiones técnicas
- Idioma: español chileno (tú, no vos)
- Publicar siempre gratis, fee fijo de servicio al comprador
- ISBN como eje central — autocomplete via Google Books API
- Mapa como feature secundario (ruta /mapa), no como home
- MercadoPago Checkout Pro (redirect, no embed) para simplicidad y confianza
