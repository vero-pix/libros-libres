# Libros Libres — Roadmap

Última actualización: 2 abril 2026, 21:00

---

## Completado

### Fase 1 — MVP
- [x] Scanner ISBN con portada automática
- [x] WhatsApp contacto directo
- [x] Perfil usuario (teléfono + ubicación guardados)
- [x] Clustering pins en mapa
- [x] Sistema páginas editables (MDX)
- [x] Navegación completa

### Fase 2 — Rediseño UI (estilo editorial/magazine)
- [x] Tipografía: Playfair Display + DM Sans
- [x] Paleta: ink, cream, brand dorado
- [x] Header de 2 filas (búsqueda + nav ink)
- [x] Home con grid de libros + sidebar categorías
- [x] Cards editoriales (hover scale, sin bordes)
- [x] Mapa movido a /mapa con sidebar (cercanía, autor, categoría)
- [x] Footer con newsletter fondo ink
- [x] Categorías traducidas al español

### Fase 3 — Flujo de pagos
- [x] Tabla `orders` en Supabase
- [x] MercadoPago Checkout Pro integrado
- [x] Checkout con selección de envío (estándar/rápido)
- [x] Webhook IPN para actualizar estado de pago
- [x] Página post-pago (éxito/fallo/pendiente)
- [x] Botón "Comprar" en detalle del libro
- [x] Notificaciones WhatsApp al vendedor

### Fase 4 — Features adicionales
- [x] Mis Pedidos (tabs compras/ventas)
- [x] Búsqueda avanzada (precio, condición, modalidad)
- [x] Open Library como fallback ISBN (Google Books cuota agotada)
- [x] API backfill portadas

### Fase 5 — Landing y lanzamiento
- [x] Hero: "Cada estantería es una librería" + red de nodos + feed simulado
- [x] Sección tech: "Como Uber, pero para libros"
- [x] Voces reales (quotes busca/ofrece)
- [x] Páginas contenido con hero images Unsplash
- [x] Página /historia (case study para LinkedIn)
- [x] OG tags para LinkedIn
- [x] Dominio tuslibros.cl configurado (NIC Chile → Vercel)
- [x] Supabase auth URL actualizada

---

## Pendiente activación

- [ ] MERCADOPAGO_ACCESS_TOKEN en Vercel
- [ ] SUPABASE_SERVICE_ROLE_KEY en Vercel
- [ ] Webhook MercadoPago registrado
- [ ] Imagen og-image.png en /public

---

## Próximos pasos

### Inmediato (esta semana)
- [ ] Cápsulas LinkedIn (5 posts planificados)
- [ ] OAuth Google/Apple
- [ ] Subir foto de portada manual
- [ ] Imagen OG para redes sociales

### Corto plazo
- [ ] API real de couriers (Chilexpress, Rappi, Blue Express)
- [ ] Cotización envío en tiempo real
- [ ] Panel vendedor (ventas, historial, ganancias)
- [ ] Reviews/valoraciones entre usuarios

### Mediano plazo
- [ ] PWA (instalable en celular)
- [ ] Sistema de recomendaciones
- [ ] Programa de fidelización

---

## Métricas
- JS en home: 165KB (sin Mapbox)
- JS en mapa: 162KB (Mapbox lazy-loaded)
- Libros publicados: 5
- Usuarios registrados: 2
- Commits en la sesión: 12
- Archivos creados/modificados: 40+
- Líneas de código: 2,500+
