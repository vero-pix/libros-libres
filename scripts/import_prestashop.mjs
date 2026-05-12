/**
 * import_prestashop.mjs
 * Importa el catálogo de una tienda PrestaShop a tuslibros.cl
 *
 * Uso:
 *   node scripts/import_prestashop.mjs
 *
 * Variables de entorno requeridas (en .env.local o como variables del sistema):
 *   PS_URL          → URL base de la tienda, ej: https://comunaliteraria.cl
 *   PS_API_KEY      → API key del webservice PrestaShop
 *   TL_API_KEY      → API key de tuslibros (generada en /perfil)
 *   TL_URL          → URL de tuslibros (default: https://tuslibros.cl)
 *   DRY_RUN         → "true" para simular sin crear nada (default: false)
 *   MAX_BOOKS       → límite de libros a importar (default: sin límite)
 *   PS_CATEGORY_ID  → filtrar por categoría PrestaShop (opcional)
 */

import { readFileSync } from "fs";
import { createInterface } from "readline";

// Cargar .env.local si existe
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
} catch {}

const PS_URL     = (process.env.PS_URL || "").replace(/\/$/, "");
const PS_API_KEY = process.env.PS_API_KEY || "";
const TL_API_KEY = process.env.TL_API_KEY || "";
const TL_URL     = (process.env.TL_URL || "https://tuslibros.cl").replace(/\/$/, "");
const DRY_RUN    = process.env.DRY_RUN === "true";
const MAX_BOOKS  = process.env.MAX_BOOKS ? parseInt(process.env.MAX_BOOKS) : Infinity;

if (!PS_URL || !PS_API_KEY || !TL_API_KEY) {
  console.error("❌ Faltan variables: PS_URL, PS_API_KEY o TL_API_KEY");
  console.error("   Configúralas en .env.local o como variables de entorno");
  process.exit(1);
}

const psHeaders = {
  Authorization: "Basic " + Buffer.from(`${PS_API_KEY}:`).toString("base64"),
  Accept: "application/json",
};
const tlHeaders = {
  Authorization: `Bearer ${TL_API_KEY}`,
  "Content-Type": "application/json",
};

async function psGet(path) {
  const url = `${PS_URL}/api/${path}${path.includes("?") ? "&" : "?"}output_format=JSON`;
  const res = await fetch(url, { headers: psHeaders });
  if (!res.ok) throw new Error(`PrestaShop ${path}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function tlPost(body) {
  const res = await fetch(`${TL_URL}/api/v1/listings`, {
    method: "POST",
    headers: tlHeaders,
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() };
}

// Mapeo de condición PrestaShop → tuslibros
function mapCondition(psCondition) {
  if (psCondition === "new") return "new";
  if (psCondition === "refurbished") return "good";
  return "good"; // used → good por defecto
}

// Extraer ISBN de los atributos/features de un producto
function extractIsbn(product) {
  const ref = product.reference || product.ean13 || product.isbn || "";
  if (/^978/.test(ref) || /^979/.test(ref)) return ref.replace(/[^0-9]/g, "");
  if (product.ean13 && /^97/.test(product.ean13)) return product.ean13;
  return null;
}

// Extraer nombre localizado (PrestaShop devuelve [{language: {value}}])
function localName(field) {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (Array.isArray(field)) {
    // Buscar español (id 1 en la mayoría) o el primero disponible
    const es = field.find(f => f.language?.id === "1" || f.language?.id === 1);
    const first = field[0];
    const val = (es || first)?.language?.value ?? (es || first)?.value ?? "";
    if (typeof val === "object") return val.value || "";
    return val;
  }
  return String(field);
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  IMPORTADOR PrestaShop → tuslibros.cl");
  console.log(`  Tienda: ${PS_URL}`);
  console.log(`  Destino: ${TL_URL}`);
  if (DRY_RUN) console.log("  ⚠️  MODO SIMULACIÓN — no se creará nada");
  console.log("═══════════════════════════════════════════════════\n");

  // 1. Obtener todos los productos
  console.log("📦 Obteniendo lista de productos desde PrestaShop...");
  const productsIndex = await psGet("products?limit=0&display=[id]");
  const allIds = (productsIndex.products || []).map(p => p.id);
  console.log(`   → ${allIds.length} productos encontrados en total`);

  const toProcess = allIds.slice(0, MAX_BOOKS);
  console.log(`   → Procesando ${toProcess.length} productos\n`);

  // 2. Obtener stock disponible
  console.log("📊 Obteniendo stock...");
  const stockData = await psGet("stock_availables?display=[id_product,quantity]&limit=0");
  const stockMap = {};
  for (const s of stockData.stock_availables || []) {
    stockMap[s.id_product] = parseInt(s.quantity) || 0;
  }

  // 3. Procesar cada producto
  let created = 0, skipped = 0, errors = 0;
  const errorLog = [];

  for (let i = 0; i < toProcess.length; i++) {
    const id = toProcess[i];
    process.stdout.write(`\r   [${i + 1}/${toProcess.length}] Procesando... (creados: ${created}, saltados: ${skipped}, errores: ${errors})`);

    try {
      const detail = await psGet(`products/${id}?display=full`);
      const p = detail.product;
      if (!p) { skipped++; continue; }

      const stock = stockMap[id] || 0;
      if (stock === 0) { skipped++; continue; } // sin stock, no publicar

      const title = localName(p.name);
      if (!title || title.length < 2) { skipped++; continue; }

      const price = parseFloat(p.price || 0);
      if (price <= 0) { skipped++; continue; }

      const description = localName(p.description_short) || localName(p.description) || "";
      const isbn = extractIsbn(p);
      const condition = mapCondition(p.condition);

      // Fabricante como autor (común en libros en PrestaShop)
      const manufacturer = p.manufacturer_name || "";

      const body = {
        title: title.trim(),
        author: manufacturer.trim() || "Autor desconocido",
        isbn: isbn || undefined,
        description: description.replace(/<[^>]+>/g, "").trim() || undefined,
        price: Math.round(price), // PrestaShop devuelve en pesos, redondear
        condition,
        modality: "sale",
      };

      if (!DRY_RUN) {
        const result = await tlPost(body);
        if (result.ok) {
          created++;
        } else {
          errors++;
          errorLog.push({ title, error: result.data?.error });
        }
      } else {
        created++; // En dry-run contar como éxito
      }

      // Pausa breve para no saturar la API
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 200));

    } catch (err) {
      errors++;
      errorLog.push({ id, error: err.message });
    }
  }

  console.log(`\n\n✅ Importación completada:`);
  console.log(`   Creados:  ${created}`);
  console.log(`   Saltados: ${skipped} (sin stock o datos incompletos)`);
  console.log(`   Errores:  ${errors}`);

  if (errorLog.length > 0) {
    console.log("\n⚠️  Primeros errores:");
    errorLog.slice(0, 5).forEach(e => console.log(`   - ${e.title || e.id}: ${e.error}`));
  }

  if (DRY_RUN) {
    console.log("\n💡 Esto fue una simulación. Quita DRY_RUN=true para importar de verdad.");
  }
}

main().catch(err => {
  console.error("\n❌ Error fatal:", err.message);
  process.exit(1);
});
