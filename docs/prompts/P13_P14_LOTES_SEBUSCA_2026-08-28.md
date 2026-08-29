# P13 y P14 — los doce lotes y el lote «Se busca»

Dos prompts. Se pasan **de a uno**, en orden. P13 primero: los lotes son venta, el «Se busca» es marca.

---

## Antes: lo que cambió con tu instrucción

**Saqué la política.** Fuera de las piezas de «Se busca»: el *Golpe. 11 de septiembre de 1973* de
Ascanio Cavallo (que además venía duplicado) y todo lo que toque Pinochet, dictadura o política
chilena. Y fuera del lote 12: *Un siglo de economía política chilena* de Patricio Meller.

Queda una que decides tú: *La fiesta del rey Acab* de Lafourcade, en el lote de chilenos. Es
novela de 1959 sobre un dictador caribeño inventado, no es Chile ni es Pinochet — pero si la
quieres fuera, sale y entra otra.

**Y sobre "privilegia solo los míos": crucé los 140 pedidos contra tus 198 libros y hay UNO.**

> *El caballero de la armadura oxidada*, de Robert Fisher. Lo pidieron el 27 de agosto y lo tienes
> publicado a $4.000 (`/libro/vero/el-caballero-de-la-armadura-oxidada-026bbd`).

Uno de ciento cuarenta. Eso significa que el «Se busca» **no puede ser contenido de venta**, porque
casi nunca vas a tener el libro. Es contenido de comunidad: gente que comenta, que pide, que te
deja su lista. La venta va por los lotes.

Así que el lote de Instagram queda partido en dos formatos:

- **«Lo encontré» — una pieza.** El caballero de la armadura oxidada. Alguien lo pidió, tú lo
  tienes, se cierra el círculo. Es la mejor demostración posible de para qué sirve `/solicitudes`.
- **«Se busca» — siete piezas.** Libros que no tienes. Piden algo al lector, que es lo que el
  algoritmo premia.

---

# P13 · Los doce lotes

```
Quiero implementar los doce lotes de mi catálogo. El spec ya está armado y versionado en
content/cards/lotes-vero.json: doce lotes, 59 libros, $526.350 sueltos → $304.500 en lote, con
los slugs exactos de cada uno.

Cómo se armaron, para que no lo rehagas: quedaron fuera 55 listings —los 26 Simenon, los
coleccionables, la Biblioteca de Babel, Plutarco, Séneca, el Pascal de 1866 y todo sobre
$15.000—. Ésos se venden enteros y a precio lleno, no van a lote. Los nueve primeros están
agrupados por autor o serie; los tres últimos son cajas sorpresa a $19.990 con libros bajo $9.000.

Una corrección al spec antes de empezar: saca "Un siglo de economía política chilena 1890-1990"
de Patricio Meller del lote 12 y reemplázalo por otro bajo $9.000 de los que quedaron fuera. No
quiero libros de política chilena en los lotes.

Etapa 1 — la vitrina. NO la implementes todavía. Revisa la infraestructura de bundle que ya
existe (app/(main)/checkout/bundle, BundleCheckoutForm.tsx, bundle_id en orders) y muéstrame dos
o tres opciones de cómo se representa un lote en el sitio, con el costo de cada una en archivos
tocados y migraciones. ¿Un listing especial? ¿Una entidad nueva? ¿Una colección con el checkout
de bundle precargado? Elegimos juntos antes de escribir código.

Etapa 2 — cuando aprobemos la opción:
- Los doce lotes publicados, con nombre, gancho y precio cerrado.
- Precio de referencia visible: "$23.760 · sueltos $38.960".
- Los libros de un lote NO se pueden vender sueltos al mismo tiempo. Resuelve eso: o se pausan
  los listings individuales, o el lote los marca como reservados. Dime cómo lo harías.
- Al vender un lote, los cinco listings pasan a completed.
- Verifica que el envío gratis sobre $20.000 se gatille: once de los doce lo superan.
- La comisión del 8% se calcula sobre el precio del lote, no sobre la suma de los sueltos.

Etapa 3 — las piezas. Genera las doce imágenes con la plantilla "lista" de
scripts/content-cards/, que arma grilla de 3 a 6 portadas y ya está en 1080×1350. Precio cerrado
y precio de referencia en la pieza. Solo libros míos, portadas desde books.cover_url.

No publiques nada en redes. Tu entrega es la vitrina, los lotes en la base y los PNG.
```

