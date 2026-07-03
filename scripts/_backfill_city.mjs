import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");

// Comuna = el componente inmediatamente anterior al que contiene "Región"
function cityFromAddress(addr){
  if(!addr) return null;
  const parts = addr.split(",").map(p=>p.trim()).filter(Boolean);
  const ri = parts.findIndex(p=>/Regi[oó]n/i.test(p));
  if(ri>0) return parts[ri-1];
  return null;
}

// Todos los usuarios sin city pero con dirección
const { data: users } = await s.from("users").select("id,full_name,username,city,default_address").or("city.is.null,city.eq.");
const targets = (users??[]).filter(u=>(!u.city||!u.city.trim()) && u.default_address);

console.log(`Usuarios sin ciudad y con dirección: ${targets.length}\n`);
let ok=0, fail=0;
for(const u of targets){
  const city = cityFromAddress(u.default_address);
  if(!city){ console.log(`  ⚠️ NO PARSEABLE — ${u.full_name}: "${u.default_address}"`); fail++; continue; }
  console.log(`  ${u.full_name} → ${city}`);
  if(APPLY){
    const { error } = await s.from("users").update({ city }).eq("id", u.id);
    if(error){ console.log(`     ❌ ${error.message}`); fail++; } else ok++;
  }
}
console.log(`\n${APPLY?`APLICADO: ${ok} actualizados, ${fail} fallidos/no-parseables`:`PREVIEW (no se escribió nada). Corre con --apply para guardar.`}`);
