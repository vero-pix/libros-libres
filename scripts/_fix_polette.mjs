import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const UID="2511a774-142d-40c9-809a-44d31a84f161";

// 1. Categorizar libros sin categoría
const {data:ls}=await s.from("listings").select("book_id,book:books(title,category)").eq("seller_id",UID);
const toFix=(ls??[]).filter(l=>!l.book?.category);
console.log(`Categorizando ${toFix.length} libros → ficcion/ficcion-novela:`);
for(const l of toFix){
  const {error}=await s.from("books").update({category:"ficcion",subcategory:"ficcion-novela"}).eq("id",l.book_id);
  console.log(error?`  ⚠️ ${l.book?.title}: ${error.message}`:`  ✅ ${l.book?.title}`);
}

// 2. Backfill comuna
const {data:u}=await s.from("users").select("city,default_address").eq("id",UID).single();
if(!u.city && u.default_address){
  const parts=u.default_address.split(",").map(x=>x.trim());
  const comuna=parts[1]||null; // "Conchalí"
  if(comuna){const {error}=await s.from("users").update({city:comuna}).eq("id",UID);
    console.log(`\nComuna: city=null → "${comuna}" ${error?"⚠️ "+error.message:"✅"}`);}
} else console.log("\nComuna ya seteada:",u.city);
