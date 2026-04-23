# Data Room — Checklist tuslibros.cl
Estructura recomendada para carpeta compartida en Google Drive cuando un ángel pase a due diligence.

---

## 📁 Estructura propuesta

```
/tuslibros_dataroom/
├── 00_QUICK_READ/
│   ├── one_pager.pdf
│   ├── deck_valorizacion.pdf
│   └── resumen_ejecutivo.pdf
├── 01_COMPANY/
│   ├── estatutos_SpA.pdf
│   ├── certificado_vigencia.pdf
│   ├── rut_empresa.pdf
│   └── cap_table.xlsx
├── 02_PRODUCT/
│   ├── screenshots/
│   │   ├── home.png
│   │   ├── listing_detail.png
│   │   ├── checkout.png
│   │   ├── admin_panel.png
│   │   └── seller_dashboard.png
│   ├── demo_video.mp4  (opcional, 2-3 min)
│   └── arquitectura_tecnica.pdf
├── 03_TRACTION/
│   ├── GA4_30d_screenshot.pdf
│   ├── GA4_paginas_30d.pdf
│   ├── supabase_metricas.xlsx
│   ├── users_registrados.csv
│   ├── orders_detalle.csv
│   └── funnel_conversion.pdf
├── 04_FINANCIALS/
│   ├── proyeccion_36_meses.xlsx
│   ├── bear_base_bull_scenarios.pdf
│   ├── unit_economics.pdf
│   └── uso_fondos_6_meses.pdf
├── 05_LEGAL/
│   ├── terminos_condiciones.pdf
│   ├── politica_privacidad.pdf
│   ├── contratos_proveedores/
│   │   ├── mercadopago_acuerdo.pdf
│   │   ├── shipit_integracion.pdf
│   │   ├── vercel_plan.pdf
│   │   └── supabase_plan.pdf
│   └── borrador_SAFE.pdf
├── 06_MARKET/
│   ├── TAM_SAM_SOM_analisis.pdf
│   ├── competencia_matrix.pdf
│   ├── camara_chilena_libro_stats.pdf
│   └── referencias_bibliograficas.md
├── 07_TEAM/
│   ├── cv_veronica_velasquez.pdf
│   ├── advisors_asesores.pdf  (si aplica)
│   └── referencias_profesionales.md
├── 08_ROADMAP/
│   ├── roadmap_12_meses.pdf
│   ├── hitos_6_meses.pdf
│   └── kit_metralleta_GTM.pdf
└── 09_PRESS_SOCIAL/
    ├── testimonio_zdravko.pdf
    ├── screenshots_reddit_linkedin.pdf
    └── mentions_organicas.md
```

---

## ✅ Checklist de qué tener listo antes de compartir

### Essentials (no compartir data room sin esto)
- [ ] **One-pager** en PDF (`docs/one_pager_tuslibros.html` → exportar PDF)
- [ ] **Deck 11 slides** en PDF (`docs/deck_valorizacion.pptx` o .html → exportar PDF)
- [ ] **Estatutos SpA** firmados y escriturados (si no hay SpA, constituir primero)
- [ ] **Cap table actualizado** — Excel con porcentajes de propiedad
- [ ] **Proyección 36 meses** — la XLSX con 3 escenarios y supuestos editables
- [ ] **Métricas GA4** — screenshot últimos 30d + páginas top
- [ ] **Export Supabase** — CSV de users, orders, listings clave

### Nice-to-have (sube credibilidad pero no bloquea)
- [ ] Video demo de producto 2-3 min (Loom o grabación pantalla)
- [ ] Testimonio en PDF con foto del email autorizado por Z.
- [ ] Contratos con proveedores (MercadoPago, Shipit, Vercel, Supabase)
- [ ] CV formal de Verónica en PDF (1 página, diseño limpio)
- [ ] Referencias profesionales (2-3 personas dispuestas a recibir llamada)

### Solo si llega a due diligence seria
- [ ] Estados financieros (simples, porque no hay mucho que mostrar)
- [ ] Planillas de gastos últimos 6 meses
- [ ] Todas las facturas de servicios (Vercel, Supabase, dominios)
- [ ] Backup completo de la base de datos con timestamp
- [ ] Documentación técnica: diagrama arquitectura, schema BD, integraciones

---

## 🔐 Permisos de acceso

**Estructura recomendada:**

| Audiencia | Acceso | Enlace |
|---|---|---|
| Cold outreach (ángeles sin reunión aún) | Solo `00_QUICK_READ/` | Link específico de Drive a esa carpeta |
| Post primera reunión | Carpetas 00-03, 06 | Link al data room completo con carpetas específicas bloqueadas |
| Due diligence activa (term sheet propuesto) | Todo menos `05_LEGAL/borrador_SAFE.pdf` | Link completo |
| Ángel con SAFE firmado | Todo | Link completo + propietario de archivos |

**Reglas de seguridad:**
- Drive en modo "cualquiera con el enlace puede **ver**" — nunca editar
- Archivos individuales con restricción de descarga cuando tenga sentido
- Desactivar acceso de contactos que no cerraron después de 60 días
- Usar Google Analytics de Drive para ver quién abrió qué y cuándo (te da señal de interés real)

---

## ⚠️ Qué NO poner en data room

- **Credenciales**: API keys, passwords, service role keys Supabase. NUNCA.
- **Base de datos en vivo**: no compartir link a admin panel ni acceso directo a Supabase
- **Datos personales de compradores**: emails, teléfonos reales solo con consentimiento explícito
- **Conversaciones privadas** con otros ángeles o competidores
- **Financieros personales** de la founder (salario, deudas, etc.)
- **Código fuente completo**: si piden repo, compartir branch específico con README técnico, no main completo

---

## 📊 Métricas clave que un ángel preguntará

Prepara respuestas concretas (tenerlas escritas evita improvisar mal):

| Métrica | Respuesta preparada |
|---|---|
| CAC | No tenemos CAC aún — 3 librerías llegaron orgánicamente. Proyectado CAC con marketing: $5-15k CLP por vendedor activo, $1.5-3k CLP por comprador. |
| LTV | LTV estimado librería: $150-300k CLP anuales (30-60 transacciones × $5-10k CLP margen). LTV comprador: $30-80k CLP anuales. |
| Payback | < 6 meses proyectado con marketing efectivo |
| Retention | Aún temprano para medir (18 días). Proxy: 8 users en /publish con >7min de tiempo, 51 en /login. |
| Take rate | 10% efectivo blended (8% comisión venta + 2% fee envío) |
| Burn | USD 45/mes. Se escala según plan. |
| Runway sin capital | Indefinido con ingresos personales de Verónica |
| Runway con capital | 12-18 meses con USD 50k |
| Cuánto tiempo hasta break-even | Escenario base: mes 20. Bull: mes 14. |

---

## 📞 Preparar referencias profesionales

Pide a 3 personas que acepten recibir llamada del ángel. Dales heads-up antes.

Buenos perfiles:
- Ex-cliente economics.cl (valida seriedad profesional)
- Profesor universitario (ESE, PUC, UDD) que pueda hablar de su criterio
- Founder de otra startup que haya visto tu velocity

Sin referencias, el ángel infiere. Con 3 referencias buenas, baja el riesgo percibido 30%.
