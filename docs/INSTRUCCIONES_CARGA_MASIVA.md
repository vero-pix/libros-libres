# Carga Masiva de Libros — tuslibros.cl

## Instrucciones

1. Abre el archivo `plantilla_carga_masiva.csv` con Excel, Google Sheets o Numbers
2. Borra los 3 libros de ejemplo y agrega los tuyos
3. Guarda como CSV (separado por comas)
4. Envía el archivo a Verónica por WhatsApp o email

## Columnas

| Columna | Obligatorio | Descripción | Valores posibles |
|---------|-------------|-------------|------------------|
| titulo | Sí | Nombre del libro | Texto libre |
| autor | Sí | Nombre del autor | Texto libre |
| isbn | No | Código ISBN (13 dígitos) | Si lo tienes, autocompletamos editorial, año y páginas |
| precio | Sí | Precio en pesos chilenos | Número sin puntos ni signos (ej: 8000) |
| condicion | Sí | Estado del libro | `como_nuevo`, `buen_estado`, `estado_regular`, `con_detalles` |
| tipo | Sí | Modalidad | `venta`, `arriendo`, `ambos` |
| categoria | No | Categoría del libro | Historia, Política, Filosofía, Esoterismo, Ficción, Novela Histórica, Ensayo, Biografía, Poesía, Infantil, Académico, etc. (texto libre — lo normalizamos) |
| editorial | No | Editorial | Texto libre (ej: Andrés Bello) |
| año | No | Año de publicación | Número (ej: 1968) |
| paginas | No | Número de páginas | Número (ej: 320) |

## Notas

- **Fotos**: si quieres usar **tus propias fotos** (recomendado si cuidas la presentación), mándalas en una carpeta aparte nombrando cada archivo con el ISBN del libro (`9788401352836.jpg`, y `9788401352836-2.jpg`, `-3.jpg` para más ángulos). La primera queda de portada y el resto en la galería (hasta 5). Si no mandas fotos, usamos la portada de catálogo por ISBN.
- **Editorial, año y páginas**: opcionales. Si pones el ISBN se autocompletan solos; para libros antiguos sin ISBN, conviene llenarlos a mano.
- **Ubicación**: se usa la dirección que tienes en tu perfil de tuslibros.cl.
- **Sin límite**: puedes cargar cuantos libros quieras.
- **Precio**: en pesos chilenos sin puntos. Ejemplo: 8000 (no $8.000).
- **ISBN**: si no lo tienes, déjalo vacío. Lo buscamos por título y autor.
