# tuslibros.cl — Modelo de Negocio & Flujos

Última actualización: 3 abril 2026

---

## 1. VISIÓN

**"El Uber de los libros"** — Cada estantería es una librería. La cercanía es la ventaja.

El diferenciador no es vender libros online (eso ya existe). Es que el libro que necesitas **está a 500 metros** y puedes tenerlo en 30 minutos. O arrendarlo por 2 semanas y devolverlo caminando.

---

## 2. MODALIDADES

### 2.1 VENTA
El vendedor transfiere la propiedad del libro al comprador.

```
Comprador paga → MercadoPago Split → Vendedor recibe su parte
                                   → tuslibros.cl recibe comisión
                                   → Courier recibe costo envío
```

### 2.2 PRÉSTAMO / ARRIENDO
El dueño presta el libro por un período definido. El libro vuelve.

```
Arrendatario paga arriendo → MercadoPago Split → Dueño recibe su parte
                                               → tuslibros.cl recibe comisión

Entrega: se priorizan opciones cercanas (el espíritu Uber)
Devolución: misma lógica inversa
```

**Reglas del préstamo:**
- **Duración**: 7, 14 o 30 días (elige el arrendatario)
- **Precio**: lo define el dueño (precio por período, ej: $3.000/14 días)
- **Garantía**: depósito reembolsable (ej: 50% del valor del libro) retenido en MP
- **Extensión**: el arrendatario puede extender pagando otro período
- **Devolución tardía**: se cobra del depósito de garantía
- **No devolución**: se libera la garantía al dueño + libro se marca como "vendido"

**Formas de entrega/devolución (elige el usuario):**
1. **Encuentro en persona** — $0, el más "Uber". GPS muestra punto medio
2. **Retiro en punto** — el dueño deja en un punto convenido (café, librería aliada)
3. **Despacho courier** — Chilexpress/Rappi (costo del arrendatario)

---

## 3. SPLIT PAYMENT — FLUJO DE DINERO

### Implementación con MercadoPago Marketplace

Cada vendedor/dueño conecta su cuenta de MercadoPago vía OAuth.
Al momento del pago, MercadoPago divide automáticamente.

### 3.1 Flujo VENTA

```
COMPRADOR paga $25.000 (libro) + $2.900 (envío) + comisión
                    │
                    ▼
            ┌──────────────┐
            │  MERCADOPAGO  │
            │  Split Payment│
            └──────┬───────┘
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
      VENDEDOR  tuslibros  COURIER
      $25.000   comisión   $2.900
      (su libro) (fee)    (envío)
```

### 3.2 Flujo ARRIENDO

```
ARRENDATARIO paga $3.000 (arriendo 14 días) + $5.000 (garantía) + comisión
                    │
                    ▼
            ┌──────────────┐
            │  MERCADOPAGO  │
            │  Split Payment│
            └──────┬───────┘
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
       DUEÑO   tuslibros  GARANTÍA
       $3.000  comisión   $5.000
       (arriendo) (fee)  (retenida)
                           │
                    Al devolver libro:
                    → $5.000 vuelve al arrendatario
                    
                    Si no devuelve:
                    → $5.000 va al dueño
```

---

## 4. PLANES DE COMISIÓN

### Plan Libre (default)
- **Comisión por venta**: 8% del precio del libro
- **Comisión por arriendo**: 10% del precio del arriendo
- **Publicar**: siempre gratis
- **Límite**: ilimitado
- Para usuarios casuales que venden/arriendan pocos libros

### Plan Librero ($9.990/mes)
- **Comisión por venta**: 5%
- **Comisión por arriendo**: 7%
- **Extras**: badge "Librero verificado", prioridad en búsqueda, estadísticas avanzadas
- Para vendedores frecuentes (>10 libros/mes)

### Plan Librería ($29.990/mes)
- **Comisión por venta**: 3%
- **Comisión por arriendo**: 5%
- **Extras**: todo del Plan Librero + carga masiva Excel, API de inventario, tienda personalizada con URL propia
- Para librerías de segunda mano, ferias del libro, coleccionistas grandes

### Descuentos por volumen (adicional al plan)
| Ventas/mes | Descuento sobre comisión |
|---|---|
| 1-10 | 0% |
| 11-30 | -10% |
| 31-50 | -20% |
| 51+ | -30% |

*Ejemplo: Plan Libre con 35 ventas/mes → comisión efectiva = 8% × 0.80 = 6.4%*

---

## 5. LA EXPERIENCIA "UBER" — CERCANÍA PRIMERO

### Principio: El libro más cercano es el mejor resultado

**Búsqueda por defecto**: ordenar por cercanía (GPS del usuario), no por fecha.

**Vista principal**: MAPA con libros cercanos, no lista.

