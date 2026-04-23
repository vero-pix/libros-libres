import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: vero } = await s.from("users").select("id,username,default_address,default_latitude,default_longitude").eq("username","vero").single();
console.log("Vero:", vero);
// Sample vero listing para ver campos
const { data: sample } = await s.from("listings").select("*").eq("seller_id", vero.id).limit(1);
console.log("\nCampos listings:", Object.keys(sample?.[0]||{}));
console.log("Sample listing values:", sample?.[0]);
