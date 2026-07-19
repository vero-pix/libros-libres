# 📚 Generador de posts sociales — Runbook

Handoff para continuar en **Claude Desktop** (donde vive el conector MCP de Metricool).
Construido en Claude Code el 18 jul 2026. El script ya está listo y probado.

---

## Qué hace

`scripts/generar-post-social.mjs` saca un libro del catálogo de tuslibros.cl con **mezcla rotativa** y arma un post listo para IG/FB:

- **Rotación por día** (`día % 3`): `0` colección/raro · `1` recién subido · `2` oferta (con descuento).
- Prefiere libros con **foto real del vendedor** (mejor para IG).
- Genera caption en **voz de Vero** (chileno, 1ª persona, gancho), con link amigable `/libro/[username]/[slug]`, precio en CLP y comuna.
- Produce **dos versiones de imagen** para comparar.

## Cómo correrlo (en la carpeta del repo)

```bash
node scripts/generar-post-social.mjs          # libro de hoy
node scripts/generar-post-social.mjs --day 0  # forzar categoría (0 colección · 1 reciente · 2 oferta)
```

## Qué genera (carpeta `social/`, ignorada por git)

Por cada corrida, con nombre `post-AAAAMMDD-<categoria>-*`:

| Archivo | Qué es |
|---|---|
| `…-A.md` | **Opción A**: caption + **foto real** del vendedor (URL) + link. Lista para publicar tal cual. |
| `…-B.html` | **Opción B**: **tarjeta de marca** (HTML 1080×1080, estética tuslibros — serif Newsreader, crema). Ábrela en el navegador y **captura a 1:1**. |
| `…-metricool.json` | Datos estructurados (texto, link, imagen, redes) para **programar vía Metricool**. |

**Probar ambas imágenes:** publica unos días con la foto real (A) y otros con la tarjeta (B), y mira cuál engancha más.

---

## Programar en IG/FB con Metricool (esto se hace en Claude Desktop)

### Prerrequisitos (una sola vez)
1. **Crear las cuentas** (manual, identidad limpia — NO reusar las `@tuslibros.cl` trabadas en Meta):
   - Instagram → app/`instagram.com`, luego pásala a **cuenta profesional/Business**.
   - Facebook → una **Página** en `facebook.com/pages/create`.
   - Enlazarlas en **Meta Business Suite** (`business.facebook.com`).
   - Nombre sugerido: display **`tuslibros.cl`**, handle `@tuslibros.cl` → si no está, `@tuslibroscl`.
2. **Conectar IG + FB dentro de Metricool** (`metricool.com` → agregar marca → conectar redes).
3. **Agregar el conector MCP de Metricool a Claude Desktop**: servidor remoto `https://ai.metricool.com/mcp` → autorizar con OAuth en el navegador.
   - Plan gratis: **máx. 20 posts programados**, datos de 30 días.

### Flujo para programar (pídeselo a Claude en Desktop, en lenguaje natural)
1. "¿Qué cuentas tengo conectadas en Metricool?" → usa `get_brand_settings` (devuelve `blog_id` + zona horaria).
2. Pásale el contenido del `…-metricool.json` generado.
3. "Programa este post en Instagram y Facebook para mañana a la mejor hora" → usa `create_scheduled_post` (`date`, `blog_id`, `info` con texto + imagen).
   - Imagen: usa `imageOptionA` (foto real, URL directa) **o** la captura de la tarjeta B.
4. Verifica que aparezca en el **calendario de Metricool**. No programar en masa sobre el límite de 20.

---

## Ideas de mejora (para después)
- La categoría "reciente" a veces pesca textos escolares poco atractivos → afinar con `trending_score` o excluir subcategoría "textos escolares".
- Opción B: si quieres una gráfica más elaborada, generar el fondo con ChatGPT/DALL·E (no Canva AI) y montar la portada encima.
- Cuando haya **cuentas + Metricool conectado**, podemos programar una semana entera de una sola corrida.

## Estado / pendientes relacionados
- Generador: ✅ listo y probado (3 categorías, links e imágenes verificados).
- Cuentas IG/FB: ⏳ las crea Vero.
- Conector Metricool en Claude Desktop: ⏳ pendiente.
- (Aparte) Enriquecer 30 portadas faltantes: necesita `GOOGLE_BOOKS_API_KEY`.
