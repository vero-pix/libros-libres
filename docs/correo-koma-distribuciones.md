# Respuesta a Koma Distribuciones (27-08-2026)

**Contexto:** correo frío de `ventas@komadistribuciones.cl` a `vero@tuslibros.cl`
ofreciendo stock mayorista de manga ($6.600 el tomo sin IVA, mínimo 20 unidades).
No les compramos: la contrapropuesta es que publiquen gratis en tuslibros.cl.

**Para:** ventas@komadistribuciones.cl
**Asunto:** Re: Tu próximo gran éxito en Chile — les propongo algo al revés

---

Hola:

Gracias por escribir. No les voy a comprar stock, pero les tengo una propuesta
que capaz les sirva más.

Soy Verónica, fundadora de tuslibros.cl, un marketplace chileno de libros. Hoy
tenemos 2.115 libros publicados por 117 vendedores en 57 comunas del país, y
salimos primeros en Google en varias búsquedas de compra y venta de libros en
Chile.

Lo que les propongo: publicar su catálogo en tuslibros.cl sin costo. Publicar es
gratis y sin límite de títulos. Solo cobramos 8% sobre el precio del libro cuando
la venta se cierra por la plataforma. Si no venden, no pagan nada.

Un dato que juega a favor: manga y cómics es justo la categoría que hoy tenemos
casi vacía. No van a estar peleando con otros cien vendedores del mismo nicho.

Ahora, leí en su correo que no tienen tienda propia para no competirle a sus
clientes, y no quiero ponerlos en esa posición. Así que hay dos caminos y me
sirve cualquiera de los dos:

1. **Publican ustedes.** Los tomos quedan a la venta a su precio y les llega el
   comprador final directo.

2. **Se lo pasan a sus tiendas.** Les presentamos tuslibros.cl como canal de
   venta online: publican ellas, ustedes siguen siendo solo mayoristas, y de
   paso les dan un argumento más para comprarles ("te consigo dónde vender").

El despacho y lo operativo lo vamos afinando según lo que les acomode: hoy
funcionamos con despacho por courier a todo Chile y también con entrega en persona.

¿Les hace sentido? Respondan por acá o escríbanme al +56 9 9458 3067 y lo vemos.

Verónica Velásquez
tuslibros.cl

---

## Si contestan que sí

- Catálogo grande ⇒ **no va por el importador web** (se corta por timeout sobre
  500 filas). Va con `scripts/bulk-upload-csv.ts`, igual que Casa Emunah.
- Plantilla para pedirles la info: `public/plantilla_carga_masiva.csv`.
- Ojo con las fotos: pedir **una por título**, con el nombre del archivo calzando
  con el Excel.
- Son libros **nuevos**, no usados. Hoy el catálogo ya tiene nuevos (el lote de
  Leonardo), pero el estado "Nuevo · sin uso" sigue pendiente en el ROADMAP.
