import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) { if (line.startsWith("#") || !line.includes("=")) continue; const i = line.indexOf("="); const k = line.slice(0, i).trim(); if (!process.env[k]) process.env[k] = line.slice(i + 1).trim(); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await s.from("users").select("*").limit(1);
console.log("columnas de users:", Object.keys(data?.[0] ?? {}).filter(k=>/city|comuna|region|address/i.test(k)).join(", ") || "(ninguna de ciudad)");
const { count: total } = await s.from("users").select("id", { count: "exact", head: true });
const { count: sin } = await s.from("users").select("id", { count: "exact", head: true }).is("city", null);
console.log(`usuarios: ${total} · sin ciudad: ${sin}`);
