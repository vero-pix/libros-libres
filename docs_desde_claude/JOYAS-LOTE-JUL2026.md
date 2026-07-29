# Lote "joyas" — 76 fotos, julio 2026

Análisis del lote que Vero dejó en `~/Downloads` (IMG_0079–0149, IMG_8797–8809).
Estado: **identificación hecha, tasación pendiente, fotos sin procesar**.

---

## 1 · Qué hay en el lote

76 fotos que cubren **~18 títulos**. No son 76 libros: la mayoría de los títulos
tiene entre 3 y 6 fotos (tapa, portadilla, colofón, índice, detalle).

Datos verificados leyendo la portadilla de cada uno. Los marcados ⚠️ necesitan
una foto más para cerrar el dato.

### Piezas de primer nivel

| # | Título | Pie de imprenta | Por qué importa |
|---|---|---|---|
| 1 | **Blaise Pascal — Œuvres Complètes, Tome Troisième** | Paris, Librairie de L. Hachette et Cie, **1866** | Trae los **grabados de la máquina aritmética** (la Pascalina, primera calculadora mecánica). Sello de propiedad antiguo. 160 años. |
| 2 | **Isidoro Errázuriz — Discursos Parlamentarios, Tomo II** | Imprenta Barcelona, Moneda esq. San Antonio, **Santiago de Chile, 1910** | Chilensis puro. Colección *Biblioteca de Escritores de Chile*, recopilado por **Luis Orrego Luco**. Escudo de Chile grabado. |
| 3 | **Otto von Bismarck — Ein Lebensbild** (Karl Strecker) | Berlin, W. Pauli's Nachf., **1895** | Siglo XIX alemán, tapa decorada en relieve, láminas del Bismarck-Museum. |
| 4 | **Fénelon — Les Aventures de Télémaque** | Paris, Librairie Hachette et Cie ⚠️ año | Siglo XIX francés, con sello institucional. |
| 5 | **Goethe — Faust I y II** | Propyläen Verlag, Berlin — *Pantheon-Ausgabe* | Dos tomos, **canto dorado**, papel jaspeado, retrato grabado de J.H. Lips (1791). |
| 6 | **Jorge Luis Borges — Elogio de la sombra** | Emecé Editores, Buenos Aires–Barcelona ⚠️ año | Borges es Borges. **Falta confirmar si es 1ª edición (1969)** — el pie "Buenos Aires–Barcelona" sugiere reimpresión posterior. |
| 7 | **Vicente Pérez Rosales — Diccionario de "El Entrometido"** | Colección Letras Chilenas ⚠️ año | Chileno, del autor de *Recuerdos del pasado*. |

### Series completas encuadernadas

| # | Título | Pie de imprenta | Nota |
|---|---|---|---|
| 8 | **Emil Ludwig — Obras Completas** (5 vols., Biografías) | Editorial Juventud, Barcelona | Encuadernación en piel, buen estado. Cleopatra, Goethe, Maquiavelo, Federico el Grande, Lenin, Wilson, Rathenau, Leonardo, Balzac… |
| 9 | **Stefan Zweig — Obras Completas** (Biografías I–II + Memorias y ensayos) | Editorial Juventud, Barcelona, 2ª ed., dep. legal **1960** | Misma encuadernación que Ludwig — **se venden juntos como conjunto**. Incluye *Momentos estelares de la humanidad*, *María Estuardo*, *Erasmo*, *Fouché*. |
| 10 | **Gustave Flaubert — Obras** | EDAF ⚠️ año | Tapa roja gofrada con dorados. Madame Bovary, Salambó, La educación sentimental, Las tentaciones de San Antonio… |

### Filosofía y ensayo

