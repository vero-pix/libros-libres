# Libros Libres — Roadmap

Última actualización: 7 abril 2026, 01:00

---

## Completado

### Infraestructura
- [x] Next.js 14 + Supabase + Vercel
- [x] Dominio tuslibros.cl (sin www, www redirige 308)
- [x] Banner beta activo
- [x] Webhook MercadoPago registrado con clave secreta
- [x] Resend SMTP configurado (noreply@tuslibros.cl)
- [x] Confirmación de email funcionando
- [x] Google OAuth funcionando
- [x] LinkedIn OAuth funcionando
- [x] AdSense verificado + ads.txt
- [x] Sitemap.xml dinámico + robots.txt
- [x] Redirects SEO (13 URLs WordPress legacy)
- [x] Compresión automática de imágenes (max 1200x1600, JPEG 80%)

### UI/UX
- [x] Tipografía editorial (Playfair Display + DM Sans)
- [x] Paleta cream unificada en TODAS las páginas (sin oscuros)
- [x] Navbar sticky + layout compartido
- [x] Sidebar categorías agrupadas (6 grupos) + drawer mobile
- [x] Autocompletado búsqueda + filtro por autor
- [x] Login/register split panel + Google + LinkedIn + Apple (pronto)
- [x] Registro con País → Región → Comuna (346 comunas)
- [x] Bio/descripción tienda vendedor
- [x] Contacto vía WhatsApp + formulario
- [x] Página de planes con filosofía libre
- [x] OG image dinámico
- [x] Placeholder mejorado en cards sin portada
- [x] Paginación numérica (20 por página)
- [x] Tabs en detalle libro (Descripción/Ubicación/Vendedor)
- [x] Libros relacionados (mismo género)
- [x] Breadcrumbs (detalle libro, búsqueda, vendedor, checkout)
- [x] Quickview modal (vista rápida en hover)
- [x] Vista lista como alternativa al grid
- [x] Vistos recientemente (localStorage, scroll horizontal)

### Marketplace
- [x] MercadoPago Split Payment en producción (verificado)
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%)
- [x] Webhook con verificación firma HMAC
- [x] Checkout con 3 formas de entrega
- [x] Sistema arriendos (7/14/30 días, garantía)
- [x] Dashboard ventas (/mis-ventas)
- [x] Carrito persistente
- [x] Galería de imágenes por libro (hasta 5 fotos adicionales)
- [x] Post-publicación: "Ver publicación" + "Publicar otro" + upload fotos
- [x] Listings se marcan completed/rented automáticamente
- [x] Precio como badge + dirección solo comuna (privacidad)
- [x] Sinopsis: busca en Open Library "work" como fallback

### Admin y datos
- [x] Panel admin mejorado (stats, delete individual/masivo, filtros por status)
- [x] Newsletter (form + API + Supabase)
- [x] Formulario contacto (Supabase)
- [x] Scanner ISBN (Google Books + Open Library)
- [x] 5 slots de AdSense

---

## Bloqueado

### Chilexpress cotización real
- API keys activas pero endpoints producción devuelven 404
- Verónica solicitó credenciales correctas
- Fallback $2.900 funciona temporalmente

---

## Pendiente — Próximos pasos

### Inmediato
- [ ] Chilexpress: resolver endpoints producción
- [ ] Apple OAuth (necesita Apple Developer account $99/año)
- [ ] Carga masiva de 500+ libros (script CSV)
- [ ] Verificar app Google OAuth (publicar en Google Console)
- [ ] Imágenes múltiples al publicar (integrar ImageUploadMultiple en PublishForm)

### Corto plazo
- [ ] Checkout múltiple carrito (pagar varios libros en una transacción)
- [ ] Email transaccional: confirmación compra/arriendo al comprador y vendedor
- [ ] Tracking de envíos (cuando Chilexpress funcione)
- [ ] Reviews/valoraciones entre usuarios
- [ ] Liberación garantía arriendos (flujo devolución)
- [ ] Descuentos/precios tachados en libros

### Mediano plazo
- [ ] OAuth Facebook / Instagram
- [ ] PWA (instalable en celular)
- [ ] Sistema de recomendaciones
- [ ] Dominio personalizado Supabase (OAuth muestre tuslibros.cl)
- [ ] Integración estilos Martfury seleccionados
- [ ] Cápsulas LinkedIn

---

## Datos del marketplace
- 500+ libros listos para cargar
- 150+ vendedores históricos
- 9+ libros publicados en beta
- 5+ usuarios reales registrados
- Split payment verificado ($20 comisión, $192 vendedor)
- Emails via Resend (noreply@tuslibros.cl)
- Google + LinkedIn OAuth activos
- AdSense verificado + ads.txt
- Stack: Next.js 14, Supabase, MercadoPago, Mapbox, Resend
