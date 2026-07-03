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
const backup = JSON.parse(fs.readFileSync("scripts/_revert_50_liquidacion.json", "utf-8"));

let restored = 0, missing = 0, alreadyOk = 0, sumDiscounted = 0, sumRestored = 0;
const fmt = (n) => "$" + (n ?? 0).toLocaleString("es-CL");

for (const b of backup) {
  const { data: cur, error } = await s.from("listings")
    .select("id, price, original_price, status, book:books(title)")
    .eq("id", b.id).maybeSingle();
  if (error) { console.log("ERR", b.id, error.message); continue; }
  if (!cur) { missing++; continue; }
  // Si ya no tiene descuento (original_price null o ya está al precio lleno), saltar
  if ((cur.original_price ?? null) === null && cur.price === b.price) { alreadyOk++; continue; }
  sumDiscounted += cur.price;
  sumRestored += b.price;
  restored++;
  if (APPLY) {
    const { error: e } = await s.from("listings")
      .update({ price: b.price, original_price: b.original_price ?? null })
      .eq("id", b.id);
    if (e) console.log("  ⚠️", cur.book?.title, e.message);
  }
}

console.log(`${APPLY ? "✅ APLICADO" : "🔍 DRY-RUN"} — quitar descuento 50% de TusLibros (Vero)`);
console.log(`En respaldo: ${backup.length} | a restaurar: ${restored} | ya sin descuento: ${alreadyOk} | no encontrados: ${missing}`);
console.log(`Suma con 50%:     ${fmt(sumDiscounted)}`);
console.log(`Suma restaurada:  ${fmt(sumRestored)}`);
