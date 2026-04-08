# PROMPT PARA CLAUDE CODE — Overhaul de contenido UX
**Proyecto:** Libros Libres (tuslibros.cl)
**Fecha:** 7 abril 2026
**Contexto:** Un usuario real reportó que no entiende qué son los planes ni cómo le benefician. El análisis revela que FAQ y "Cómo funciona" están desactualizados respecto a features ya en producción (MercadoPago, arriendos, courier, planes). Hay contradicción entre páginas que dicen "sin comisiones" y la página de planes que cobra 3-10%.

---

## DECISIÓN DE NEGOCIO REQUERIDA ANTES DE IMPLEMENTAR

> **IMPORTANTE:** CONTEXT.md define el modelo como "fee fijo $1.500 al comprador, sin comisiones al vendedor". La página /planes en producción muestra comisiones del 3-10% al vendedor + suscripciones mensuales ($9.990 y $29.990). Asumo que /planes refleja la decisión vigente. Si no es así, Verónica debe indicar qué modelo es el correcto antes de implementar.

---

## TAREA 1: Reescribir intro de /planes con narrativa clara

**Archivo:** `app/(main)/planes/page.tsx`

**Problema:** El usuario no entiende para qué sirven los planes ni la diferencia entre publicar gratis y pagar. El intro actual intenta explicarlo pero falla porque no contrasta los dos modos de forma visual ni concreta.

**Implementación:** Reemplazar el bloque de texto introductorio por una sección con dos columnas/cards que contrasten visualmente los dos modos:

```
MODO LIBRE (columna izquierda):
- Título: "Venta directa"
- Subtítulo: "Tú controlas todo"
- Puntos: Publicas gratis / Te contactan por WhatsApp / Coordinan entrega entre ustedes / Sin comisiones, sin intermediarios
- Ideal para: "Vendedores ocasionales que prefieren trato directo"
- CTA: "Publicar gratis"

MODO PRO (columna derecha):  
- Título: "Venta protegida"
- Subtítulo: "Nosotros nos encargamos"
- Puntos: Pago seguro con MercadoPago / Despacho con Chilexpress o Rappi / Protección al comprador / Comisión solo cuando vendes
- Ideal para: "Vendedores frecuentes que quieren vender sin complicaciones"
- CTA: "Ver planes Pro"
```

Debajo de este comparador, mantener los 3 planes actuales (Libre, Librero, Librería) con su pricing y features.

**Estilo:** Usar las clases existentes del proyecto (bg-cream, text-ink, border-cream-dark, brand-600, font-display para títulos). Cards con bg-white, rounded-xl, shadow-sm. Responsive: stack vertical en mobile, side-by-side en sm+.

**Idioma:** Español chileno, tú/usted, jamás voseo.

---

## TAREA 2: Actualizar FAQ con secciones faltantes

**Archivo:** `app/(main)/faq/page.tsx`

**Problema:** Las FAQ no mencionan planes, comisiones, MercadoPago ni arriendos. Un usuario que llega a FAQ buscando info sobre planes no encuentra nada.

**Implementación:** Agregar dos nuevas secciones al array `faqSections` DESPUÉS de "Para vendedores":

### Sección nueva: "Planes y comisiones"
```
Q: ¿Qué son los planes?
A: Los planes definen las herramientas que usas para vender. Con el plan Libre publicas gratis y coordinas todo por WhatsApp, sin comisiones ni costo mensual. Los planes Librero y Librería agregan pago seguro con MercadoPago, despacho con courier, y comisiones reducidas a cambio de una suscripción mensual.

Q: ¿Cuándo me conviene subir de plan?
A: Si vendes más de 5 libros al mes usando MercadoPago, el plan Librero ($9.990/mes) te ahorra dinero por la diferencia de comisiones (5% vs 8%). Si eres librería o vendes volumen alto, el plan Librería ($29.990/mes) reduce la comisión al 3% y agrega carga masiva por Excel.

Q: ¿Puedo vender sin pagar comisión?
A: Sí. Con el plan Libre puedes publicar y coordinar ventas directamente por WhatsApp sin ningún costo. La comisión solo aplica cuando usas nuestro sistema de pago integrado (MercadoPago).

Q: ¿Cómo se cobran las comisiones?
A: Se descuentan automáticamente del monto de cada venta antes de transferir a tu cuenta de MercadoPago. No hay cobros sorpresa ni costos ocultos.

Q: ¿Puedo cambiar de plan?
A: Sí, puedes subir o bajar de plan en cualquier momento desde tu perfil. El cambio aplica desde el siguiente período.
```

### Sección nueva: "Arriendos de libros"
```
Q: ¿Cómo funciona el arriendo?
A: El vendedor activa la opción de arriendo al publicar. El comprador paga el arriendo (por 7, 14 o 30 días) más una garantía reembolsable. Al devolver el libro en buen estado, recupera la garantía.

Q: ¿Cuánto cuesta arrendar un libro?
A: El precio lo fija el vendedor. Típicamente es una fracción del precio de venta. Ejemplo: un libro de $12.000 puede arrendarse por $3.000 + garantía reembolsable.

Q: ¿Qué pasa si no devuelvo el libro a tiempo?
A: Si no devuelves dentro del plazo, se retiene la garantía como compensación al vendedor.

Q: ¿La garantía es reembolsable?
A: Sí. Si devuelves el libro dentro del plazo y en buen estado, tu garantía se devuelve completa a tu cuenta de MercadoPago.
```

