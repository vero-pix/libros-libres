import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const hav=(la1,lo1,la2,lo2)=>{const R=6371,dLa=(la2-la1)*Math.PI/180,dLo=(lo2-lo1)*Math.PI/180;const a=Math.sin(dLa/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));};
// candidatas (las que NO están aún)
const cand={
  rancagua:{lat:-34.1708,lng:-70.7444,r:20}, talca:{lat:-35.4264,lng:-71.6554,r:25},
  iquique:{lat:-20.2307,lng:-70.1357,r:20}, "puerto-montt":{lat:-41.4693,lng:-72.9424,r:25},
  chillan:{lat:-36.6066,lng:-72.1034,r:20}, valdivia:{lat:-39.8142,lng:-73.2459,r:20},
  arica:{lat:-18.4783,lng:-70.3126,r:20}, coquimbo:{lat:-29.9533,lng:-71.3436,r:15},
  rancagua2:{lat:-34.17,lng:-70.74,r:30}, osorno:{lat:-40.5739,lng:-73.1335,r:20},
};
// traer listings con coords
let ls=[],from=0;
while(true){const {data}=await s.from("listings").select("latitude,longitude").eq("status","active").not("latitude","is",null).range(from,from+999);if(!data||!data.length)break;ls.push(...data);if(data.length<1000)break;from+=1000;}
console.log(`Listings con coords: ${ls.length}\n`);
console.log("Stock cerca de cada ciudad CANDIDATA:");
for(const [c,g] of Object.entries(cand)){
  if(c==="rancagua2")continue;
  const n=ls.filter(l=>hav(g.lat,g.lng,l.latitude,l.longitude)<=g.r).length;
  console.log(`  ${n>=3?"✅":"⚠️ "} ${n.toString().padStart(3)} libros — ${c}`);
}
