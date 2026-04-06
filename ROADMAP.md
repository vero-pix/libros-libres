# Libros Libres — Roadmap

Última actualización: 5 abril 2026

---

## Completado

### Fase 1 — MVP
- [x] Scanner ISBN con portada automática
- [x] WhatsApp contacto directo
- [x] Perfil usuario (teléfono + ubicación)
- [x] Clustering pins en mapa
- [x] Navegación completa

### Fase 2 — Rediseño UI
- [x] Tipografía: Playfair Display + DM Sans
- [x] Paleta: ink, cream, brand dorado
- [x] Header de 2 filas (búsqueda + nav)
- [x] Home con grid de libros + sidebar categorías
- [x] Cards editoriales
- [x] Categorías traducidas al español

### Fase 3 — Flujo de pagos
- [x] MercadoPago Checkout Pro
- [x] Split payment marketplace (OAuth vendedor + marketplace_fee)
- [x] Comisiones por plan (Libre 8%, Librero 5%, Librería 3%)
- [x] Webhook IPN con verificación de firma HMAC
- [x] Token refresh automático
- [x] Notificaciones al vendedor

### Fase 4 — Marketplace completo
- [x] Chilexpress cotización real (API cobertura + tarifas)
- [x] Checkout con desglose (libro + envío Chilexpress + fee)
- [x] Sistema de arriendos (7/14/30 días, garantía, método entrega)
- [x] Mis Pedidos, Mis Arriendos, Mis Libros
- [x] Dashboard de ventas (/mis-ventas: stats, órdenes, comisiones)
- [x] Tienda del vendedor (/vendedor/[id])
- [x] Panel admin
- [x] Búsqueda avanzada (precio, condición, modalidad)

### Fase 5 — UX y navegación (5 abril 2026)
- [x] Navbar en layout compartido (eliminados 19 imports)
- [x] Sidebar categorías sticky + drawer mobile
- [x] Autocompletado de búsqueda (API suggestions)
- [x] Login/register rediseñados (panel split claro)
- [x] Footer y secciones sin colores oscuros
- [x] Newsletter funcional (form + API + tabla Supabase)
- [x] Contacto vía WhatsApp (+56994583067)
- [x] Formulario de contacto (guarda en Supabase)
- [x] Ilustración animada mejorada (autores chilenos, comunas Santiago)
- [x] Fix enum listing_status: agregado 'rented'
- [x] Fix Chilexpress URL configurable (test/prod)
- [x] Fix webhook verificación firma MercadoPago
- [x] Fix COLLECTOR_ID validación
- [x] Fix themeColor → viewport export (53 warnings eliminados)

---

## Activación (verificar en Vercel)

- [x] MERCADOPAGO_ACCESS_TOKEN (producción)
- [x] MERCADOPAGO_APP_ID
- [x] MERCADOPAGO_CLIENT_SECRET
- [x] MERCADOPAGO_COLLECTOR_ID (571699910)
- [ ] MERCADOPAGO_WEBHOOK_SECRET (configurar en MP > Webhooks)
- [ ] NEXT_PUBLIC_SITE_URL = https://tuslibros.cl (sin www)
- [x] SUPABASE_SERVICE_ROLE_KEY
- [ ] Webhook URL registrada en MP: https://tuslibros.cl/api/webhooks/mercadopago
- [ ] Ejecutar migraciones Supabase pendientes (rented, newsletter, contact_messages)

---

## Pendiente — Próximos pasos

### Inmediato (esta semana)
- [ ] OAuth social (Google, LinkedIn, Apple) via Supabase Auth
- [ ] Google AdSense / Ads — slots en sidebar y entre contenido
- [ ] Descripción de tienda del vendedor (campo bio en perfil)
- [ ] Normalización de ciudad/comuna (dropdown en vez de texto libre)
- [ ] Imagen OG para redes sociales (/public/og-image.png)
- [ ] Carga masiva de 500+ libros (script o admin panel)

### Corto plazo
- [ ] Email transaccional (Resend): confirmación de compra, arriendo, contacto
- [ ] Reviews/valoraciones entre usuarios
- [ ] Tracking de envíos (integrar Chilexpress API shipping)
- [ ] Liberación de garantía en arriendos (flujo devolución)

### Mediano plazo
- [ ] PWA (instalable en celular)
- [ ] Sistema de recomendaciones
- [ ] Planes de suscripción vendedores (Librero, Librería)
- [ ] Cápsulas LinkedIn (5 posts planificados)

---

## Datos del marketplace

- 500+ libros listos para cargar
- 150+ vendedores históricos de tuslibros.cl
- Dominio: tuslibros.cl (NIC Chile → Vercel)
- Stack: Next.js 14, Supabase, MercadoPago, Chilexpress, Mapbox
