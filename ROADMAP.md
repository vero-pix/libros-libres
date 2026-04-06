# Libros Libres — Roadmap

Última actualización: 7 abril 2026, 02:00

---

## Completado

### Infraestructura
- [x] Next.js 14 + Supabase + Vercel
- [x] Dominio tuslibros.cl (sin www, www redirige 308)
- [x] Banner beta activo
- [x] Webhook MercadoPago registrado con clave secreta
- [x] Resend SMTP + API configurado (noreply@tuslibros.cl)
- [x] Confirmación de email funcionando
- [x] Google OAuth funcionando
- [x] LinkedIn OAuth funcionando
- [x] AdSense verificado + ads.txt
- [x] Sitemap.xml dinámico + robots.txt
- [x] Redirects SEO (13 URLs WordPress legacy)
- [x] Compresión automática de imágenes (max 1200x1600, JPEG 80%)
- [x] Shipit integrado (esperando activación tarifas)

### UI/UX
- [x] Paleta cream unificada en TODAS las páginas
- [x] Navbar sticky + layout compartido
- [x] Sidebar categorías agrupadas (6 grupos) + drawer mobile
- [x] Autocompletado búsqueda + filtro por autor
- [x] Paginación numérica (20 por página)
- [x] Tabs en detalle libro (Descripción/Ubicación/Vendedor)
- [x] Libros relacionados (mismo género)
- [x] Breadcrumbs (detalle, búsqueda, vendedor, checkout)
- [x] Quickview modal (vista rápida en hover)
- [x] Vista lista como alternativa al grid
- [x] Vistos recientemente (localStorage)
- [x] Login/register split panel + Google + LinkedIn + Apple (pronto)
- [x] Registro País → Región → Comuna (346 comunas)
- [x] Bio vendedor + placeholder mejorado cards
- [x] OG image dinámico
- [x] Página de planes con filosofía libre
- [x] Contacto WhatsApp + formulario
- [x] Precios con descuento (tachado + badge porcentaje)

### Marketplace
- [x] MercadoPago Split Payment en producción
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%)
- [x] Webhook con verificación firma HMAC
- [x] Checkout con 3 formas de entrega (courier "próximamente")
- [x] Sistema arriendos (7/14/30 días, garantía)
- [x] Dashboard ventas (/mis-ventas)
- [x] Carrito persistente
- [x] Galería de imágenes por libro (hasta 5 fotos)
- [x] Fotos adicionales al publicar (antes y después)
- [x] Reviews/valoraciones (estrellas 1-5, solo compradores)
- [x] Listings se marcan completed/rented automáticamente
- [x] Precio badge + dirección solo comuna

### Emails
- [x] Confirmación de registro (Resend SMTP via Supabase)
- [x] Bienvenida newsletter (Resend API)
- [x] Notificación contacto → vero@economics.cl
- [x] Confirmación de compra → comprador
- [x] Notificación de venta → vendedor
- [x] Confirmación de arriendo → arrendatario
- [x] Notificación de arriendo → propietario

### Admin y datos
- [x] Panel admin mejorado (stats, delete individual/masivo, filtros)
- [x] Newsletter + formulario contacto (Supabase)
- [x] Scanner ISBN (Google Books + Open Library work fallback)
- [x] 5 slots de AdSense

---

## Bloqueado

### Shipit courier con etiqueta
- Couriers activados pero tarifas no configuradas
- Contactar ayuda@shipit.cl para activar tarifas
- Opción courier deshabilitada con "Próximamente" en checkout

---

## Pendiente — Próximos pasos

### Inmediato
- [ ] Shipit: activar tarifas con soporte
- [ ] Apple OAuth (necesita Apple Developer $99/año)
- [ ] Carga masiva de 500+ libros (script CSV)
- [ ] Verificar app Google OAuth (publicar en Google Console)

### Corto plazo
- [ ] Checkout múltiple carrito (pagar varios libros)
- [ ] Tracking de envíos (cuando Shipit funcione)
- [ ] Liberación garantía arriendos (flujo devolución)
- [ ] Primer newsletter a suscriptores

### Mediano plazo
- [ ] OAuth Facebook / Instagram
- [ ] PWA (instalable en celular)
- [ ] Sistema de recomendaciones
- [ ] Dominio personalizado Supabase
- [ ] Integración estilos Martfury seleccionados
- [ ] Cápsulas LinkedIn

---

## Datos del marketplace
- 500+ libros listos para cargar
- 150+ vendedores históricos
- 9+ libros publicados en beta
- 5+ usuarios reales registrados
- Split payment verificado en producción
- 7 emails transaccionales configurados
- Google + LinkedIn OAuth activos
- AdSense verificado + ads.txt
- Reviews/valoraciones activo
- Descuentos/precios tachados activo
- Stack: Next.js 14, Supabase, MercadoPago, Mapbox, Resend, Shipit
