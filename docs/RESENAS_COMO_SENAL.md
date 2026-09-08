# Reseñas como señal, no como adorno — documento de norte
**07-09-2026 · Referencia estratégica, no prompt de implementación. Continúa el hilo de Librerías de confianza + reseñas.**

---

## La tesis

Una reseña en tuslibros.cl no es un rating de producto. Es una señal que el sistema usa para curar, destacar y conectar. Amazon usa la reseña para filtrar ruido en un catálogo infinito de productos idénticos. Acá los productos son ejemplares únicos y los vendedores tienen cara: la reseña califica **al vendedor y a la relación de compra**, no al objeto. Ese es el diferencial frente a Amazon y Buscalibre, y es coherente con el resto del producto (mapa, gente real, cercanía).

Regla que ordena todas las decisiones siguientes: **la reseña debe alimentar una acción del sistema.** Si una reseña solo se muestra y no cambia qué se destaca, qué se recomienda o a quién se avisa, es adorno. Se descarta.

---

## Las cuatro capas (en orden de madurez, no de deseo)

### Capa 1 — Reputación del vendedor · YA EN CONSTRUCCIÓN
El `trust_score` y la sección "Librerías de confianza". Hoy pesa ventas pagadas; cuando entren reseñas, suman `reviews_avg × reviews_count`. Es la base sobre la que se apoyan las otras tres. No requiere trabajo nuevo más allá de lo ya diseñado.

### Capa 2 — Curaduría por afinidad (NO por rating)
El núcleo de la visión. No "los libros mejor calificados" —eso es Amazon—, sino "vendedores cuyos compradores se parecen a ti". Si un comprador de filosofía deja buenas reseñas a un vendedor, ese vendedor se vuelve recomendable para el próximo comprador de filosofía. La reseña no ordena libros: **conecta perfiles de comprador con perfiles de vendedor**. Es curaduría real, no un ranking.

### Capa 3 — Vendedor destacado por nicho
No "el mejor vendedor" en abstracto, sino "el vendedor de confianza en historia de Chile", "en literatura infantil", "en Concepción". Reseña + catálogo + geografía permiten destacar por segmento. Doble beneficio: es más útil para el comprador que un top general, y **disuelve el problema de concentración** — Libro de Ocasión domina el score global, pero en nichos específicos destacan otros vendedores. Esfuerzo bajo, retorno alto una vez que hay reseñas.

### Capa 4 — Cerrar el loop de "Se busca"
Ya existen ~150 pedidos de libros fuera de catálogo. Cuando un vendedor con buena reputación publica algo pedido, la reseña le da el peso para que el sistema avise al solicitante con confianza: "un vendedor de confianza publicó lo que buscabas". Convierte la reputación en conversión directa.

---

## La restricción que manda: volumen

Nada de esto funciona sin reseñas, y hoy hay cero (3 órdenes `delivered` en toda la historia). Construir el motor de afinidad (capa 2) con ese volumen es ingeniería sobre el vacío. El orden de construcción es inverso al entusiasmo:

1. **Llenar el tanque.** Campañas de "confirma tu entrega" a órdenes `paid`/`shipped`; Shipit fase 2 confirmando entregas por courier para que `delivered` deje de depender del comprador. Sin esto no hay señal que procesar.
2. **Señal simple (capas 1 y 3).** Reputación de vendedor y destacado por nicho. Casi toda la infraestructura ya existe (`seller_stats`, `trust_score`). Bajo esfuerzo.
3. **Motor de afinidad (capa 2) y loop de Se busca (capa 4).** Solo con cientos de reseñas, no docenas. Es un proyecto en sí mismo, fase posterior. No antes de tener datos que lo justifiquen.

---

## Qué NO hacer

- No construir recomendación por afinidad antes de tener volumen. Es la trampa clásica: sistema sofisticado sin datos que lo alimenten.
- No pedir reseña en el correo de bienvenida (el destinatario no ha comprado; no tiene qué reseñar). En bienvenida, las reseñas se *muestran* como señal de confianza existente, no se piden.
- No tratar la reseña como estrellas decorativas. Si una superficie muestra rating sin usarlo para ordenar, destacar o conectar, sobra.
- No mostrar promedio con menos de 3 reseñas (C5). Bajo ese umbral, "N ventas por la plataforma".

---

## Métrica de que la señal sirve

No "cuántas reseñas hay" (métrica de vanidad), sino:
- Reseñas creadas / órdenes `delivered` de la semana (> 40%): mide si el ciclo produce.
- Clics desde un vendedor destacado por nicho → ficha → checkout: mide si la señal convierte.
- Cuando exista capa 4: solicitudes de "Se busca" cerradas por aviso de vendedor de confianza.
