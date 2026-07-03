import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local","utf-8");
for (const l of env.split("\n")){ if(l.startsWith("#")||!l.includes("="))continue; const i=l.indexOf("="); const k=l.slice(0,i).trim(); if(!process.env[k])process.env[k]=l.slice(i+1).trim(); }
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await s.from("listings").select("*").eq("seller_id","2201d163-4423-4971-91f0-f6cebd00d1bd").limit(1);
console.log("columnas listings:", Object.keys(data?.[0]??{}).filter(c=>/view|visit|popular|count|seen|hits/i.test(c)));
console.log("TODAS:", Object.keys(data?.[0]??{}).join(", "));
