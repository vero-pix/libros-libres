# Encargo: sinopsis para las fichas sin descripción

Para una sesión de Claude Code en la nube (claude.ai/code) sobre el repo
`libros-libres`, con **acceso de escritura** (trabajas en una rama y abres PRs;
nada va a `main`). Armado el 01-10-2026.

## Contexto

tuslibros.cl es un marketplace chileno de libros usados. Google casi no muestra
las fichas de libro que no tienen texto propio: en septiembre la mayoría de las
fichas con impresiones y sin clics eran fichas sin sinopsis o con texto pobre.
La sinopsis se usa en la ficha y los primeros ~110 caracteres van a la meta
description que se ve en Google (`app/(main)/libro/[username]/[slug]/page.tsx`).

`docs/sinopsis/pendientes.csv` tiene los **1.334 libros activos sin
descripción**, ordenados por precio (los caros primero). Columnas: `book_id`,
`titulo`, `autor`, `isbn` (casi siempre vacío), `editorial`, `anio`,
`categoria`, `idioma`, `precio_max`, `fichas`.

La sinopsis va en `books.description`, que es **del libro, no del ejemplar**:
la comparten todas las fichas de ese libro, de distintos vendedores.

## Lo que tienes que hacer

Escribir sinopsis en tandas de 100 filas, en el orden del CSV, y dejarlas en
archivos. **No toques código ni la base de datos**: la carga la hace la sesión
local después de revisar.

Por cada tanda, un archivo `docs/sinopsis/tanda-01.csv`, `tanda-02.csv`… con:

```
book_id,sinopsis,confianza,fuente
```

- `confianza`: `alta` (sabes con certeza de qué obra se trata y qué contiene) o
  `media` (la identificaste, pero algún dato salió de una búsqueda).
- `fuente`: `conocimiento`, o la URL que usaste para verificar.

Y un `docs/sinopsis/tanda-01-omitidos.csv` con `book_id,motivo` para lo que no
escribiste.

Un PR cada 3 tandas (300 libros), con un resumen: cuántas escritas, cuántas
omitidas y por qué. Rama: `sinopsis/tandas-NN-MM`.

## Reglas (no negociables)

1. **No inventes.** Si no sabes con certeza qué obra es o de qué trata, la omites
   con su motivo. Una ficha sin sinopsis no hace daño; una con la trama de otro
   libro sí: el comprador la lee y compra otra cosa. Puedes buscar en la web
   para verificar (editorial, Google Books, Biblioteca Nacional, Memoria
   Chilena, catálogos de librerías). Si la búsqueda no lo confirma, se omite.
2. **Nada del ejemplar.** Ni estado, ni precio, ni "primera edición", ni "firmado",
   ni "envío": eso cambia de ficha en ficha. Solo la obra.
3. **Revistas, colecciones, fascículos y enciclopedias** (ej.: "Revista Zig Zag N°
   567 al 584 - Año 1916"): describe qué publicación es y qué época cubre, solo
   con lo que puedas respaldar. No inventes el contenido de números concretos.
4. **Largo: 300 a 700 caracteres.** La primera frase tiene que funcionar sola
   como resumen en Google: qué es y de qué trata, sin rodeos.
5. **Español de Chile, neutro y concreto.** Prohibido: "Descubre", "Sumérgete",
   "imperdible", "obra maestra", "fascinante", "no te lo pierdas", signos de
   exclamación, emojis, preguntas retóricas. Nada que suene a contratapa de
   agencia. Si el libro es de otro idioma (`idioma` ≠ `es`), la sinopsis va igual
   en español, diciendo en qué idioma está la obra.
6. **Sin spoilers** del final en novelas.
7. El repo es **público**: no escribas nada sobre vendedores ni compradores.
   No toques `docs_desde_claude/` (está en `.gitignore` a propósito).

## Cuándo parar

Cuando termines las 1.334 filas, o cuando veas que las omitidas superan a las
escritas tres tandas seguidas (señal de que lo que queda es inidentificable).
Ahí cierra con un PR final y un resumen en `docs/sinopsis/RESUMEN.md`.
