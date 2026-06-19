# Reportes SEO vía Google Search Console API

Mide el SEO de tuslibros.cl con datos reales de Google (reemplaza a SEMrush, que expiró).
Cada corte es reproducible y comparable contra la línea base congelada el **26 may 2026**.

> Los comentarios y la salida están en español chileno. Estos scripts **no aplican fixes**: solo miden y diagnostican.

---

## Setup manual previo (lo hace Verónica una vez, ~30-45 min)

Requiere consola de Google Cloud con login humano. Claude no lo ejecuta.

1. **Google Cloud** → crear o reutilizar proyecto → *APIs y servicios* → habilitar **"Google Search Console API"**.
2. **Service account** → *IAM → Cuentas de servicio* → crear → generar clave **JSON** → descargar.
3. **Permiso en GSC** → *Search Console → Configuración → Usuarios y permisos* → agregar el email del service account (termina en `...iam.gserviceaccount.com`) con permiso **Restringido** (lectura basta).
4. **Credenciales en el proyecto** → guardar el JSON **fuera del repo** (o dentro pero ignorado por git) y referenciarlo por env. Agregar a `.env.local`:

   ```
   GSC_SITE_URL=sc-domain:tuslibros.cl
   GOOGLE_APPLICATION_CREDENTIALS=/ruta/absoluta/gsc-service-account.json
   ```

   - Si tu propiedad de GSC es de tipo **prefijo de URL** (no dominio), usa `GSC_SITE_URL=https://tuslibros.cl/`.
   - **NUNCA commitear la clave.** Ya está ignorada en `.gitignore` (`*-service-account.json`, `scripts/seo/output/`, `scripts/seo/input/`).

---

## Comandos

```bash
npm run seo:gsc                                   # consultas + páginas, últimos 28d (hasta hace 3)
npm run seo:gsc -- --start 2026-06-01 --end 2026-06-17
npm run seo:gsc -- --dimension page               # solo tabla por página
npm run seo:sitemaps                              # estado de los sitemaps enviados
npm run seo:audit-404                             # clasifica los 404 de GSC (requiere input, ver abajo)
```

Salidas en `scripts/seo/output/` (ignorado por git):
- `gsc-<endDate>.json` — datos crudos de Search Analytics
- `comparativa-<endDate>.csv` — baseline vs actual por keyword
- `audit-404-<fecha>.csv` — 404 clasificados por set

---

## `seo:audit-404` — input manual requerido

La API **no** expone la lista de URLs del reporte "Páginas" con su motivo. Hay que exportarla a mano:

1. GSC → **Páginas** → motivo **"No se ha encontrado (404)"** → **Exportar** (CSV).
2. Guardar en `scripts/seo/input/404-gsc.csv`.
3. (Opcional) Repetir con el motivo **"Soft 404"** → `scripts/seo/input/soft404-gsc.csv`.
4. Correr `npm run seo:audit-404`.

El script clasifica cada URL contra la verdad de terreno (Supabase):

| Set | Qué es | Acción |
|---|---|---|
| **A** | El sitemap declara una URL de ficha que no está activa | Distingue severidad: **pausada/vendida** → renderiza 200, solo es caché stale del sitemap (baja). **borrada** → 308→home, sí excluir del sitemap (crítica). |
| **B** | Ficha vendida/eliminada; el vendedor todavía existe | Decidir política: 410 Gone o redirect al perfil/categoría. Hoy hace **308→home = soft-404**. |
| **C** | URL legacy / username inexistente / enlace interno roto | Revisión manual. |
| **soft404** | 200 con contenido vacío o redirect a home | noindex temporal o contenido mínimo / redirect relevante. |

### Diagnóstico previo (19 jun 2026)

Verificado contra el código antes de codear:
- `app/sitemap.ts` filtra `.eq("status","active")` y topa en 1000 → **el sitemap está limpio**, Set A saldrá casi vacío.
- `app/(main)/libro/[username]/[slug]/page.tsx`: ficha **vendida** → `getListing` no filtra status → renderiza con schema `SoldOut` (no es 404, indexada a propósito). Ficha **borrada** o con slug/username cambiado → `permanentRedirect("/")` = **308 al home** → Google lo marca **soft-404**.
- **Conclusión:** los ~1.154 "404" y 97 soft-404 de GSC vienen de URLs históricas que Google retiene + el patrón 308→home, **no** del sitemap. Por eso este script lidera con la lista exportada de GSC, no con el cruce sitemap↔Supabase.

---

## Línea base (26 may 2026)

En `baseline.ts`. Es el último corte de SEMrush antes de que expirara. Keys en minúscula sin tildes para match estable con GSC. Delta positivo = la keyword **mejoró** (subió en el ranking).

---

## Limitaciones conocidas

- **Reporte "Páginas" (indexadas vs excluidas con motivo):** NO está en la API. Leer a mano en la UI de GSC. Por eso `seo:audit-404` pide el CSV exportado.
- **Lag de datos:** GSC tarde ~2-3 días en consolidar. Por eso el default termina hace 3 días con `dataState: 'final'`.
- **Cuota URL Inspection (Tarea 5):** ~2.000 consultas/día, 1 URL por llamada. La Tarea 5 (`url-inspection.ts`) está como scaffold con TODO; implementar con throttling (~600ms) y reanudación.

---

## Troubleshooting

- **`seo:gsc` vuelve vacío:** propiedad mal especificada (dominio `sc-domain:` vs prefijo `https://`), o el service account no fue agregado como usuario en GSC.
- **Error de auth:** `GOOGLE_APPLICATION_CREDENTIALS` no apunta al JSON, o el JSON es de otro proyecto/cuenta.
- **`seo:sitemaps` no lista nada:** no hay sitemaps enviados; enviar `https://tuslibros.cl/sitemap.xml` desde GSC → Sitemaps.
