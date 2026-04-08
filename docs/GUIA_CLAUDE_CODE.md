# Guía de trabajo con Claude Code CLI
## Basada en la experiencia real de tuslibros.cl

---

## Por qué la CLI es más potente

En la CLI tengo acceso simultáneo a:
- **Sistema de archivos** — leo, escribo, edito código directamente
- **Terminal** — corro scripts, git, npm, cualquier comando
- **APIs externas** — Google Books, Open Library, Supabase, MercadoPago
- **MCP servers** — Canva, Gmail, Google Calendar, MercadoPago (los que tengas conectados)
- **Agentes en paralelo** — puedo buscar ISBNs de 15 libros mientras cargo otros 12
- **Git** — commit, push, manejo de branches directo
- **Memoria persistente** — recuerdo quién eres, qué hicimos, qué preferencias tienes

En desktop solo puedo conversar. Acá puedo **hacer**.

---

## Patrones que funcionaron bien en tuslibros.cl

### 1. "Foto → Catálogo" (carga masiva desde fotos)
**Cómo lo hicimos:**
```
Tú: [mandas foto de libros]
Yo: identifico títulos → busco ISBNs en paralelo → armo CSV → cargo a Supabase
```
**Tip:** Manda fotos claras con los títulos visibles. Mientras busco ISBNs de una foto, puedes mandar la siguiente.

### 2. Agentes en paralelo
**Ejemplo real:** Mientras un agente buscaba ISBNs de 12 libros, yo estaba:
- Cargando la tanda anterior
- Arreglando un bug del filtro
- Actualizando la terminología

**Tip:** Cuando me pidas algo que toma tiempo (buscar datos, investigar precios), dime "mientras tanto haz X". Puedo hacer varias cosas a la vez.

### 3. "Hazlo y pushea"
**Lo que más funciona:**
```
Tú: "agrega botón de Instagram y pushea"
Yo: edito → commit → push → te digo qué hice
```
**Tip:** Si confías en el cambio, dime "pushea directo". Si quieres revisar, dime "hazlo en local". Por defecto siempre pregunto.

### 4. Investigación de mercado + acción
**Ejemplo real:** Los libros de la Biblioteca de Babel
```
Tú: "calcula el precio adecuado"
Yo: busco en IberLibro, AbeBooks, todocoleccion → propongo $40.000-$45.000 → tú apruebas → cargo
```
**Tip:** Puedo investigar precios, competencia, APIs, documentación técnica. Solo pide.

### 5. Auditoría + fix automático
**Ejemplo real:** 45 libros sin portada
```
Yo: detecto el problema → creo script → corro → arreglo 41 de 45
```
**Tip:** Pídeme "audita X" y te doy un diagnóstico antes de actuar. Luego dices "arregla" y ejecuto.

---

## Comandos útiles que puedes darme

| Lo que quieres | Cómo pedirlo |
|---|---|
| Cargar libros desde foto | [manda foto] "cárgalos, precio X, condición Y" |
| Arreglar algo en el sitio | "el filtro de arriendo no funciona" + screenshot |
| Investigar algo | "investiga precios de mercado para estos libros" |
| Crear contenido marketing | "escribe el post de LinkedIn para el lanzamiento" |
| Auditar el estado | "cuántos libros no tienen portada?" |
| Diseñar en Canva | "crea un banner para Instagram con el brand kit" |
| Actualizar roadmap | "anota esto en el roadmap" |
| Push a producción | "pushea a main" |
| Correr script | "corre el script de enrich" |
| Revisar cómo va algo | "cómo va el deploy?" |

---

## Cómo retomar en otra sesión

**No necesitas darme contexto largo.** Yo leo automáticamente:
- La memoria del proyecto (quién eres, qué hicimos)
- El ROADMAP.md
- El estado de git

Solo di lo que necesitas:
- ❌ "Hola, soy Verónica, estamos trabajando en tuslibros.cl que es un marketplace..."
- ✅ "Arregla las portadas" — yo ya sé qué script correr
- ✅ "Carga estos libros" + [foto]
- ✅ "¿Qué quedó pendiente de la sesión anterior?"

---

## Cómo sacarme más jugo

### Manda screenshots
Cuando algo se ve mal, un screenshot vale más que 100 palabras. Yo puedo ver la imagen y diagnosticar.

### Pide cosas ambiciosas
No te limites a bugs. Puedo:
- Investigar mercado y competencia
- Diseñar en Canva con tu brand kit
- Escribir contenido marketing
- Crear scripts de automatización
- Conectar APIs nuevas
- Analizar datos de tu Supabase

### Corrige sin miedo
Si hago algo que no te gusta, dilo directo:
- "No me gusta ese precio, ponle X"
- "Esa terminología no, usa arriendo"
- "No cierres la sesión tan rápido" 😄

Lo anoto y no lo repito.

### Usa el ROADMAP como GPS
Cuando no sepas por dónde seguir, pregúntame "¿qué sigue en el roadmap?" y te guío.

---

## Flujo ideal de una sesión productiva

```
1. Abres terminal en la carpeta del proyecto
2. Escribes: claude
3. Me dices qué quieres lograr hoy
4. Yo propongo plan → tú ajustas → ejecutamos
5. Iteramos: fix → screenshot → fix → screenshot
6. Push cuando estés conforme
7. Anotamos pendientes en roadmap/memoria
```

No hay apuro. Las mejores sesiones son las que fluyen naturalmente — como la de hoy.
