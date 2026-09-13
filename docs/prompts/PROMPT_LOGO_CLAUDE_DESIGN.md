# Prompt para Claude Design — logo de tuslibros.cl

Pégalo tal cual en Claude Design. Al final van las restricciones que casi
siempre se olvidan y que son las que hacen que un logo sirva o no.

---

## El prompt

Necesito una identidad para **tuslibros.cl**, un marketplace chileno de libros
usados entre personas. No es una librería online ni una cadena: es gente que
vende los libros que ya leyó a gente que los anda buscando. El lema es "Cada
estantería es una librería".

Lo que quiero es un **isotipo** (la marca gráfica sola, sin el nombre al lado)
que funcione en 32 píxeles y en un solo color.

**Cómo se siente la marca:**
- Cercana y artesanal, no corporativa. Es una persona, no una empresa.
- De libro viejo: papel crema, tinta, lomos gastados. Nada de brillos ni
  degradados tecnológicos.
- Chilena sin ser folclórica. Nada de banderas ni huasos.
- Con algo de humor. La marca habla en primera persona y se ríe de sí misma.

**La paleta actual del sitio:** fondo crema (#FBF7EF y variantes), tinta azul
oscura para los títulos, un dorado/mostaza para los acentos, y verde para lo
que confirma. **Nada de negro puro.** Los títulos van en serif y el cuerpo en
sans.

**Lo que NO quiero:**
- La pila de tres libros genérica. Es lo que tiene todo el mundo.
- Un libro abierto con las páginas en forma de corazón o de pájaro.
- Un búho, unos lentes, una lámpara.
- Degradados, sombras largas, estilo "app de 2015".
- Un símbolo que necesite explicación.

**Tres direcciones que sí me interesan** (dame una propuesta por cada una):
1. **La estantería como ciudad** — lomos de libros que de lejos leen como una
   silueta de casas o de edificios. Es literalmente el lema.
2. **La marca de una inicial** — una letra construida con lomos de libro, tipo
   monograma de sello de biblioteca antigua. Que se vea como un timbre de
   tinta, no como un vector limpio.
3. **El libro que pasa de mano en mano** — dos manos y un libro, reducido a lo
   mínimo, casi un pictograma. Ojo: que no quede religioso.

**Entrégame de cada propuesta:**
- El isotipo solo, en negativo (un color sobre crema) y en positivo.
- Cómo se ve a 32×32 y a 16×16 (favicon real, no una maqueta grande).
- El lockup horizontal con "tuslibros.cl" al lado.
- Una línea diciendo qué decidiste y por qué.

---

## Restricciones que hay que respetar sí o sí

Estas salen de dónde vive el logo hoy, no son gusto:

1. **Tiene que aguantar 32px y 16px.** El favicon actual es
   `public/logo-books.png`. Si el símbolo pierde la forma al achicarse, no
   sirve, por lindo que se vea grande.

2. **Tiene que funcionar en un solo color.** Se usa en correos (donde Apple
   Mail destroza todo lo que sea complejo), en etiquetas de despacho y en las
   tarjetas de `npm run cards`.

3. **Le va un sombrero encima.** Entre el 8 y el 20 de septiembre, el logo del
   navbar lleva una chupalla con cinta tricolor
   (`lib/fiestasPatrias.ts` → `esSemanaDel18()`). O sea: **el borde de arriba
   del isotipo tiene que dejar lugar para que se le cuelgue algo**, y la forma
   tiene que seguir siendo reconocible con el sombrero puesto. Si el logo ya es
   redondo y lleno arriba, la chupalla no calza.

4. **Convive con el logotipo actual**, que es "tuslibros**.cl**" en serif con
   el `.cl` en otro peso, y debajo, en mayúsculas pequeñas y monoespaciadas:
   "LOS QUE YA LEÍSTE, LOS QUE TE FALTAN". Esa bajada se queda.

5. **Fondo crema, nunca blanco puro ni negro puro.**

---

## Dos cosas para acordarse

- **No generar el logo en Canva.** Canva sirve para editar y ajustar lo que ya
  existe, no para crear desde cero: lo que saca son diseños genéricos.
- Cuando haya una propuesta elegida, el archivo final reemplaza
  `public/logo-books.png` y hay que revisar el favicon y las tarjetas.

---

_Generado el 12-09-2026. El pendiente venía del 10-09: "debemos trabajar en el
logo está faito"._