---

# P14 · El lote «Se busca» + «Lo encontré»

```
Quiero ocho piezas de Instagram a partir de los pedidos abiertos de /solicitudes. El formato lo
propusiste tú y estoy de acuerdo: es el único que le pide algo al lector. Dato que lo respalda:
este mismo formato ya me funcionó en Reddit, "¿Cuál es ese libro agotado que llevas años
buscando?" sacó 17 votos en r/ClubdelecturaChile y 14 con 27 comentarios en r/libros.

Contexto que cambia el encargo: crucé los 140 pedidos abiertos contra mis 198 libros activos y
solo UNO calza — "El caballero de la armadura oxidada" de Robert Fisher, pedido el 27 de agosto,
que tengo a $4.000 en /libro/vero/el-caballero-de-la-armadura-oxidada-026bbd. Así que esto no es
contenido de venta, es de comunidad, y va partido en dos formatos.

PIEZA 1 — "LO ENCONTRÉ". El caballero de la armadura oxidada. Alguien lo pidió y lo tengo. Cierra
el círculo y muestra para qué sirve /solicitudes. Ésta sí lleva link a la ficha, con UTM.

PIEZAS 2 a 8 — "SE BUSCA", libros que no tengo:
  · Libro del desasosiego — Fernando Pessoa
  · Los años de peregrinación del chico sin color — Haruki Murakami
  · El libro de las tierras vírgenes — Rudyard Kipling
  · Yo, el gato — Natsume Sōseki
  · Manos del Sur — Carlo von Mühlenbrock
  · Historia desconocida de los hombres — Robert Charroux
  · Modernidad y ambivalencia — Zygmunt Bauman

REGLAS:
1. Nada de política. Excluí a propósito el "Golpe. 11 de septiembre de 1973" de Ascanio Cavallo y
   cualquier pedido sobre Pinochet, dictadura o política chilena. Si el script vuelve a elegir
   pedidos solo, aplica ese filtro.
2. Deduplicar. Hay pedidos repetidos: "Órdenes del amor / Ordenes delamor" (Hellinger, mismo día)
   y las dos versiones del Golpe. Si salen los dos, quedo en ridículo.
3. Plantilla tipográfica, no ficha. Usa la plantilla "tipografica" de scripts/content-cards/:
   "SE BUSCA" grande sobre crema, título y autor abajo. No necesita foto y rompe la grilla, que
   hoy es una pared de fichas beige idénticas. Respeta SAFE_X.
4. NO escribas las captions. Las tengo escritas y van abajo. Tu entrega son las imágenes.
5. Voz mía: primera persona, chileno, sin lenguaje de marketing. Aplica a cualquier texto que
   pongas dentro de la pieza.

No publiques nada ni entres a Business Suite — eso lo hago yo. Tu entrega son los ocho PNG.
```

---

## Las ocho captions, escritas

Tienes razón en reclamarlas: una sola frase por post es lo que llevamos criticando toda la semana.
Van completas, con la misma estructura que las quince anteriores — algo que solo puedas decir tú
del libro, después el dato, después la pregunta de verdad.

Y ojo con el reparto: **Claude Code hace las imágenes, las captions las escribo yo y las curas tú.**
Si un script las rellena con plantilla, volvemos al problema de siempre.

### 1 · LO ENCONTRÉ — El caballero de la armadura oxidada · Robert Fisher · $4.000

```
Ayer alguien entró a pedir este libro en el sitio. Y resulta que lo tengo yo, ahí
mismo, a cuatro mil pesos. Nunca me había pasado que un pedido se cerrara el mismo
día.

Es un librito flaco de los ochenta, medio de autoayuda, sobre un caballero que se
queda pegado dentro de su propia armadura y no se la puede sacar. Me da un poco de
vergüenza decir cuántas veces se lo he regalado a alguien.

Es de esos que se prestan y no vuelven nunca. ¿Cuál es el tuyo? El que prestaste y
sabes exactamente quién lo tiene.
```

### 2 · SE BUSCA — Libro del desasosiego · Fernando Pessoa · pedido hace 1 día

