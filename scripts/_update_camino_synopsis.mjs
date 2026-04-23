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

const BOOK_ID = "ac4d7d77-8264-47db-b1b4-b8b3b3ad4698";

const newDescription = `Análisis de Bill Gates, publicado en 1995, sobre el impacto de las tecnologías de la información en la sociedad y sus predicciones para el futuro. Recorre desde las máquinas de cálculo antiguas y los grandes mainframes hasta la revolución de la computación personal. Cuenta los primeros años de Microsoft, Apple y Steve Jobs, DEC y Compaq, IBM y los compatibles. También aborda el rol central del software: su complejidad, potencia y costo de producción.`;

const { error } = await s
  .from("books")
  .update({ description: newDescription })
  .eq("id", BOOK_ID);

if (error) {
  console.error("Error:", error);
  process.exit(1);
}

console.log("✅ Sinopsis actualizada al español:");
console.log("---");
console.log(newDescription);
console.log("---");