| # | Título | Pie de imprenta |
|---|---|---|
| 11 | **Paulin Malapert — Leçons de Philosophie I: Psychologie** | Paris, Librairie A. Hatier, **1906** |
| 12 | **D. Mercier — Curso de Filosofía: Psicología (t. II) y Lógica** | La España Moderna, Madrid ⚠️ año (~1900s) |
| 13 | **Walter Brugger — Diccionario de Filosofía** | Herder, Barcelona, **12ª ed. 1994** — ISBN 84-254-0722-2 |
| 14 | **Rabelais — Gargantúa y Pantagruel** | EDAF, Madrid, **1961** |
| 15 | **C.W. Ceram — Götter, Gräber und Gelehrte** | Bertelsmann Lesering (alemán) |
| 16 | **C. Virgil Gheorghiu — La hora veinticinco** | Emecé, Buenos Aires — prefacio de Gabriel Marcel |
| 17 | **Marguerite Yourcenar — Memorias de Adriano** | ⚠️ por confirmar |
| 18 | Libro de arte egipcio (láminas a color) | ⚠️ sin identificar — falta foto de portadilla |

**Detalle bonito del #13:** el Brugger trae pegada una etiqueta de premio de
**Redland School Santiago, diciembre de 1995**, otorgado a un alumno por
Filosofía y firmada por el headmaster. Eso es procedencia, y la procedencia se
cuenta en la ficha: sube el valor y da contenido único para SEO.

> Nota: el nombre del alumno está en el libro pero **no se escribe acá ni en la
> ficha pública** — este repo es público y es una persona real. En la ficha basta
> "premio de un colegio de Santiago, 1995".

---

## 2 · Las fotos: diagnóstico

Probé el pipeline completo sobre el lote. Tres hallazgos:

**a) Ninguna sirve como está.** Las 76 están en horizontal (4032×3024) con el
libro girado. Y **el ángulo no es constante**: probé rotar +90° en bloque y unas
quedaron derechas, otras de cabeza. **No se puede automatizar a ciegas** — hay
que definir la rotación foto por foto.

**b) El recorte de fondo funciona a medias.** Instalé `rembg` (modelo u2net) y lo
corrí sobre dos tapas:

- **Flaubert (tapa roja)** → recorte limpio, perfecto para catálogo.
- **Gargantúa (tapa azul oscura)** → **lo destruyó**: confundió la tapa con el
  fondo y dejó un fantasma descolorido.

La regla es que el modelo falla con tapas oscuras y con fondos de madera. Sirve
para tapas de color contrastante, no para el lote entero.

**c) La mayoría no son fotos de tapa, y eso está bien.** Buena parte son
portadillas, colofones e índices — inservibles como imagen principal, pero son
**exactamente lo que un comprador de libro antiguo quiere ver**: la prueba del
año, la imprenta y el estado. En anticuario eso no es ruido, es el argumento de
venta.

**d) Hay basura que filtrar:** al menos una foto es de unos audífonos (IMG_0095),
y varias tienen manos, autos y sillas de fondo.

---

## 3 · Recomendación

**No recortar el fondo de todo.** Para libro antiguo el fondo recortado juega en
contra: quita la textura y el aire de objeto real, que es justamente lo que se
está comprando. Buscalibre necesita fondo blanco porque vende ejemplares
idénticos; acá cada ejemplar es único.

Propuesta de dos niveles:

- **Foto 1 (portada de catálogo):** rotar, enderezar, recortar al libro, subir
  luz y contraste. Fondo recortado **solo** si la tapa contrasta.
- **Fotos 2 a N (evidencia):** rotar y recortar, nada más. Portadilla con año,
  colofón, canto dorado, sellos, el daño si lo hay. Sin retoque: acá la
  imperfección **es** la credibilidad.

---

## 4 · Dónde va cada cosa

| Destino | Qué llevar |
|---|---|
| `/libros-antiguos` (ya existe) | Pascal 1866, Bismarck 1895, Fénelon, Malapert 1906, Goethe |
| `/libros-de-historia-de-chile` (ya existe) | **Errázuriz 1910**, Pérez Rosales |
| Ficha individual con historia larga | Pascal (la Pascalina), Brugger (el premio del colegio) |
| Vender como conjunto, no suelto | Ludwig (5 vols.) + Zweig — misma encuadernación, mismo sello |

