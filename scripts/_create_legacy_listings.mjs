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
const VERO_ID = "2201d163-4423-4971-91f0-f6cebd00d1bd";

// Chequear distinct status de listings para ver si hay draft
const { data: statuses } = await s.from("listings").select("status");
const unique = [...new Set((statuses||[]).map(l => l.status))];
console.log("Status existentes en listings:", unique);

// Chequear si los libros ya existen
const { data: paideia } = await s.from("books").select("id,title,author").ilike("title","%paideia%").limit(5);
const { data: urban } = await s.from("books").select("id,title,author").ilike("title","%lenguaje y realidad%").limit(5);
console.log("\nPaideia matches:", paideia);
console.log("Urban matches:", urban);

// Schema de books
const { data: sample } = await s.from("books").select("*").limit(1);
console.log("\nBooks columns:", Object.keys(sample?.[0]||{}).join(", "));
