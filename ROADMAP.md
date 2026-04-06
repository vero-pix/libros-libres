# Libros Libres — Roadmap

Última actualización: 6 abril 2026, 23:00

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
- [x] AdSense verificado (ca-pub-7953415124311211)
- [x] Sitemap.xml dinámico + robots.txt
- [x] Redirects SEO (13 URLs WordPress legacy)
- [x] Compresión automática de imágenes (max 1200x1600, JPEG 80%)

### UI/UX
- [x] Tipografía editorial (Playfair Display + DM Sans)
- [x] Paleta cream/ink/brand dorado — sin fondos oscuros
- [x] Navbar sticky + layout compartido
- [x] Sidebar categorías agrupadas (6 grupos) + drawer mobile
- [x] Autocompletado búsqueda
- [x] Filtro por autor
- [x] Login/register split panel claro + Google + LinkedIn + Apple (pronto)
- [x] Registro con País → Región → Comuna (346 comunas)
- [x] Bio/descripción tienda vendedor
- [x] Contacto vía WhatsApp + formulario
- [x] Página de planes con filosofía libre
- [x] OG image dinámico
- [x] Placeholder mejorado en cards sin portada

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
- [x] Precio como badge en ficha del libro
- [x] Dirección solo muestra comuna (privacidad)
- [x] Sinopsis: busca en Open Library "work" como fallback

### Datos
- [x] Newsletter (form + API + Supabase)
- [x] Formulario contacto (Supabase)
- [x] Scanner ISBN (Google Books + Open Library)
- [x] Panel admin (pedidos, listings, usuarios, mensajes, newsletter)
- [x] 5 slots de AdSense configurados

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
- [ ] Paginación numérica en grids de libros
- [ ] Tabs en detalle libro (descripción/ubicación/reviews)
- [ ] Libros relacionados en ficha del libro
- [ ] Breadcrumbs navegación contextual

### Corto plazo
- [ ] Checkout múltiple carrito (pagar varios libros)
- [ ] Email transaccional: confirmación compra/arriendo
- [ ] Tracking de envíos
- [ ] Reviews/valoraciones entre usuarios
- [ ] Liberación garantía arriendos
- [ ] Mejorar admin panel
- [ ] Quickview modal (ver libro sin entrar a página)
- [ ] Vista lista como alternativa al grid
- [ ] Vistos recientemente (localStorage)

### Mediano plazo
- [ ] OAuth Facebook / Instagram
- [ ] PWA (instalable en celular)
- [ ] Sistema de recomendaciones
- [ ] Dominio personalizado Supabase
- [ ] Descuentos/precios tachados en libros
- [ ] Integración Martfury: estilos seleccionados del tema original

---

## Datos del marketplace
- 500+ libros listos para cargar
- 150+ vendedores históricos
- 5+ usuarios reales registrados
- Split payment verificado ($20 comisión, $192 vendedor)
- Emails via Resend (noreply@tuslibros.cl)
- Google + LinkedIn OAuth activos
- AdSense verificado
- Stack: Next.js 14, Supabase, MercadoPago, Mapbox, Resend
