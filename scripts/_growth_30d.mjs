import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const ISO=(d)=>new Date(Date.now()-d*864e5).toISOString();
const c=async(t,col,from,extra)=>{let q=s.from(t).select("*",{count:"exact",head:true}).gte(col,from);if(extra)q=extra(q);const{count}=await q;return count??0;};
const tot=async(t,extra)=>{let q=s.from(t).select("*",{count:"exact",head:true});if(extra)q=extra(q);const{count}=await q;return count??0;};

const listAhora=await tot("listings",q=>q.eq("status","active"));
const list30=await c("listings","created_at",ISO(30),q=>q.eq("status","active"));
const listHace30=listAhora-list30;
console.log(`LIBROS activos: hace 30d ≈ ${listHace30} → hoy ${listAhora}  (+${list30} este mes)`);

const uAhora=await tot("users");
const u30=await c("users","created_at",ISO(30));
console.log(`USUARIOS: hace 30d ≈ ${uAhora-u30} → hoy ${uAhora}  (+${u30} este mes)`);

// vendedores con catálogo: aproximación por listings
const {data:ls}=await s.from("listings").select("seller_id,created_at").eq("status","active");
const all=new Set(),mes=new Set(),hace=new Set();
for(const l of (ls??[])){all.add(l.seller_id); if(new Date(l.created_at).getTime()>Date.now()-30*864e5)mes.add(l.seller_id); else hace.add(l.seller_id);}
console.log(`VENDEDORES activos: hace 30d ≈ ${hace.size} → hoy ${all.size}`);

const subsAhora=await tot("newsletter_subscribers");
const subs30=await c("newsletter_subscribers","created_at",ISO(30)).catch(()=>"?");
console.log(`NEWSLETTER subs: hoy ${subsAhora} (+${subs30} este mes)`);

const reqAbiertos=await tot("book_requests",q=>q.eq("fulfilled",false));
console.log(`'Se busca' abiertos: ${reqAbiertos}`);
