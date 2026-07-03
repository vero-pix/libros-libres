import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from('users').select('*').ilike('full_name','%yllades%').single();
console.log('Columnas con "featur" o "rank" o "order":');
Object.keys(data).filter(k=>/featur|rank|order|priorit/i.test(k)).forEach(k=>console.log(`  ${k} = ${data[k]}`));
