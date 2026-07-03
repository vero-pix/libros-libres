import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path";
const __d = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__d, "../.env.local"), "utf-8");
for (const l of env.split("\n")) { if (l.startsWith("#")||!l.includes("="))continue; const i=l.indexOf("="); const k=l.slice(0,i).trim(); if(!process.env[k])process.env[k]=l.slice(i+1).trim(); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CONFIRM = process.argv.includes("--confirm");
const CONSUMER=/@(gmail|hotmail|outlook|live|yahoo|ymail|icloud|me|mac|proton|protonmail|pm|gmx|fastmail|aol|msn|zoho|mail)\.(com|es|cl|net|me)$/i;
const SHAPE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isBot=(e)=>{e=(e||"").trim().toLowerCase(); if(!e||!SHAPE.test(e))return true; const d="@"+(e.split("@")[1]||""); if(CONSUMER.test(e))return false; if(/\.cl$/i.test(e))return false; if(/\.(uchile|uc|usach|udec|duoc|puc)\.cl$/i.test(d))return false; return true;};
const { data: us } = await s.from("users").select("email");
const reg = new Set((us??[]).map(u=>(u.email||"").toLowerCase()).filter(Boolean));
const { data } = await s.from("newsletter_subscribers").select("email");
const del = (data??[]).map(r=>r.email).filter(e=>!reg.has((e||"").toLowerCase()) && isBot(e));
const protectedByUser = (data??[]).map(r=>r.email).filter(e=>reg.has((e||"").toLowerCase()) && isBot(e));
console.log(`\n${CONFIRM?"🗑️ BORRANDO":"🔎 DRY"} — ${del.length} a borrar de ${data?.length} suscriptores`);
if(protectedByUser.length) console.log(`🛡️  protegidos por ser usuarios registrados: ${protectedByUser.join(", ")}`);
if(CONFIRM){
  let ok=0; for(const e of del){ const {error}=await s.from("newsletter_subscribers").delete().eq("email",e); if(!error)ok++; }
  console.log(`\n✅ Borrados ${ok}/${del.length}.`);
} else {
  console.log(`\nMuestra de lo que borra (12):`); del.slice(0,12).forEach(e=>console.log("  🗑️ "+e));
  console.log(`\nPara borrar: node scripts/_purge_subs_bots.mjs --confirm`);
}
