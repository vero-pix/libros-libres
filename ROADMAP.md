# Libros Libres — Roadmap

Última actualización: 6 abril 2026

---

## Completado

### Infraestructura
- [x] Next.js 14 + Supabase + Vercel
- [x] Dominio tuslibros.cl configurado (sin www como principal)
- [x] Banner beta activo

### UI/UX
- [x] Tipografía editorial (Playfair Display + DM Sans)
- [x] Paleta cream/ink/brand dorado — sin fondos oscuros
- [x] Navbar en layout compartido
- [x] Sidebar categorías sticky + drawer mobile
- [x] Autocompletado búsqueda
- [x] Login/register split panel claro + OAuth Google
- [x] Registro con País → Región → Comuna (346 comunas)
- [x] Bio/descripción tienda vendedor
- [x] Ilustración animada (autores chilenos, comunas Santiago)
- [x] Contacto vía WhatsApp (+56994583067) + formulario

### Marketplace
- [x] MercadoPago Split Payment en producción
- [x] OAuth vendedor MP funcionando
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%)
- [x] Webhook con verificación firma HMAC
- [x] Checkout con 3 formas de entrega (persona/retiro/courier)
- [x] Sistema arriendos (7/14/30 días, garantía, entrega)
- [x] Dashboard ventas (/mis-ventas)
- [x] Listings se marcan completed/rented automáticamente

### Datos
- [x] Newsletter (form + API + Supabase)
- [x] Formulario contacto (Supabase)
- [x] Scanner ISBN
- [x] Panel admin

---

## Bloqueado

### Chilexpress cotización real
- API keys de producción activas pero endpoints devuelven 404
- Verónica investigando con Chilexpress qué falta activar
- Fallback $2.900 funciona temporalmente
- **BLOQUEANTE para flujo de courier**

---

## Pendiente — Próximos pasos

### Inmediato (resolver esta semana)
- [ ] Chilexpress: obtener endpoints de producción correctos
- [ ] Google OAuth: configurar provider en Supabase Dashboard
- [ ] Confirmación email: configurar SMTP con Resend en Supabase
- [ ] AdSense: obtener ID y agregar NEXT_PUBLIC_ADSENSE_CLIENT
- [ ] Webhook MP: registrar URL https://tuslibros.cl/api/webhooks/mercadopago
- [ ] Carga masiva de 500+ libros

### Corto plazo
- [ ] Página de planes vendedor (Libre/Librero/Librería)
- [ ] Mejorar admin panel (limpieza, mejor UX)
- [ ] Email transaccional (Resend): confirmación compra, arriendo
- [ ] Tracking de envíos
- [ ] Reviews/valoraciones
- [ ] Liberación garantía arriendos

### Mediano plazo
- [ ] PWA (instalable en celular)
- [ ] Sistema de recomendaciones
- [ ] Cápsulas LinkedIn

---

## Datos del marketplace
- 500+ libros listos para cargar
- 150+ vendedores históricos
- Split payment verificado en producción ($20 comisión, $192 vendedor)
- Stack: Next.js 14, Supabase, MercadoPago, Chilexpress, Mapbox