```
Alguien lo pidió ayer y no lo tengo.

Pessoa escribió esto durante veinte años en papeles sueltos que guardaba en un baúl,
sin orden y sin intención de publicarlo. Cuando lo encontraron después de muerto eran
más de veinticinco mil papelitos. Cada edición que existe es la decisión de un editor
distinto sobre en qué orden ponerlos, así que técnicamente nadie ha leído el mismo
libro.

Por eso pregunto en serio: ¿cuál edición tienen ustedes? Y si lo tienen repetido,
hay alguien esperándolo.
```

### 3 · SE BUSCA — Los años de peregrinación del chico sin color · Haruki Murakami · hace 1 día

```
Pedido ayer. No lo tengo.

Es el Murakami menos raro de todos: sin gatos que hablan ni pozos ni dos lunas. Solo
un tipo de treinta y seis años tratando de entender por qué sus cuatro amigos del
colegio dejaron de hablarle de un día para otro, sin explicación, hace dieciséis años.

Los fans se dividen: unos dicen que es el más flojo justamente por eso, otros que es
el mejor. ¿De qué lado están? Y si lo tienen guardado, hay alguien buscándolo.
```

### 4 · SE BUSCA — El libro de las tierras vírgenes · Rudyard Kipling · hace 2 días

```
Lo pidieron el martes. No lo tengo.

Es el Mowgli original, el de 1894, antes de que Disney lo convirtiera en un oso que
canta. En el libro Shere Khan no es un villano de dibujo animado y el final no se
parece en nada a la película. Mucha gente que cree conocer esta historia en realidad
nunca la leyó.

¿Alguien lo tiene en la edición vieja, esas de tapa dura con ilustraciones? Ésa es
la que están buscando.
```

### 5 · SE BUSCA — Yo, el gato · Natsume Sōseki · hace 20 días

```
Lleva veinte días esperando y todavía no aparece.

Es una novela japonesa de 1905 narrada por un gato sin nombre que vive en la casa de
un profesor y se dedica a observar con desprecio absoluto a los humanos que lo rodean.
Sōseki la escribió como un cuento y le fue tan bien que la siguió por dos años.

El gato nunca recibe nombre. Ése es el chiste y también el final. ¿Alguien lo tiene?
```

### 6 · SE BUSCA — Manos del Sur · Carlo von Mühlenbrock · hace 14 días

```
Dos semanas esperando este.

Es de los libros de cocina chilena que la gente hereda, no compra. Von Mühlenbrock
salió en la tele cuando la tele todavía enseñaba a cocinar en serio, y este es de los
que quedan con la letra manchada de aceite en la página del pastel de choclo.

Los libros de cocina son los que menos se venden usados porque nadie los suelta.
¿Cuál es el tuyo? El que está en la cocina y no en la repisa.
```

### 7 · SE BUSCA — Historia desconocida de los hombres · Robert Charroux · hace 8 días

```
Pedido hace ocho días. No lo tengo y creo que va a costar.

Charroux escribía en los sesenta sobre civilizaciones perdidas y visitantes de otros
planetas, con una seriedad absoluta. Es el abuelo de todo lo que hoy sale en cable a
las tres de la mañana. Se vendía muchísimo y después desapareció de las librerías.

Los que lo leyeron de cabros chicos se acuerdan perfecto. ¿Alguien tiene uno
guardado?
```

### 8 · SE BUSCA — Modernidad y ambivalencia · Zygmunt Bauman · hace 11 días

```
Once días esperando.

Bauman es el de la "modernidad líquida", frase que terminó en mil presentaciones de
PowerPoint y perdió todo el sentido. Este es anterior y es más incómodo: va sobre la
necesidad moderna de ordenar y clasificar todo, y qué pasa con lo que no cabe en
ninguna categoría.

Es de los que están agotados en español hace años. ¿Alguien lo tiene, aunque sea
subrayado entero?
```

---

## Cómo publicarlas

Dos por semana, no diario. **De noche**, no a la 1:07 PM — tu público lee en el celular después de
las siete. Incluye sábado o domingo, que hoy están vacíos. Empieza por la de "Lo encontré".

La métrica no son seguidores: son **comentarios**. Hoy vas en 7 a 19 personas de alcance por post
y cero seguidores nuevos en 90 días. Si en cuatro semanas no aparecen comentarios, Instagram baja
a un post semanal y la energía se va a Google y Reddit.
