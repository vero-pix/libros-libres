import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from('listings').select('id, cover_image_url, book:books(cover_url)').eq('status','active').eq('featured',false);
let conCover=0, sin=0;
for(const l of data){ if(l.cover_image_url || l.book?.cover_url) conCover++; else sin++; }
console.log('No-destacados activos:', data.length);
console.log('  con portada usable (cover_image_url o book.cover_url):', conCover);
console.log('  SIN portada:', sin);
