import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local","utf-8");
for (const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const row = { slug: "academico-manuales", name: "Manuales de estudio", parent_slug: "academico", sort_order: 4 };
const { error } = await s.from("categories").upsert(row, { onConflict: "slug" });
if (error) { console.log("⚠️ error:", error.message); process.exit(1); }

// verificar: listar hijos de academico
const { data } = await s.from("categories").select("slug, name, sort_order").eq("parent_slug","academico").order("sort_order");
console.log("✅ Subcategorías de Académico ahora:");
for (const r of data) console.log(`  ${r.sort_order}. ${r.name} (${r.slug})`);
