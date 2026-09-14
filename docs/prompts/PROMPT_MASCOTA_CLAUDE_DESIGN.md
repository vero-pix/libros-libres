# Prompt para Claude Design — la mascota de tuslibros.cl

Pégalo tal cual. Abajo van las restricciones que importan y dónde va a vivir.

---

## El prompt

Necesito diseñar la mascota de **tuslibros.cl**, un marketplace chileno de
libros usados entre personas. No es una librería online ni una cadena: es gente
que vende los libros que ya leyó a gente que los anda buscando. El lema es
"Cada estantería es una librería".

Quiero un **robot simpático, con identidad chilena**, que acompañe al usuario en
los momentos en que el sitio no tiene nada que darle: cuando una búsqueda no
encuentra resultados, cuando una página no existe, cuando algo falla, cuando
está cargando. Un personaje que hace más llevadera una mala noticia.

**Cómo tiene que verse:**

- Un robot de cuerpo simple y cara amable: pantalla o visor por rostro, ojos
  luminosos, expresión cálida. Proporción de muñeco, no de máquina industrial.
- **Lleva una chupalla** —sombrero chileno de paja trenzada, ala ancha, plana—
  con una cinta tricolor. Esto no es un adorno: el sitio ya le pone una chupalla
  a su logo cada septiembre, entre el 8 y el 20, y la mascota tiene que
  pertenecer a ese mismo mundo.
- **Lleva una manta chilena** sobre los hombros: tejido a rayas horizontales en
  rojo, azul marino y crudo, con flecos en el borde. Como un poncho de fonda,
  no como una capa de superhéroe.
- En vez de sostener un diario, sostiene **un libro usado**: gastado en los
  cantos, con el lomo vivido. Que se note que ese libro pasó por otras manos.

**El mundo visual del sitio, que tiene que respetar:**

- Fondo crema de papel (#F4F1EA y vecinos), tinta azul oscura para los títulos,
  un dorado mostaza de acento, verde para lo que confirma. **Nada de negro
  puro.**
- Tipografía serif para títulos, sans para el cuerpo.
- La estética es de papel y libro antiguo: tapas gastadas, fotos con el fondo
  desordenado a propósito, imperfección como prueba de autenticidad.

Por eso te pido algo específico: **que el robot no se vea de plástico
brillante**. Nada de reflejos duros ni acabado de juguete recién sacado de la
caja. Preferiría una superficie mate, con textura, que converse con el papel y
la tela de alrededor. Un robot que se sienta hecho a mano, o que lleve tiempo
acompañando a alguien.

**Dame el personaje en cinco estados**, que son los momentos donde va a vivir:

1. **Saludando** — para la pantalla de bienvenida o de carga. Contento, tranquilo.
2. **Leyendo** — absorto en el libro. Para momentos de espera.
3. **Sin encontrar nada** — se encoge de hombros, mira la estantería vacía. Para
   cuando la búsqueda no da resultados. Que dé pena simpática, no frustración.
4. **Confundido** — algo se rompió. Para la pantalla de error. Que se vea que él
   también está sorprendido, no que es culpa del usuario.
5. **Celebrando** — para cuando una compra sale bien.

**Entrégame de cada uno:**

- El personaje en fondo crema y en negativo.
- Cómo se ve reducido a 64px de alto, que es el tamaño más chico donde lo
  usaríamos.
- Una línea explicando qué decidiste y por qué.

Y además: **una versión del personaje sin chupalla y sin manta**, para el resto
del año. La chupalla y la manta son de septiembre; el robot tiene que seguir
siendo reconocible cuando se las saca.

---

## Restricciones que no son opinión

1. **No puede parecerse a la mascota de Movistar.** La referencia que dio origen
   a esta idea es el robot de Movistar (robot blanco, visor oscuro, ojos azules,
   capa roja y azul, sombrero negro de ala ancha). Esa mascota es de ellos y
   está registrada. El nuestro tiene que ser distinto en silueta, paleta y
   carácter: chupalla de paja clara, no sombrero negro; manta tejida, no capa;
   paleta de papel y tierra, no azul corporativo.

2. **Tiene que funcionar en un solo color y en chico.** Va a aparecer en correos
   —donde Apple Mail destroza todo lo complejo— y en pantallas de error. Si se
   deshace al achicarlo o al quitarle el color, no sirve.

3. **Los dos temas.** El sitio se ve en claro y en oscuro. El personaje tiene que
   leerse en los dos: ojo con un robot blanco sobre fondo claro.

4. **La chupalla tiene que poder quitarse y ponerse.** El sitio la pone y la saca
   solo, por fecha (`lib/fiestasPatrias.ts`, del 8 al 20 de septiembre). Si la
   chupalla está fundida con la cabeza, no se puede.

---

## Dónde va a vivir

Estas pantallas ya existen y hoy están vacías o solo con texto:

- **El estado sin resultados del buscador** (`app/(main)/search/page.tsx`) — el
  "Todavía no lo tenemos". Es el lugar donde más rinde: es el momento en que
  alguien se iba a ir con las manos vacías.
- **404, error y carga** — las tres pantallas que se agregaron el 12-09-2026.
- **La landing de un autor sin stock** (`app/(main)/autor/[slug]/page.tsx`).
- Eventualmente, los correos.

---

## Dos cosas para acordarse

- **No generarlo en Canva.** Canva sirve para editar y ajustar lo que ya existe,
  no para crear desde cero: lo que saca son diseños genéricos.
- El logo del sitio también está pendiente de rediseño
  (`docs/prompts/PROMPT_LOGO_CLAUDE_DESIGN.md`). **Conviene encargar los dos
  juntos**, para que la mascota herede la tipografía y los colores que se elijan
  para la marca, en vez de quedar como un personaje pegado al lado de un logo
  que no conversa con él.

---

_Escrito el 14-09-2026. La idea salió de una foto de Vero con chupalla y manta
en un almuerzo dieciochero, y de la mascota de Movistar como referencia de
formato — no de estilo._