**Flujo del comprador/arrendatario:**
1. Abre tuslibros.cl → ve libros cercanos en el mapa
2. Filtra por categoría, precio, modalidad (venta/arriendo)
3. Click en libro → ve ficha + distancia + tienda del vendedor
4. Elige modalidad:
   - **Comprar** → checkout con envío
   - **Arrendar** → elige período + forma de entrega
   - **Encuentro** → coordina vía WhatsApp (gratis, sin comisión de envío)

**Flujo del vendedor/dueño:**
1. Publica libro (ISBN o manual)
2. Elige: venta, arriendo, o ambos
3. Define precio venta y/o precio arriendo por período
4. Su ubicación aparece en el mapa

### Indicadores de cercanía en la UI
- **< 1 km**: 🟢 "A pasos" — encuentro en persona recomendado
- **1-5 km**: 🟡 "Cerca" — bici/auto o courier express
- **5-20 km**: 🟠 "En tu ciudad" — courier estándar
- **> 20 km**: 🔴 "Envío nacional" — solo courier

---

## 6. TIENDA DEL VENDEDOR

Cada vendedor tiene su "mini librería" en `/vendedor/[id]`:

- **Perfil**: nombre, ciudad, miembro desde, avatar
- **Stats**: libros publicados, arriendos activos, ventas completadas, rating
- **Catálogo**: grid de libros disponibles (venta y arriendo)
- **Reseñas**: de compradores y arrendatarios
- **Badge de plan**: "Librero verificado" o "Librería"
- **Distancia**: "A 1.2 km de ti"

Desde cada libro se accede a la tienda del vendedor.
Desde la tienda se ven todos los libros del vendedor.

---

## 7. CICLO DE VIDA DEL ARRIENDO

```
1. PUBLICADO          Dueño publica libro con opción arriendo
   │                  Define: precio/período, garantía
   ▼
2. SOLICITADO         Arrendatario solicita arriendo
   │                  Elige: período (7/14/30 días) + forma entrega
   ▼
3. PAGO               Arrendatario paga: arriendo + garantía + comisión
   │                  Split: dueño recibe arriendo, tuslibros comisión, garantía retenida
   ▼
4. ENTREGA            Según forma elegida:
   │                  - Encuentro en persona (GPS punto medio)
   │                  - Retiro en punto
   │                  - Courier
   ▼
5. EN PRÉSTAMO        Arrendatario tiene el libro
   │                  Contador de días visible en "Mis Arriendos"
   │                  Notificaciones: 3 días antes, 1 día antes, día de devolución
   ▼
6. DEVOLUCIÓN         Misma lógica de entrega inversa
   │                  Dueño confirma recepción en la app
   ▼
7. COMPLETADO         Garantía devuelta al arrendatario
                      Ambos pueden dejar reseña

   EXTENSIÓN          En cualquier momento del paso 5:
   │                  Arrendatario paga otro período
   │                  Se extiende la fecha de devolución
   
   NO DEVOLUCIÓN      Si pasan 7 días de la fecha límite:
                      Garantía se libera al dueño
                      Libro se marca como "vendido" al arrendatario
```

---

## 8. IMPLEMENTACIÓN TÉCNICA (RESUMEN)

### Split Payment MercadoPago
- Requiere: cada vendedor conecta su MP vía OAuth
- Endpoint: `POST /v1/advanced_payments` o Marketplace con `collector_id`
- Documentación: mercadopago.cl/developers → Marketplace → Split de pago

### Base de datos (nuevas tablas/campos)
- `users.mercadopago_user_id` — ID MP del vendedor (OAuth)
- `users.plan` — enum (free/librero/libreria)
- `listings.rental_price` — precio del arriendo por período
- `listings.rental_deposit` — garantía requerida
- `listings.rental_period_days` — duración del arriendo (7/14/30)
- Tabla `rentals` — arriendos activos (arrendatario, dueño, fecha inicio, fecha fin, estado, garantía)
- Tabla `reviews` — reseñas entre usuarios

### Prioridades de desarrollo
1. OAuth MercadoPago para vendedores (split payment)
2. Sistema de arriendos (tabla, flujo, UI)
3. Cercanía como criterio principal de búsqueda
4. Planes de comisión
5. Reseñas
6. Descuentos por volumen

---

## 9. MÉTRICAS CLAVE

- **GMV** (Gross Merchandise Value) — total transado en la plataforma
- **Take rate** — comisión promedio efectiva
- **Arriendos activos** — libros circulando ahora
- **Ratio arriendo/venta** — qué proporción prefiere arrendar vs comprar
- **Distancia promedio** — qué tan "local" son las transacciones
- **Tiempo promedio de arriendo** — cuánto tiempo mantienen los libros
- **Tasa de devolución** — % de arriendos devueltos a tiempo
