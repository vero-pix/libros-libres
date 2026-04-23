import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const c = fs.readFileSync(envPath, "utf-8");
for (const line of c.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const idx = line.indexOf("=");
  const k = line.slice(0, idx).trim();
  if (!process.env[k]) process.env[k] = line.slice(idx + 1).trim();
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ids = [
  "a6da74ff-e796-400d-b766-72b26e9d63d9", // Hitler Y El Universo Hitleriano
  "2bc30ba7-ea52-4840-b11d-a6f77eecab37", // El Juicio De Adolf Hitler
];

const { error } = await s
  .from("listings")
  .update({ deprioritized: true })
  .in("id", ids);

if (error) {
  console.error("ERROR:", error);
  process.exit(1);
}

const { data } = await s
  .from("listings")
  .select("id, deprioritized, books(title)")
  .in("id", ids);

console.log("DESPUES:", JSON.stringify(data, null, 2));
