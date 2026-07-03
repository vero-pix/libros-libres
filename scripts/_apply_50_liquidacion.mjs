import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("="); const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");
const VERO = "2201d163-4423-4971-91f0-f6cebd00d1bd";

const { data: rows, error } = await s.from("listings")
  .select("id, price, original_price, book:books(title)")
  .eq("seller_id", VERO).eq("status", "active");
if (error) { console.log("ERR", error.message); process.exit(1); }

const round100 = (n) => Math.max(1000, Math.round(n / 100) * 100);
const revert = [];
let sumBefore = 0, sumAfter = 0, changed = 0, skipped = 0;
const highValue = [];

for (const l of rows) {
  // precio "lleno" = el tachado si ya hay descuento, si no el precio actual
  const full = (l.original_price && l.original_price > l.price) ? l.original_price : l.price;
  const target = round100(full * 0.5);
  const newPrice = Math.min(l.price, target); // nunca subir
  sumBefore += l.price;
  if (newPrice === l.price && (l.original_price ?? null) === full) { skipped++; sumAfter += l.price; continue; }
  revert.push({ id: l.id, price: l.price, original_price: l.original_price ?? null });
  sumAfter += newPrice;
  changed++;
  if (full >= 30000) highValue.push(`  $${full.toLocaleString("es-CL")} → $${newPrice.toLocaleString("es-CL")}  "${l.book?.title}"`);
  if (APPLY) {
    const { error: e } = await s.from("listings").update({ original_price: full, price: newPrice }).eq("id", l.id);
    if (e) console.log("  ⚠️", l.book?.title, e.message);
  }
}

console.log(`${APPLY ? "✅ APLICADO" : "🔍 DRY-RUN"} — liquidación 50% TusLibros`);
console.log(`Activos: ${rows.length} | a cambiar: ${changed} | ya estaban ≤50%: ${skipped}`);
console.log(`Valor pedido antes: $${sumBefore.toLocaleString("es-CL")}`);
console.log(`Valor pedido 50%:   $${sumAfter.toLocaleString("es-CL")}`);
console.log(`\nLibros caros (≥$30.000 lleno) que quedan al 50%:`);
console.log(highValue.length ? highValue.join("\n") : "  (ninguno)");
if (APPLY) {
  fs.writeFileSync("scripts/_revert_50_liquidacion.json", JSON.stringify(revert, null, 2));
  console.log(`\n💾 Reversa guardada en scripts/_revert_50_liquidacion.json (${revert.length} libros)`);
}
