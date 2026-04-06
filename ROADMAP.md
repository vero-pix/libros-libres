# Libros Libres — Roadmap

Última actualización: 7 abril 2026, 03:00

---

## Completado

### Infraestructura
- [x] Next.js 14 + Supabase + Vercel
- [x] Dominio tuslibros.cl
- [x] Banner beta
- [x] Webhook MercadoPago + clave secreta
- [x] Resend SMTP + API (noreply@tuslibros.cl)
- [x] Confirmación email
- [x] Google + LinkedIn OAuth
- [x] AdSense + ads.txt
- [x] Sitemap + robots.txt + SEO redirects
- [x] Compresión imágenes
- [x] Shipit integrado (esperando tarifas)
- [x] PWA instalable (manifest + iconos)

### UI/UX
- [x] Paleta cream unificada todas las páginas
- [x] Navbar sticky
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

### Marketplace
- [x] Split Payment producción
- [x] Comisiones por plan
- [x] Checkout 3 formas entrega (courier "próximamente")
- [x] Sin fee en entrega persona/retiro
- [x] WhatsApp como alternativa sin MP
- [x] Arriendos completos con flujo devolución
- [x] Dashboard ventas + carrito persistente
- [x] Galería imágenes (publicación + post)
- [x] Reviews/valoraciones
- [x] Marcar como vendido
- [x] Script carga masiva CSV
- [x] Open Library API corregida

### Emails (7+ transaccionales)
- [x] Confirmación registro
- [x] Bienvenida newsletter
- [x] Notificación contacto → vero@economics.cl
- [x] Confirmación compra/arriendo → comprador
- [x] Notificación venta/arriendo → vendedor
- [x] Cambios estado arriendo (entrega, devolución, vencido)

### Admin
- [x] Panel con stats, delete individual/masivo, filtros por status

---

## Bloqueado

### Shipit courier
- Tarifas no configuradas — contactar ayuda@shipit.cl

---

## Pendiente

### Requiere acción tuya
- [ ] Shipit: activar tarifas con soporte
- [ ] Apple OAuth ($99/año)
- [ ] Google OAuth: publicar app en Google Console
- [ ] Carga masiva 500 libros (script listo, preparar CSV)

### Diseño (revisar juntos con spec Martfury)
- [ ] Replanteo navbar: dropdowns Mi cuenta, Ayuda, eliminar Mapa del menú
- [ ] Logo/imagen para tiendas de vendedores
- [ ] Estilos Martfury seleccionados

### Features futuros
- [ ] Checkout múltiple carrito (pagar varios libros)
- [ ] Tracking envíos (cuando Shipit funcione)
- [ ] Primer newsletter a suscriptores
- [ ] Reviews accesibles (link claro en pedidos + reviews del vendedor)
- [ ] OAuth Facebook/Instagram
- [ ] Sistema de recomendaciones
- [ ] Dominio personalizado Supabase
- [ ] Cápsulas LinkedIn

---

## Datos
- 15+ libros publicados en beta
- 5+ usuarios reales registrados
- Split payment verificado en producción
- 7+ emails transaccionales configurados
- PWA instalable en celular
- Stack: Next.js 14, Supabase, MercadoPago, Mapbox, Resend, Shipit
