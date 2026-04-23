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

const englishWords = /\b(the|and|this|with|that|from|have|been|their|which|about|through|when|where|novel|story|world|life|his|her|they|them|will|would|should|was|were|are|him|she|who|what|our|your|book|author|writer)\b/gi;
const spanishWords = /\b(el|la|los|las|del|por|una|con|que|para|más|sobre|también|tiene|puede|fue|ser|hay|este|esta|como|desde|hasta|pero|sino|sus|nos|muy|cuando|donde|quien|autor|libro|obra|vida|mundo|historia|años|novela)\b/gi;

const { data: books } = await s
  .from("books")
  .select("id, title, author, description")
  .not("description", "is", null)
  .neq("description", "");

const candidates = [];
for (const b of books ?? []) {
  const d = b.description;
  if (!d || d.length < 20) continue;
  const enHits = (d.match(englishWords) ?? []).length;
  const esHits = (d.match(spanishWords) ?? []).length;
  if (enHits >= 5 && enHits > esHits * 2) {
    candidates.push({ ...b, enHits, esHits, enRatio: enHits / (esHits || 1) });
  }
}

candidates.sort((a, b) => b.enRatio - a.enRatio);

console.log(`Total libros con descripción: ${books?.length}`);
console.log(`Candidatos probable-inglés: ${candidates.length}\n`);

for (const c of candidates.slice(0, 40)) {
  console.log(`── ${c.id.slice(0, 8)}  en:${c.enHits}/es:${c.esHits} ──`);
  console.log(`   "${c.title}" ${c.author ? `— ${c.author}` : ""}`);
  console.log(`   ${c.description.slice(0, 180).replace(/\n/g, " ")}...\n`);
}

if (candidates.length > 40) {
  console.log(`...+${candidates.length - 40} más`);
}

// Guardar lista para siguiente paso (traducir)
fs.writeFileSync("/tmp/english_books_to_translate.json", JSON.stringify(candidates, null, 2));
console.log(`\nLista guardada en /tmp/english_books_to_translate.json (${candidates.length} libros)`);
