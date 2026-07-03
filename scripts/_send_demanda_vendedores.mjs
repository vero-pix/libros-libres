import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND=process.env.RESEND_API_KEY;
const VERO="2201d163-4423-4971-91f0-f6cebd00d1bd";

let ls=[],from=0;
while(true){const {data}=await s.from("listings").select("seller_id").eq("status","active").range(from,from+999);if(!data||!data.length)break;ls.push(...data);if(data.length<1000)break;from+=1000;}
const counts={}; for(const l of ls) counts[l.seller_id]=(counts[l.seller_id]||0)+1;
const {data:us}=await s.from("users").select("id,full_name,email").in("id",Object.keys(counts));
const dest=(us??[]).filter(u=>u.email && u.id!==VERO && u.email!=="vero@tuslibros.cl" && !/test|noreply/.test(u.email));

const html=(nombre)=>`
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  <p>Hola${nombre?` ${nombre}`:""} 👋</p>
  <p>Soy Vero, de tuslibros.cl. Te paso un dato que te puede ayudar a vender: revisé qué busca la gente en el sitio y <strong>no encuentra</strong>. Es demanda real esperando a que alguien la suba. Si tienes alguno de estos, es casi venta segura:</p>
  <p style="margin:14px 0 4px"><strong>📚 Fantasía y ciencia ficción</strong> (lo más buscado)<br>
  <span style="color:#444">Isaac Asimov · Brandon Sanderson · Juego de Tronos · Terramar y La Dama del Lago · Dune · Narnia · Laura Gallego · Un Monstruo Viene a Verme</span></p>
  <p style="margin:14px 0 4px"><strong>📖 Clásicos y novela</strong><br>
  <span style="color:#444">Fahrenheit 451 · Stephen King (Cujo) · Forrest Gump · De Profesión Fantasma · Adiós al Séptimo de Línea</span></p>
  <p style="margin:14px 0 4px"><strong>🎓 Universitarios y técnicos</strong> (venta rápida)<br>
  <span style="color:#444">Python · Psicoanálisis · Finanzas · Dietoterapia</span></p>
  <p style="margin:14px 0 4px"><strong>🇨🇱 Chilenos y religiosos</strong><br>
  <span style="color:#444">Andrés Montero · Biblia Straubinger · Cantos para Todos</span></p>
  <p>Si tienes cualquiera de estos juntando polvo, súbelo — hay gente buscándolo <strong>esta semana</strong>. Y si quieres que te ayude a cargarlos, respóndeme este correo.</p>
  <div style="margin:22px 0"><a href="https://tuslibros.cl/publish" style="background:#d4a017;color:#fff;font-weight:bold;padding:12px 26px;border-radius:8px;text-decoration:none;font-size:14px">Publicar un libro →</a></div>
  <p>¡Saludos y gracias por ser parte! 📚<br>— Vero</p>
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;

let ok=0,fail=0;
for(const u of dest){
  const nombre=(u.full_name||"").split(" ")[0];
  const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${RESEND}`,"Content-Type":"application/json"},
    body:JSON.stringify({from:"Vero de tuslibros.cl <noreply@tuslibros.cl>",to:[u.email],reply_to:"vero@economics.cl",subject:"📚 Esto busca la gente y no lo tenemos — ¿lo tienes tú?",html:html(nombre)})});
  if(res.ok){ok++;console.log(`✅ ${u.email}`);}else{fail++;console.log(`❌ ${u.email}: ${res.status} ${await res.text()}`);}
  await new Promise(r=>setTimeout(r,600)); // throttle anti rate-limit
}
console.log(`\n═══ Enviados: ${ok} · Fallidos: ${fail} ═══`);
