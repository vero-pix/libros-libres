# Prompt para Claude Code — Reencuadre de las vías de compra

**Objetivo:** dejar de presentar la vía con comisión como la opción menor, sin quitarle protagonismo a la vía directa gratuita.
**Alcance:** solo copy en archivos MDX. Cero cambios de lógica.
**Impacto esperado:** el visitante que hoy elige "directo por WhatsApp" por descarte, elige con información completa.

---

## Contexto

TusLibros ofrece tres vías: contacto directo por WhatsApp (sin comisión), pago con MercadoPago (con comisión) y despacho por courier Shipit (con comisión). La estrategia de estos dos meses es construir presencia antes que cobrar, y **la vía gratuita se mantiene como opción de primera clase**. Esto no se toca.

El problema es otro: el copy actual describe la vía pagada como *"si prefieres no coordinar nada"* y a la directa como *"mi favorito"*. Presenta lo pagado como la opción de quien no quiere esforzarse, cuando en realidad resuelve dos cosas que la vía directa no puede: **comprarle a alguien de otra región** y **tener devolución si algo sale mal**.

Además, dos beneficios reales están escondidos en páginas a las que se llega después de decidir:

- La **devolución en 7 días** solo existe si se pagó con MercadoPago. Está en `/devoluciones`, no donde se elige.
- El **courier retira en el domicilio del vendedor y el vendedor no le paga nada** (se factura a TusLibros a fin de mes). Está en `/como-despachar`, página que se ve *después* de vender.

Y el porcentaje de comisión **no está publicado en ninguna parte del sitio**.

---

## Archivos a modificar

Archivos MDX en `/content` correspondientes a:

- `/como-funciona`
- `/faq`

Renderizados vía `next-mdx-remote/rsc`.

---

## Cambios solicitados

### 1. `/como-funciona` — reencuadrar las dos vías

**Mantener** la compra directa en primer lugar y mantener el tono personal de Vero.

**Cambiar** el subtítulo de "Compra con pago seguro". Hoy dice:

> "Si prefieres no coordinar nada, pagas con MercadoPago desde la publicación y listo. Acá sí cobramos una comisión chica, porque la pasarela y el despacho cuestan. Si no quieres comisión, usa WhatsApp."

Reemplazar por un texto que comunique lo que la vía directa no puede dar, sin descalificarla. Debe cubrir:

- Sirve cuando el libro está en otra región o comuna lejana
- Incluye **devolución dentro de 7 días** si el libro llega dañado, equivocado o en peor estado que el descrito
- El dinero queda retenido hasta que se confirma la entrega
- La comisión es el costo de la pasarela y el despacho, y **decir el porcentaje**

Sugerencia de encuadre para el bloque de compra directa, para que la elección quede clara sin quitarle preferencia:

> "Ideal si el libro está cerca tuyo."

Y para el bloque con MercadoPago:

> "Ideal si el libro está en otra ciudad, o si quieres respaldo."

### 2. `/como-funciona` — sección "Para vendedores"

Agregar el beneficio del despacho, hoy ausente de esta página:

- Si la venta se paga con MercadoPago, **el courier pasa a buscar el paquete a tu casa**
- **No le pagas nada al courier**: el envío se factura a TusLibros
- Tienes 2 días hábiles para dejarlo listo

### 3. `/como-funciona` — bloque "Las reglas de la casa"

Mantener las cuatro reglas actuales y agregar una quinta:

- ✅ Devolución en 7 días en compras con MercadoPago

### 4. Publicar el porcentaje de comisión

Los valores están en `lib/commissions.ts`: **8% usuario particular · 5% librero · 3% librería**, sobre el precio del libro.

Agregar en `/como-funciona` (bloque de pago seguro) y en la pregunta del FAQ *"¿Cuándo se aplican comisiones?"*.

**Antes de escribir el número, verificar en `lib/commissions.ts` que los tres valores y sus tramos siguen vigentes.** No copiar de este documento.

### 5. `/faq` — dos ajustes

En *"¿Cuánto cuesta comprar?"*, agregar que si se paga con MercadoPago hay derecho a devolución en 7 días, con enlace a `/devoluciones`.

En *"¿Cuándo se aplican comisiones?"*, agregar el porcentaje y mantener intacta la frase de que coordinar por WhatsApp no cuesta nada.

### 6. Unificar el correo de contacto

Hoy conviven `hola@tuslibros.cl` (FAQ, devoluciones) y `vero@tuslibros.cl` (footer). Dejar uno solo en todo el copy.
**Preguntar a Vero cuál antes de cambiar.** No decidirlo por criterio propio.

### 7. Neutralizar `MODELO-NEGOCIO.md`

Ese archivo está congelado en abril: describe el arriendo como vivo (se descontinuó el 24 de julio) y la comisión como si fuera sobre logística (es sobre el precio del libro). Ya contaminó un plan completo.

Agregar al inicio del archivo un encabezado que diga que es un documento histórico, con su fecha, y que la fuente vigente es `lib/commissions.ts` para comisiones y `KB-tuslibros-fase0.md` para el resto. No reescribir su contenido.

Commitear junto con el cambio de copy: son archivos de documentación, no afectan el build.

---

## Restricciones

- **No tocar** homepage, checkout ni flujos de MercadoPago.
- **No cambiar** lógica, componentes ni estilos. Solo texto en MDX.
- **No eliminar ni degradar** la vía directa sin comisión. Sigue siendo primera y sigue siendo gratis.
- **No inventar** cifras, plazos ni coberturas. Todo dato debe salir del código o de una página ya publicada.
- Español de Chile, tú/usted. **Nunca voseo.** "Publica" no "Publicá", "tienes" no "tenés".
- Mantener la voz en primera persona de Vero donde ya existe.
- Deploy enfocado: solo este cambio.

---

## Validación

1. `npm run build` sin errores.
2. Revisar `/como-funciona` y `/faq` renderizadas: que el porcentaje aparezca y coincida con `lib/commissions.ts`.
3. Verificar que ningún enlace interno quedó roto.
4. Confirmar que la vía directa sigue apareciendo primera y descrita como gratuita.

---

## Orden de ejecución

1. Leer `lib/commissions.ts` y confirmar valores vigentes.
2. Preguntar a Vero qué correo de contacto queda.
3. Editar `/como-funciona`.
4. Editar `/faq`.
5. Marcar `MODELO-NEGOCIO.md` como histórico.
6. Build y revisión visual.
