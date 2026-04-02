# Libros Libres — Roadmap

Última actualización: 2 abril 2026

---

## Completado

### Fase 1 — MVP
- [x] Scanner ISBN con portada automática
- [x] WhatsApp contacto directo
- [x] Perfil usuario (teléfono + ubicación guardados)
- [x] Clustering pins en mapa
- [x] Sistema páginas editables (MDX)
- [x] Navegación completa

### Fase 2 — Rediseño UI (estilo Martfury)
- [x] Header de 2 filas (búsqueda + nav navy)
- [x] Home con grid de libros + sidebar categorías
- [x] Mapa movido a /mapa (lazy-loaded, -450KB JS en home)
- [x] Cards estilo marketplace (cover tall, badge, vendedor)
- [x] Footer con newsletter + links organizados
- [x] Paleta dorada (#d4a017)

### Fase 3 — Flujo de pagos
- [x] Tabla `orders` en Supabase
- [x] MercadoPago Checkout Pro integrado
- [x] Checkout con selección de envío (estándar/rápido)
- [x] Webhook IPN para actualizar estado de pago
- [x] Página post-pago (éxito/fallo/pendiente)
- [x] Botón "Comprar" en detalle del libro

---

## Pendiente activación (requiere acción manual)

- [ ] Ejecutar migration SQL de orders en Supabase
- [ ] Configurar MERCADOPAGO_ACCESS_TOKEN en env
- [ ] Configurar SUPABASE_SERVICE_ROLE_KEY en env
- [ ] Registrar webhook en panel MercadoPago

---

## Próximos pasos

### Corto plazo
- [ ] OAuth Google/Apple
- [ ] Mis pedidos (comprador y vendedor)
- [ ] Notificaciones al vendedor (email o WhatsApp)
- [ ] Búsqueda avanzada (precio, condición, distancia)

### Mediano plazo
- [ ] API real de couriers (Chilexpress, Rappi, Blue Express)
- [ ] Cotización envío en tiempo real según distancia
- [ ] Panel vendedor (ventas, historial, ganancias)
- [ ] Reviews/valoraciones entre usuarios

### Largo plazo
- [ ] App móvil (PWA o React Native)
- [ ] Sistema de recomendaciones
- [ ] Programa de fidelización

---

## Métricas
- Tiempo publicar libro: ~11 segundos
- JS en home: 163KB (antes 609KB con mapa)
- Libros publicados: [actualizar]
- Usuarios registrados: [actualizar]
