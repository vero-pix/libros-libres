# Importador Masivo - tuslibros.cl
## 50 libros de Verónica para carga rápida

### Archivos generados

- **carga_masiva_libros.csv** — 50 registros con titulo, autor, ISBN, URLs de covers, condicion, tipo
- **carga_masiva_libros.json** — Mismo contenido en formato JSON (para Supabase insert directo)

### Fuentes de covers (por ISBN)

Google Books tiene 100% de cobertura para esta coleccion. URL pattern:

```
https://books.google.com/books/content?vid=isbn:{ISBN}&printsec=frontcover&img=1&zoom=1
```

Open Library como fallback:
```
https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
```

### Instrucciones para Claude Code

**Opcion A: Insert directo a Supabase**

```typescript
// Script para ejecutar en el proyecto libros-libres
import { createClient } from '@supabase/supabase-js';
import libros from './carga_masiva_libros.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usar service role para bypass RLS
);

// SELLER_ID de Verónica (obtener de tabla profiles)
const SELLER_ID = 'REEMPLAZAR_CON_ID_VERONICA';

for (const libro of libros) {
  const { error } = await supabase.from('listings').insert({
    title: libro.title,
    author: libro.author,
    isbn: libro.isbn,
    condition: libro.condition,
    type: libro.type,
    description: libro.description,
    image_url: libro.cover_url_google, // Google Books cover
    status: 'available',
    seller_id: SELLER_ID,
    price: 5000, // Precio default CLP, ajustar despues
    category: libro.category,
  });
  
  if (error) console.error(`Error: ${libro.title}`, error);
  else console.log(`OK: ${libro.title}`);
}
```

**Opcion B: Via API route del proyecto**

Si el proyecto tiene un endpoint de creacion de listings, usar ese para respetar validaciones y hooks existentes.

**Opcion C: SQL directo**

```sql
INSERT INTO listings (title, author, isbn, condition, type, description, image_url, status, seller_id, price, category)
VALUES
  ('La Hermana', 'Sándor Márai', '9788498380897', 'buen_estado', 'venta', '...', 'https://books.google.com/books/content?vid=isbn:9788498380897&printsec=frontcover&img=1&zoom=1', 'available', 'SELLER_ID', 5000, 'literatura'),
  -- ... 49 mas
;
```

### Campos pendientes (a definir por Verónica)

- **price**: No viene en el listado original. Default sugerido: $5.000 CLP (ajustable post-carga)
- **category granular**: Todos marcados como "literatura". Refinar por subgenero si se desea.
- **seller_id**: Necesita el UUID de Verónica en tabla `profiles`

### Datos de la coleccion

- 50 libros, 100% con ISBN
- 100% con cover disponible (Google Books)
- Autores destacados: Benjamin Black (8 libros), Enrique Vila-Matas (2), John Banville (2), Augusto Monterroso (2)
- Genero predominante: Narrativa literaria hispanoamericana y europea
- Condicion: Todos usados, buen estado
