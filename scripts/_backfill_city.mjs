import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes("--apply");

// Comuna = el componente inmediatamente anterior al que contiene "Región".
// Mismo criterio que comunaDesdeAddress() de lib/comuna.ts.
function cityFromAddress(addr){
  if(!addr) return null;
  const parts = addr.split(",").map(p=>p.trim()).filter(Boolean);
  const ri = parts.findIndex(p=>/Regi[oó]n/i.test(p));
  return ri>0 ? parts[ri-1] : null;
}

async function todas(tabla, cols){
  const out=[]; for(let f=0;;f+=1000){ const {data,error}=await s.from(tabla).select(cols).range(f,f+999);
    if(error) throw error; out.push(...data); if(data.length<1000) break; }
  return out; // Supabase corta en 1000 filas: paginar siempre
}

const users = await todas("users","id,full_name,username,city,default_address");
const listings = await todas("listings","seller_id,address,created_at");

// El mapa de /publish parte centrado en un punto fijo: quien nunca lo movió
// quedó con la MISMA dirección exacta que otros vendedores. Esas direcciones
// no dicen dónde está la persona — no sirven para deducir su comuna.
const vendedoresPorDir = {};
for(const l of listings){ if(l.address) (vendedoresPorDir[l.address] ??= new Set()).add(l.seller_id); }
const DEFAULTS = new Set(Object.entries(vendedoresPorDir).filter(([,v])=>v.size>1).map(([a])=>a));

const listingsPorVendedor = {};
for(const l of listings){ (listingsPorVendedor[l.seller_id] ??= []).push(l); }

const targets = users.filter(u=>!u.city||!u.city.trim());
console.log(`Usuarios sin ciudad: ${targets.length}`);
console.log(`Direcciones descartadas por ser el default del mapa: ${DEFAULTS.size}\n`);

let ok=0, fail=0, sospechosos=0, sinDato=0;
for(const u of targets){
  // 1º la dirección que el vendedor fijó en su perfil; si no, la de sus publicaciones.
  let fuente = u.default_address, origen = "perfil";
  if(!fuente){
    const propios = (listingsPorVendedor[u.id]??[]).filter(l=>l.address && !DEFAULTS.has(l.address));
    const conDefault = (listingsPorVendedor[u.id]??[]).some(l=>l.address && DEFAULTS.has(l.address));
    if(propios.length){
      fuente = propios.sort((a,b)=>(b.created_at??"").localeCompare(a.created_at??""))[0].address;
      origen = "publicación";
    } else if(conDefault){
      console.log(`  ⏭️  @${u.username??u.full_name} — solo tiene la dirección default del mapa, no se deduce`);
      sospechosos++; continue;
    }
  }
  if(!fuente){ sinDato++; continue; }
  const city = cityFromAddress(fuente);
  if(!city){ console.log(`  ⚠️  NO PARSEABLE — @${u.username??u.full_name}: "${fuente}"`); fail++; continue; }
  console.log(`  @${u.username??u.full_name} → ${city}  (${origen})`);
  if(APPLY){
    const { error } = await s.from("users").update({ city }).eq("id", u.id);
    if(error){ console.log(`     ❌ ${error.message}`); fail++; } else ok++;
  }
}
console.log(`\nsin ninguna dirección (nunca publicaron): ${sinDato}`);
console.log(`con solo el default del mapa (se saltaron): ${sospechosos}`);
console.log(APPLY ? `APLICADO: ${ok} actualizados, ${fail} fallidos` : `PREVIEW — no se escribió nada. Corre con --apply para guardar.`);
