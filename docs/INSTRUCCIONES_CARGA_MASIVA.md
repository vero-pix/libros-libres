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
| isbn | No | Código ISBN (13 dígitos) | Si lo tienes, lo buscamos automáticamente |
| precio | Sí | Precio en pesos chilenos | Número sin puntos ni signos (ej: 8000) |
| condicion | Sí | Estado del libro | `como_nuevo`, `buen_estado`, `estado_regular`, `con_detalles` |
| tipo | Sí | Modalidad | `venta`, `arriendo`, `ambos` |
| categoria | No | Categoría del libro | Ficción, Historia, Ciencia, Autoayuda, Filosofía, No ficción, Infantil, Poesía |

## Notas

- **Portada**: se busca automáticamente por ISBN o título+autor. No necesitas incluir imagen.
- **Ubicación**: se usa la dirección que tienes en tu perfil de tuslibros.cl.
- **Sin límite**: puedes cargar cuantos libros quieras.
- **Precio**: en pesos chilenos sin puntos. Ejemplo: 8000 (no $8.000).
- **ISBN**: si no lo tienes, déjalo vacío. Lo buscamos por título y autor.
