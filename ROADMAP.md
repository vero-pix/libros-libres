# Libros Libres — Roadmap

Última actualización: 6 abril 2026, 20:00

---

## Completado

### Infraestructura
- [x] Next.js 14 + Supabase + Vercel
- [x] Dominio tuslibros.cl (sin www, www redirige 308)
- [x] Banner beta activo
- [x] Webhook MercadoPago registrado con clave secreta
- [x] Resend SMTP configurado (emails desde noreply@tuslibros.cl)
- [x] Confirmación de email funcionando
- [x] Google OAuth funcionando

### UI/UX
- [x] Tipografía editorial (Playfair Display + DM Sans)
- [x] Paleta cream/ink/brand dorado — sin fondos oscuros
- [x] Navbar en layout compartido
- [x] Sidebar categorías sticky + drawer mobile
- [x] Autocompletado búsqueda
- [x] Login/register split panel claro
- [x] Registro con País → Región → Comuna (346 comunas)
- [x] Bio/descripción tienda vendedor
- [x] Ilustración animada (autores chilenos, comunas Santiago)
- [x] Contacto vía WhatsApp (+56994583067) + formulario
- [x] Página de planes (Libre/Librero/Librería) con filosofía libre
- [x] Botones Apple/LinkedIn con "pronto"
- [x] OG image dinámico

### Marketplace
- [x] MercadoPago Split Payment en producción (verificado)
- [x] OAuth vendedor MP funcionando
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%)
- [x] Webhook con verificación firma HMAC
- [x] Checkout con 3 formas de entrega (persona/retiro/courier)
- [x] Sistema arriendos (7/14/30 días, garantía, entrega)
- [x] Dashboard ventas (/mis-ventas)
- [x] Carrito persistente (agregar, eliminar, página /carrito)
- [x] Listings se marcan completed/rented automáticamente
- [x] Perfil vendedor con bio y ubicación geocodificada

### Datos
- [x] Newsletter (form + API + Supabase)
- [x] Formulario contacto (Supabase)
- [x] Scanner ISBN
- [x] Panel admin (pedidos, listings, usuarios, mensajes, newsletter)

---

## Bloqueado

### Chilexpress cotización real
- API keys de producción activas pero endpoints devuelven 404
- Verónica solicitó credenciales correctas a Chilexpress
- Fallback $2.900 funciona temporalmente
- **BLOQUEANTE para flujo de courier**

---

## Pendiente — Próximos pasos

### Inmediato (esta semana)
- [ ] Chilexpress: obtener endpoints de producción correctos
- [ ] Apple OAuth: configurar (necesita Apple Developer account)
- [ ] LinkedIn OAuth: configurar (necesita LinkedIn App)
- [ ] AdSense: obtener ID y agregar NEXT_PUBLIC_ADSENSE_CLIENT
- [ ] Carga masiva de 500+ libros
- [ ] Verificar app Google OAuth (publicar en Google Console)
- [ ] Redirects URLs antiguas WordPress → nuevas (SEO)

### Corto plazo
- [ ] Carrito: checkout múltiple (pagar varios libros en una transacción)
- [ ] Email transaccional: confirmación de compra/arriendo al comprador y vendedor
- [ ] Tracking de envíos (cuando Chilexpress funcione)
- [ ] Reviews/valoraciones entre usuarios
- [ ] Liberación garantía arriendos (flujo devolución)
- [ ] Mejorar admin panel (eliminar basura, mejor UX)

### Mediano plazo
- [ ] OAuth Facebook / Instagram
- [ ] PWA (instalable en celular)
- [ ] Sistema de recomendaciones
- [ ] Cápsulas LinkedIn
- [ ] Dominio personalizado Supabase (OAuth muestre tuslibros.cl)
- [ ] Google Ads slots activos

---

## Datos del marketplace
- 500+ libros listos para cargar
- 150+ vendedores históricos
- 5+ usuarios reales ya registrados
- Split payment verificado en producción ($20 comisión, $192 vendedor)
- Emails funcionando via Resend (noreply@tuslibros.cl)
- Stack: Next.js 14, Supabase, MercadoPago, Chilexpress, Mapbox, Resend
