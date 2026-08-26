# P12 · Bug del contador de visitas en /mis-libros

## Qué pasa

La caja de `/mis-libros` dice **"0 visitas en tus libros los últimos 7 días"**, pero los
contadores por libro en la misma página muestran números (5 visitas, 4 visitas). Los dos no
pueden ser ciertos a la vez.

## Los datos reales

Vistas a `/libro/vero/*` en los últimos 8 días, consultando `page_views` directo:

| día | vistas |
|---|---:|
| 26 ago | 5 |
| 25 ago | 8 |
| 24 ago | 7 |
| 23 ago | 5 |
| 22 ago | 1 |
| 21 ago | 3 |
| 20 ago | 11 |
| 19 ago | 2 |
| 18 ago | 8 |

**50 visitas en la semana, no cero.** Los datos están bien; el contador está mal.

## La causa

`app/api/seller/listing-views/route.ts`:

```ts
const { data: views, error: viewError } = await serviceClient
  .from("page_views")
  .select("listing_id, created_at")
  .in("listing_id", listingIds);
```

Sin `.range()` y sin filtro de fecha. **Supabase corta en 1.000 filas por defecto.** Las 215
publicaciones de vero acumulan **1.263 filas** en `page_views` desde abril, así que la consulta
devuelve solo las 1.000 más antiguas —todas anteriores a los últimos 7 días— y `totalWeeklyViews`
queda en 0.

Los contadores por libro siguen mostrando números porque `viewMap` es el acumulado histórico y se
arma del mismo lote de 1.000 filas viejas.

Es el mismo error que ya se arregló en el commit **`b306871`** ("fix(login): paginar el conteo —
Supabase cortaba en 1.000 filas"). En este archivo quedó suelto.

---

## El prompt

```
El contador "0 visitas en tus libros los últimos 7 días" de /mis-libros está mal. Los datos
reales existen: mis fichas recibieron 50 visitas en los últimos 8 días (26 ago: 5, 25: 8, 24: 7,
23: 5, 22: 1, 21: 3, 20: 11, 19: 2, 18: 8).

El bug está en app/api/seller/listing-views/route.ts. La consulta a page_views hace

  .select("listing_id, created_at").in("listing_id", listingIds)

sin .range() y sin filtro de fecha. Supabase corta en 1.000 filas por defecto y mis 215
publicaciones acumulan 1.263 filas desde abril, así que trae solo las 1.000 más antiguas —todas
anteriores a los 7 días— y el total semanal queda en 0. Los contadores por libro siguen
mostrando números porque son el acumulado, armado del mismo lote viejo.

Es el mismo error que arreglaste en b306871 ("paginar el conteo — Supabase cortaba en 1.000
filas"), pero en este archivo quedó suelto.

Arréglalo así:
1. Filtra por created_at en la consulta en vez de traer todo y filtrar en memoria.
2. Para lo que sí necesites completo (el acumulado por libro), pagina o usa un count agregado.
   No dependas del límite implícito.
3. Verifica el resultado contra los números de arriba antes de darlo por bueno.

Y después revisa si el mismo patrón está en otras consultas a page_views. Vi al menos
app/api/admin/analytics/route.ts y app/api/admin/business-metrics/route.ts. Si el panel de admin
tiene el mismo corte, todos los números que me muestra están mal y llevo días mirándolos.
Dime cuáles encontraste antes de arreglarlos.
```

---

## Por qué importa más de lo que parece

El contador que dice "0 visitas" y te felicita con "¡Sigue así!" es lo primero que ve **cualquier
vendedor** al entrar a sus libros. Si a los que tienen catálogo grande —CIM, Buhardilla— les está
mostrando cero, están viendo una plataforma que parece muerta cuando no lo está. Son justo las
tres cuentas que concentran el 92% de las ventas.
