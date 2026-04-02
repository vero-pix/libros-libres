# Libros Libres — Contexto del proyecto

## Producto
Marketplace de libros tipo Uber — mapa con libros cercanos como pins,
comisión sobre despacho, publicar siempre gratis.
URL producción: tuslibros.economics.cl
Repo: github.com/vero-pix/libros-libres

## Stack
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Supabase (DB + Auth) — project ID: tfaqvnsdasaegkcahaal
- Mapbox GL — centrado en Santiago (-70.6693, -33.4489)
- Vercel — deploy automático desde main

## Base de datos
Tablas: users, books, listings (con PostGIS para geolocalización)
Schema en: supabase/schema.sql

## Estado actual
- [x] Mapa interactivo funcionando
- [x] Auth completo (registro, login, logout)
- [x] Nav dinámico con usuario logueado
- [x] Publicar libro con ISBN autocomplete (Google Books API)
- [x] Selector de ubicación con pin draggable
- [x] Listings guardados en Supabase con coordenadas
- [x] Pins de libros en el mapa desde Supabase
- [x] Página de detalle del libro
- [x] Contacto por WhatsApp (botón directo con mensaje pre-armado)
- [x] Escáner de código de barras ISBN (react-zxing, cámara trasera, EAN-13)
- [x] Formulario de publicación unificado en /publish (ruta /listings/new redirige ahí)
- [x] Teléfono guardado en perfil: primera publicación guarda phone, las siguientes lo pre-rellenan
- [x] Página /perfil para editar nombre y teléfono
- [x] Clustering nativo Mapbox GL en el mapa (agrupa pins, click para expandir)

## Pendiente Fase 1
- [ ] Flujo de contacto entre comprador y vendedor (más allá de WhatsApp)

## Pendiente Fase 2
- [ ] Cotización despacho en tiempo real (Uber Direct API)
- [ ] Checkout unificado (libro + despacho) con MercadoPago
- [ ] Comisión automática sobre despacho

## Decisiones técnicas
- Idioma: español chileno (tú, no vos)
- Publicar siempre gratis, comisión solo sobre despacho
- ISBN como eje central — autocomplete via Google Books API
