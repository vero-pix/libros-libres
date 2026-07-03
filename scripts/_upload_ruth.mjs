import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const RUTH="992f25fd-09ed-4d5a-a471-f6e56d3cff86";
const ADDR="Puerto Varas, Región de Los Lagos, Chile", LAT=-41.31714, LNG=-72.98556;

const CAT={"Novela romántica":"ficcion","Fantasía":"ficcion","Novela histórica":"ficcion","Juvenil":"infantil-juvenil"};
const slugify=(t)=>t.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,50);

function parseCsv(text){const lines=text.split("\n").filter(l=>l.trim());const hdr=lines[0].split(",");return lines.slice(1).map(line=>{
  const f=[];let c="",q=false;for(const ch of line){if(ch==='"')q=!q;else if(ch===","&&!q){f.push(c.trim());c="";}else c+=ch;}f.push(c.trim());
  const o={};hdr.forEach((h,i)=>o[h.trim()]=f[i]??"");return o;});}

async function cover(t,a){try{
  const u=`https://openlibrary.org/search.json?title=${encodeURIComponent(t)}&author=${encodeURIComponent(a)}&limit=4&fields=cover_i`;
  let j=await (await fetch(u)).json();
  for(const d of j.docs??[])if(d.cover_i)return `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
  j=await (await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(t+" "+a)}&limit=6&fields=cover_i`)).json();
  for(const d of j.docs??[])if(d.cover_i)return `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
}catch{}return null;}

const rows=parseCsv(fs.readFileSync("docs/carga_ruth_jun2026.csv","utf-8"));
const { data: existing }=await s.from("listings").select("book:books(title)").eq("seller_id",RUTH);
const have=new Set((existing??[]).map(l=>(l.book?.title||"").toLowerCase().trim()));

let ok=0,skip=0,fail=0,nocover=0;
for(const r of rows){
  const title=r.titulo,author=r.autor,price=parseInt(r.precio,10);
  if(have.has(title.toLowerCase().trim())){skip++;console.log(`— skip (ya existe): ${title}`);continue;}
  const cov=await cover(title,author); if(!cov)nocover++;
  const category=CAT[r.categoria]||"ficcion";
  const { data: book, error: be }=await s.from("books").insert({title,author,isbn:null,cover_url:cov,genre:r.categoria||null,category,created_by:RUTH}).select("id").single();
  if(be){fail++;console.log(`✗ book ${title}: ${be.message}`);continue;}
  const slug=slugify(title)+"-"+(Date.now().toString(36).slice(-3))+ok;
  const { error: le }=await s.from("listings").insert({book_id:book.id,seller_id:RUTH,price,condition:"good",modality:"sale",cover_image_url:cov,address:ADDR,latitude:LAT,longitude:LNG,status:"active",slug});
  if(le){fail++;console.log(`✗ listing ${title}: ${le.message}`);continue;}
  ok++;console.log(`✓ ${title} · $${price} · ${cov?"con portada":"SIN portada"}`);
  await new Promise(r=>setTimeout(r,180));
}
console.log(`\n━━━ RESULTADO ━━━\nSubidos: ${ok} · Saltados: ${skip} · Fallidos: ${fail} · Sin portada: ${nocover}`);
const { count }=await s.from("listings").select("*",{count:"exact",head:true}).eq("seller_id",RUTH).eq("status","active");
console.log(`Total activos de Ruth ahora: ${count}`);
