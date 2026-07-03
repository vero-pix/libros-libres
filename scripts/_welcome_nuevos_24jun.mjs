import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env=fs.readFileSync(".env.local","utf-8");
for(const l of env.split("\n")){if(l.startsWith("#")||!l.includes("="))continue;const i=l.indexOf("=");const k=l.slice(0,i).trim();if(!process.env[k])process.env[k]=l.slice(i+1).trim();}
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND=process.env.RESEND_API_KEY;

const wrap=(body)=>`
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  ${body}
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;

const btn=(href,txt)=>`<div style="margin:22px 0"><a href="${href}" style="background:#d4a017;color:#fff;font-weight:bold;padding:12px 26px;border-radius:8px;text-decoration:none;font-size:14px">${txt}</a></div>`;

// FABIOLA — bienvenida personalizada (publicó 2)
const fabiola={
  to:"flor.rego8@protonmail.com",
  subject:"¡Bienvenida a tuslibros.cl, Fabiola! 📚",
  html:wrap(`
    <p>Hola Fabiola:</p>
    <p>Soy Vero, la que está detrás de tuslibros.cl. Vi que ya subiste tus primeros dos libros y quise escribirte yo misma para darte la bienvenida.</p>
    <p>Me encantó tu elección: "Los hongos del fin del mundo" de Tsing y el viaje filosófico de Lenoir. Ese cruce de antropología y filosofía tiene lectores fieles acá, no son libros que se encuentren en cualquier parte.</p>
    <p>Un solo paso para que estés 100% lista para vender: <strong>conecta MercadoPago</strong> en tu perfil. Sin eso, la gente puede ver tus libros pero no comprarlos. Toma 2 minutos.</p>
    ${btn("https://tuslibros.cl/perfil","Conectar MercadoPago →")}
    <p>Cualquier duda me respondes este correo directo. Bienvenida 📚</p>
    <p>— Vero</p>`),
};

// NUDGE — registrados sin publicar
const nudge=(nombre,extra="")=>wrap(`
  <p>Hola${nombre?` ${nombre}`:""}:</p>
  <p>Soy Vero, de tuslibros.cl. Vi que te registraste hace poco — ¡gracias por sumarte! 📚</p>
  <p>Te escribo porque te falta el paso más entretenido: <strong>subir tu primer libro</strong>. Es rápido — escaneas el código de barras o lo escribes, y nosotros completamos la portada, la sinopsis y la categoría. Tú solo le pones precio.</p>
  ${extra}
  ${btn("https://tuslibros.cl/publish","Publicar mi primer libro →")}
  <p>Si tienes varios y te da lata subirlos de a uno, respóndeme este correo y te ayudo. Bienvenida/o 📚</p>
  <p>— Vero</p>`);

const nudges=[
  {to:"parach2@gmail.com",nombre:"Nicolás",extra:"<p>Y vi algo bueno: <strong>ya conectaste MercadoPago</strong>, así que estás listo para cobrar. Solo te falta publicar.</p>"},
  {to:"ojopiojo@gmail.com",nombre:"Rodrigo"},
  {to:"ariffo@gmail.com",nombre:"Andrea"},
  {to:"javieraespejojeraldo@gmail.com",nombre:"Javiera"},
  {to:"pablorivera19899812@gmail.com",nombre:"Pablo"},
  {to:"fermae96@gmail.com",nombre:"Fernando"},
  {to:"valenzuela.victor@gmail.com",nombre:"Víctor"},
].map(n=>({to:n.to,subject:"Te falta un paso en tuslibros.cl 📚",html:nudge(n.nombre,n.extra||"")}));

const all=[fabiola,...nudges];
for(const e of all){
  const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${RESEND}`,"Content-Type":"application/json"},
    body:JSON.stringify({from:"Vero de tuslibros.cl <noreply@tuslibros.cl>",to:[e.to],reply_to:"vero@economics.cl",subject:e.subject,html:e.html})});
  console.log(`${e.to}: ${res.ok?"✅ enviado":"❌ "+res.status+" "+(await res.text())}`);
}
