# P00 — Cómo se conduce una sesión de Claude Code en este repo

Procedimiento estable. No caduca con la sesión. Los prompts numerados
(`P10`, `P11`, …) son tareas concretas; este documento es cómo se ejecutan.

---

## Principio

**Una tarea por sesión.** El contexto largo degrada el juicio del agente y lo
lleva a tocar archivos que nadie pidió. Si una sesión tiene dos objetivos, uno
de los dos va a quedar sin verificar.

Corolario práctico: nunca pegar "arregla X y además analiza Y" en el mismo
turno. El análisis tapa la verificación del arreglo.

---

## El ciclo de cuatro pasos

Ninguna tarea salta un paso.

### 1. Diagnóstico — sin tocar nada

Se le pide evidencia y conclusión, explícitamente sin cambios de código.

> Muéstrame [los datos]. No arregles nada todavía. Quiero saber si esto es
> [hipótesis A] o [hipótesis B]. Dame la tabla y tu conclusión.

Este paso existe porque las hipótesis se caen. En este proyecto ya se cayeron
dos: la fuga de checkout (era un bug muerto) y la comisión leída desde
`orders.service_fee` (subestimaba 4x).

### 2. Decisión — la toma Vero, no el agente

El diagnóstico se lee y se decide qué se hace. Un diagnóstico que deriva
directo en un fix sin este paso es cómo aparecen los refactors no pedidos.

### 3. Ejecución — acotada y declarada

> Aplica solo [el cambio]. No refactorices nada que no te pedí. Si encuentras
> otro problema en el camino, anótalo y sigue: no lo arregles.

### 4. Verificación — en la misma sesión

Sin esto, no se sabe si el fix funcionó. Se exige siempre:

- `npm run build` sin errores relevantes
- si es UI: el flujo probado en el navegador, golden path y un borde
- si toca BD: la migración aplicada y verificada en Supabase
- **la medición antes y después**, cuando la tarea afecta una métrica

---

## Reglas de contexto

- Sesión limpia por tarea. Si el contexto pasa de ~60%, cerrar y abrir otra.
- Antes de afirmar cualquier dato de negocio, el agente consulta la tabla de
  fuentes canónicas del `CLAUDE.md`. Si un documento contradice a la fuente,
  gana la fuente.
- Los documentos `SESION-*.md` y `MODELO-NEGOCIO.md` no son estado actual. Ya
  contaminaron un plan completo.

---

## Cierre de sesión

Cuando la tarea toca una métrica o una convención, el material que va a
importar la semana que viene queda en disco:

| Qué | Dónde |
|---|---|
| Prompt ejecutable reutilizable | `docs/prompts/` |
| Diagnóstico o estado fechado | `docs_desde_claude/` (privado, en .gitignore) |
| Script de medición repetible | `scripts/` |
| Fuente de verdad nueva | tabla de `CLAUDE.md` |

Un hallazgo que solo vive en el scrollback del terminal se perdió.

---

## Errores frecuentes, ya cometidos

| Error | Costo real |
|---|---|
| Mezclar arreglo y análisis en un prompt | El arreglo queda sin verificar |
| Optimizar antes de medir en frío | La home a 1,75 s podía ser cold start |
| Leer una métrica de la columna más obvia | La comisión subestimada 4x durante días |
| Dar por buena una hipótesis sin denominador | Meses de foco en el checkout, que no era el problema |
| Anunciar "listo" sin `npm run build` | Se descubre en producción |
