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

// Primera solicitud real: la del WhatsApp que recibió Vero (19 abril 2026)
const { data, error } = await s
  .from("book_requests")
  .insert({
    title: "El fin de la historia y el último hombre",
    author: "Francis Fukuyama",
    notes:
      "Solicitud real que llegó por WhatsApp el 19 de abril. La persona estaba buscando este libro específico y no lo encontró en el catálogo.",
  })
  .select()
  .single();

if (error) {
  console.error("Error:", error);
  process.exit(1);
}

console.log("✅ Primera solicitud creada:");
console.log(`   ${data.id}`);
console.log(`   "${data.title}" de ${data.author}`);