### Actualizar respuestas existentes que contradicen /planes:

1. Pregunta "¿Cuánto cuesta comprar?" — cambiar de "Libros Libres no cobra comisión" a:
   "En ventas directas por WhatsApp no hay comisión. Si compras con MercadoPago, el vendedor paga una comisión según su plan (entre 3% y 8%). El precio que ves es el precio que pagas — la comisión la asume el vendedor, no tú."

2. Pregunta "¿Cómo compro un libro?" — agregar paso alternativo:
   Después del paso 3 (WhatsApp), agregar: "También puedes comprar directamente con MercadoPago desde la publicación del libro, con pago seguro y opción de despacho a domicilio."

---

## TAREA 3: Expandir "Cómo funciona" con los 3 flujos reales

**Archivo:** `app/(main)/como-funciona/page.tsx`

**Problema:** Solo describe el flujo WhatsApp (P2P). No menciona MercadoPago, courier ni arriendos — features que ya están en la homepage.

**Implementación:** Reestructurar la página en 3 flujos, manteniendo el layout visual actual (cards numeradas con íconos):

### Sección 1: "Compra directa" (renombrar "Para compradores")
Mantener los 3 pasos actuales. Agregar una nota debajo: "Este es el modo más simple. Tú y el vendedor coordinan todo por WhatsApp."

### Sección 2 (NUEVA): "Compra con pago seguro"
```
Paso 1: Encuentra tu libro — Busca en el mapa o en la tienda por categoría, precio o cercanía.
Paso 2: Paga con MercadoPago — Compra directo desde la publicación. Tu dinero queda protegido.
Paso 3: Elige el despacho — Chilexpress (1-3 días, $2.900), Rappi (mismo día, $4.500), o retiro en persona.
Paso 4: Recibe y confirma — El vendedor recibe su pago automáticamente al confirmar la entrega.
```

### Sección 3 (NUEVA): "Arriendo de libros"
```
Paso 1: Busca libros para arriendo — Filtra por modalidad "Préstamo" en la tienda.
Paso 2: Elige plazo y paga — 7, 14 o 30 días. Pagas arriendo + garantía reembolsable con MercadoPago.
Paso 3: Lee y disfruta — Recibe el libro por courier o retíralo en persona.
Paso 4: Devuelve y recupera tu garantía — Devuelves en buen estado, tu garantía vuelve a tu cuenta.
```

### Actualizar sección "Para vendedores"
Mantener los 3 pasos actuales de publicación. Agregar nota: "Una vez publicado, tus compradores pueden contactarte por WhatsApp o comprar directamente con MercadoPago."

### Actualizar sección "Beneficios"
Cambiar de 3 beneficios a 5:
```
- Publicar siempre es gratis
- Sin comisiones en ventas directas (WhatsApp)
- Pago seguro con MercadoPago
- Despacho a domicilio con Chilexpress o Rappi
- Arriendo de libros con garantía reembolsable
```

---

## TAREA 4: Agregar link a planes desde FAQ

**Archivo:** `app/(main)/faq/page.tsx`

Al final de la página, antes del newsletter, agregar un CTA similar al que tiene "Cómo funciona":

```tsx
<div className="text-center mt-10">
  <p className="text-ink-muted mb-2">¿Quieres vender más?</p>
  <Link href="/planes" className="text-brand-600 font-semibold hover:underline text-lg">
    Conoce nuestros planes para vendedores &rarr;
  </Link>
</div>
```

---

## RESTRICCIONES GLOBALES

1. **Idioma:** Español chileno. Tú/usted, JAMÁS voseo. "Crea" no "Creá", "Revisa" no "Revisá", "tienes" no "tenés".
2. **Estilo visual:** Mantener estética editorial actual — Playfair Display para títulos, DM Sans para body, paleta ink/cream/brand-600.
3. **Componentes:** Server Components (no necesitan interactividad). No agregar "use client" a menos que sea necesario.
4. **Imports:** Usar `import Link from "next/link"` y `import Image from "next/image"` según convenciones existentes.
5. **No tocar:** Homepage, página de listings, flujo de publicación, ni checkout. Solo las 3 páginas de contenido.

---

## ORDEN DE EJECUCIÓN SUGERIDO

1. FAQ (mayor impacto inmediato — el usuario explícitamente dijo que buscó ahí y no encontró)
2. Planes (resolver la confusión central sobre qué son y para qué sirven)
3. Cómo funciona (alinear con realidad del producto)
4. Link FAQ → Planes (30 segundos, alto ROI)

---

## VALIDACIÓN POST-IMPLEMENTACIÓN

Después de implementar, verificar en tuslibros.cl que:
- [ ] FAQ muestra las 5 secciones (Compradores, Vendedores, Planes y comisiones, Arriendos, Cuenta y perfil)
- [ ] /planes tiene el comparador visual Modo Libre vs Modo Pro arriba de los 3 planes
- [ ] "Cómo funciona" muestra 3 flujos de compra + vendedores + 5 beneficios
- [ ] FAQ tiene link a /planes al final
- [ ] No hay textos que digan "sin comisiones" sin aclarar que aplica a modo WhatsApp directo
- [ ] Todo en español chileno, sin voseo
