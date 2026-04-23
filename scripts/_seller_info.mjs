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
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await s.from("users").select("id, username, default_latitude, default_longitude, default_address").eq("id", "2201d163-4423-4971-91f0-f6cebd00d1bd").single();
console.log(JSON.stringify(data, null, 2));