**Lo que falta y no existe todavía:** una landing de *colección / anticuario*.
Hoy `/libros-antiguos` es una categoría más. Con este lote hay material para una
página con criterio propio — no un listado, una selección comentada. Eso es
contenido único por libro, que es lo que mueve SEO y lo que nadie más en Chile
está haciendo con libro usado.

---

## 4 bis · Tasación (29 jul)

Referencias tomadas **solo de mercados internacionales** (IberLibro / AbeBooks /
Booklooker). No se consultaron catálogos de otros vendedores de tuslibros.
Conversión usada: 1 EUR ≈ $1.000 CLP, redondeando conservador.
"Sugerido" aplica el criterio de la casa: **40–60% bajo la referencia**.

| Pieza | Referencia internacional | Sugerido tuslibros | Confianza |
|---|---|---|---|
| **Emil Ludwig — 5 vols., piel verde** (Juventud, *Clásicos y Modernos*, 1955-57) | EUR 14,50–87,10 según tomo y estado; set completo en buen estado ≈ EUR 80-90 | **$40.000–55.000** el set | Alta — edición y encuadernación coinciden exactamente |
| **Stefan Zweig — Obras Completas** (Juventud, misma colección, 1952-62) | EUR 19,90–85,00 | **$30.000–45.000** el set | Alta |
| **Fénelon — Télémaque** (Hachette, s. XIX) | USD 20–50 según estado | **$15.000–25.000** | Media — hay muchas ediciones Hachette del XIX, falta el año exacto |
| **Bismarck — Ein Lebensbild** (Berlín, W. Pauli, 1895) | Sin comparable con precio a la vista | **$35.000–50.000** (estimación) | ⚠️ **Baja — es un cálculo, no un dato** |
| **Errázuriz — Discursos Parlamentarios, 1910** | Solo aparecen reimpresiones POD modernas; **de la edición original de 1910 no hay comparable público** | **$100.000** — precio fijado por Vero (29 jul) | Criterio de la casa, no de mercado |

**Ficha del Bismarck confirmada** en el camino: 157 páginas, 90 ilustraciones,
**30 fotografías originales del Museo Bismarck de Schönhausen**. Eso es bastante
más que "libro viejo alemán" y justifica la punta alta del rango.

**Sobre el Errázuriz:** que no haya comparable no significa que valga poco —
significa lo contrario. Es un libro que casi no circula fuera de Chile. Su precio
lo fija el mercado local de historia de Chile, no IberLibro. **Vero lo fijó en
$100.000** el 29 de julio, por criterio propio.

Es la pieza más cara del lote y la más difícil de comparar, así que conviene
tratarla como experimento: si a los 30-60 días no tiene visitas ni consultas, el
dato es del precio, no del libro. Vale la pena anotar la fecha de publicación
para poder leer eso después.

---

## 5 · Pendiente antes de publicar

1. **Tasar.** No inventé precios. El método que ya funciona: mirar IberLibro y
   Buscalibre y quedar 40–60% abajo. Las que ameritan búsqueda seria son Pascal
   1866, Errázuriz 1910, Bismarck 1895 y el Borges.
2. **Cerrar los ⚠️.** Faltan fotos de portadilla/colofón de 6 títulos. Sobre todo
   **el año del Borges**: si es 1ª de 1969 el precio cambia de orden de magnitud.
3. **Decidir el nivel de retoque** (sección 3) antes de procesar las 76.
4. **Confirmar de quién es el lote** — si es catálogo de Vero o de un vendedor
   externo, porque cambia bajo qué `seller_id` se publica.

---

*Fotos originales copiadas al scratchpad de la sesión. Las de Descargas no se
tocaron.*
