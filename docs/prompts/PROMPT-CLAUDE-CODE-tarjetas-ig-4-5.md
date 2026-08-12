# Prompt para Claude Code — Tarjetas de Instagram en 4:5

**Problema:** las tarjetas de contenido salen mutiladas en la grilla del perfil de Instagram. El wordmark aparece como "ibros.cl" en todas las miniaturas.

**Causa:** en enero de 2026 Instagram cambió la grilla del perfil a formato **3:4 vertical**. Nuestras tarjetas son 1080×1080 cuadradas, así que la grilla las recorta por los lados. El wordmark está abajo a la izquierda y queda fuera del recorte.

**Verificado** en el perfil real: en la ficha abierta el wordmark se lee completo; en la grilla, cortado. Doce miniaturas afectadas.

---

## 0 · Antes de tocar nada

Hay dos generadores y no está claro cuál produjo lo que está publicado:

- `scripts/content-cards/` — genera tarjetas SVG→PNG (`brand.ts`, `templates.ts`, `render.ts`, `generate.mjs`)
- `scripts/generar-post-social.mjs` — genera `social/metricool-batch.csv`, cuyo campo `Image` apunta a portadas crudas en Supabase Storage, no a tarjetas

Los posts publicados **son tarjetas**, no portadas crudas. Averigua cuál pipeline las produjo y déjalo anotado, porque si el CSV que se carga a Metricool apunta a portadas crudas, arreglar las tarjetas no cambia nada de lo que se publica.

---

## 1 · Lienzo 4:5

`brand.ts` tiene `CANVAS = 1080`, un solo valor para ancho y alto. Separarlo en ancho y alto y dejar **1080×1350**.

Revisar `render.ts`, que usa `fitTo: { mode: "width", value: CANVAS }` — confirmar que con lienzo no cuadrado el alto sale correcto y no deformado.

Revisar también `novedades.standalone.mjs`, que ya usa 1080×1920 para historias. Ese formato está bien y no se toca.

## 2 · Reacomodar la plantilla

`templates.ts` está pensado para cuadrado: portada a la izquierda, texto a la derecha. Eso deja casi la mitad del cuadro vacío y en la grilla se lee como espacio en blanco.

En vertical: **portada arriba ocupando el ancho disponible, texto abajo**. La portada debe ser el elemento dominante — hoy es una miniatura al costado de un bloque de texto.

## 3 · Zona segura

Ningún elemento crítico —wordmark, título, kicker— dentro del **12% de cada borde lateral**. Ahí es donde recorta la grilla 3:4.

Deja el margen documentado como constante en `brand.ts`, no como número suelto en la plantilla.

## 4 · Sacar el precio de la imagen

El precio se elimina de la tarjeta y pasa al texto del post.

Motivo, no cosmético: una imagen con precio se lee como aviso. Instagram premia guardados y compartidos, y nadie guarda un aviso. Los competidores del rubro que sí funcionan —CIM Libros, 13.400 seguidores— no ponen precio sobre la foto.

Verificar que el precio siga apareciendo en el caption que genera el CSV.

## 5 · Verificación

1. Generar una tarjeta de prueba y confirmar que mide 1080×1350.
2. Simular el recorte 3:4 sobre esa tarjeta —recortar los lados dejando una proporción 3:4 centrada— y confirmar que el wordmark y el título sobreviven enteros.
3. Regenerar el lote y comparar una tarjeta nueva contra una publicada antes de cargar nada a Metricool.

---

## Restricciones

- No tocar el sitio: esto es solo `scripts/`.
- Mantener paleta y tipografías actuales. El diseño de la tarjeta funciona; el problema es el formato y la jerarquía, no la identidad.
- Español de Chile en comentarios y commits. Nunca voseo.
- Commit enfocado.

---

## Fuera de alcance, pero anotado

El problema mayor no se arregla con código: **las portadas son fotos de celular de los vendedores** — el libro sobre una mesa, en ángulo, con el mueble entrando en cuadro. En la ficha del sitio eso es correcto y honesto. Ampliado sobre una tarjeta diseñada, el contraste entre la tipografía cuidada y la foto improvisada es lo que se ve mal.

Eso se resuelve fotografiando, no programando.
