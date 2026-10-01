# Sinopsis para fichas sin descripción — resumen

Encargo: `docs/prompts/sinopsis-fichas-nube.md` (01-10-2026). Entrada:
`docs/sinopsis/pendientes.csv`, 1.334 libros activos sin descripción, ordenados
por precio. Se escribió desde una sesión en la nube, sin tocar código ni la base.

## Resultado

| Tanda | Filas | Escritas | Alta | Media | Omitidas | PR |
|---|---|---|---|---|---|---|
| 01 | 1-100 | 92 | 59 | 33 | 8 | vero-pix/libros-libres#2 |
| 02 | 101-200 | 97 | 70 | 27 | 3 | vero-pix/libros-libres#2 |
| 03 | 201-300 | 95 | 55 | 40 | 5 | vero-pix/libros-libres#2 |
| 04 | 301-400 | 84 | 55 | 29 | 16 | vero-pix/libros-libres#3 |
| 05 | 401-500 | 86 | 69 | 17 | 14 | vero-pix/libros-libres#3 |
| 06 | 501-600 | 87 | 71 | 16 | 13 | vero-pix/libros-libres#3 |
| 07 | 601-700 | 90 | 82 | 8 | 10 | vero-pix/libros-libres#4 |
| 08 | 701-800 | 86 | 72 | 14 | 14 | vero-pix/libros-libres#4 |
| 09 | 801-900 | 80 | 69 | 11 | 20 | vero-pix/libros-libres#4 |
| 10 | 901-1000 | 67 | 49 | 18 | 33 | vero-pix/libros-libres#5 |
| 11 | 1001-1100 | 66 | 56 | 10 | 34 | vero-pix/libros-libres#5 |
| 12 | 1101-1200 | 58 | 50 | 8 | 42 | vero-pix/libros-libres#5 |
| 13 | 1201-1300 | 45 | 28 | 17 | 55 | este PR |
| 14 | 1301-1334 | 27 | 23 | 4 | 7 | este PR |
| **Total** | | **1.060** | 808 | 252 | **274** | |

Se cubrieron las 1.334 filas: el criterio de parada (omitidas > escritas tres
tandas seguidas) no se activó; solo la 13 tuvo más omitidas que escritas.

## Archivos

- `tanda-NN.csv`: `book_id,sinopsis,confianza,fuente`. `fuente` es
  `conocimiento` o la URL usada para verificar; toda `media` lleva URL.
- `tanda-NN-omitidos.csv`: `book_id,motivo`.

Todas las sinopsis pasaron un validador: 300-700 caracteres, sin palabras
prohibidas, sin exclamaciones ni preguntas, sin datos del ejemplar (estado,
precio, primera edición, firmado, envío), y sin dos libros con los mismos
primeros 110 caracteres (los repetidos —copias 1 y 2, mismo título en dos
fichas— tienen redacción distinta para no duplicar la meta description).

## Lo que pasó con la búsqueda web

La sesión agotó su cupo de 200 búsquedas a mitad de la tanda 04 (todas las
tandas corrían en paralelo y lo compartían), y el proxy bloquea WebFetch en casi
todos los catálogos (Wikipedia, Goodreads, Memoria Chilena, Lecturalia, Google
Books). Desde ese punto:

1. Solo se escribió lo que se conoce de primera mano; lo que se habría apoyado
   en el título, el subtítulo o la biografía del autor quedó omitido con el
   motivo **"Sin búsqueda web disponible para verificar el contenido"**.
2. Cada tanda (las 14, incluidas las que se escribieron con búsqueda) pasó por
   un **segundo revisor independiente** que contrastó cada sinopsis con su ficha.
   Ese pase omitió 46 más y corrigió 81. Encontró errores reales aun en
   sinopsis de confianza alta, por ejemplo: Elizabeth Lira presentada como
   historiadora; Coupeau como plomero en *La taberna*; *Los ojos de la mente* de
   Sacks diciendo que la neurobióloga perdió la visión estereoscópica (la
   adquirió); el falso "único texto en francés" de Nabokov; el "único encuentro"
   de Celan y Nelly Sachs; L. A. Sánchez muerto en 1996 (fue 1994).

Por eso la omisión pesa más en las tandas 10 a 13: el cuello de botella fue la
verificación, no que los libros sean inidentificables.

## Omitidas (274) y cuáles se pueden recuperar

| Motivo | Fichas | Recuperable |
|---|---|---|
| Sin búsqueda web para verificar | 136 | Sí, con una sesión con cupo de búsqueda nuevo |
| Contenido o edición no confirmada (tomos, antologías sin índice, títulos que no calzan) | 76 | En parte, con búsqueda |
| No identificada en catálogos | 54 | Difícil; muchas son autoediciones o fichas con datos erróneos |
| Título genérico o pack sin detalle | 8 | No, sin corregir la ficha |

Siguiente paso sugerido: una sesión nueva que tome solo las filas omitidas con
motivo "Sin búsqueda web…" (filtro directo sobre los `-omitidos.csv`), con las
mismas instrucciones, y las procese en tandas chicas para no agotar el cupo.

## Para la carga

- Las de confianza `alta` y `media` cumplen las reglas del encargo. Si se quiere
  una primera carga más conservadora, partir por `alta` y revisar a mano una
  muestra de `media`.
- `books.description` es del libro, no del ejemplar: la sinopsis se verá en
  todas las fichas de ese libro.

## Datos de las fichas que vienen mal (no se tocaron)

Las sinopsis usan el dato correcto; las fichas siguen con el error:

- **Columnas no confiables:** `idioma` dice `es` en las 1.334 filas (hay libros
  en inglés, portugués, francés y alemán); `categoria` tiene ensayos marcados
  como ficción, Borges como infantil-juvenil y *Atlas* de Lucinda Riley como
  infantil-juvenil.
- **Autores:** Skármet → Skármeta; Edelbert → Adelbert von Chamisso; Nadie →
  Nadine Gordimer; Alejo Carpenter → Carpentier; Leila Guerrero → Guerriero;
  Mafredi → Manfredi; Ernesto Sábado → Sabato; Howart Philipe → Howard Phillips
  Lovecraft; Tulio Laperin → Halperin Donghi; Unberto → Umberto Eco; Gabriel →
  Guillermo Cabrera Infante; *Operación Cóndor* es solo de John Dinges (Saul
  Landau sobra).
- **Títulos:** "entre corona y nación" → *entre colonia y nación* (Lynch);
  "antología del presente" → *ontología* (Jameson); "Requiem polifónico por
  accidente" → *por Occidente* (Zamora); "Cultivando a Ashton" → *Cautivando*;
  "Ceremonias secretas" → *Ceremonia secreta* (Denevi); "Suspender la certeza" →
  *Suspender toda certeza*; prefijo "Título:" y sufijo "Empaste" en una Zig-Zag.
