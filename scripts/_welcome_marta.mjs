import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) { if(line.startsWith("#")||!line.includes("="))continue; const i=line.indexOf("="); const k=line.slice(0,i).trim(); if(!process.env[k])process.env[k]=line.slice(i+1).trim(); }
const RESEND = process.env.RESEND_API_KEY;

const wrap = (body) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  ${body}
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;

const html = wrap(`
  <p>Hola Marta Olivia:</p>
  <p>Soy Vero, la que está detrás de tuslibros.cl. Vi que subiste cerca de 70 libros de una sola vez, así que quise escribirte yo misma para darte la bienvenida.</p>
  <p>Me llamó la atención tu selección, porque no es la de siempre: pensamiento político y económico latinoamericano de verdad — Roger Bartra, el eurocomunismo de Claudín, <em>La Sagrada Familia</em> de Marx y Engels, economía mexicana — y al lado <em>La balsa de piedra</em> de Saramago y las revistas Atenea de la Universidad de Concepción. Es una biblioteca con criterio, de las que tienen lector fiel aunque sea de nicho.</p>
  <p>Te dejé como <strong>vendedora destacada</strong> en la portada para darte un empujón estos días. Y aproveché de ordenarte la casa: tus libros que estaban sin clasificar quedaron <strong>categorizados</strong> (ensayo, académico y novela) y tu <strong>comuna (Las Condes)</strong> quedó lista para que te encuentren por cercanía.</p>
  <p>Vi que ya conectaste MercadoPago, así que estás 100% lista para vender, no te falta nada. Tu tienda quedó acá: <a href="https://tuslibros.cl/vendedor/marta.olivia.yllades.iglesias" style="color:#1a3a6b">tuslibros.cl/vendedor/marta.olivia.yllades.iglesias</a></p>
  <p>Cualquier duda me respondes este correo directo. Bienvenida 📚</p>
  <p>— Vero</p>`);

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "Vero de tuslibros.cl <noreply@tuslibros.cl>",
    to: ["yllades@gmail.com"],
    reply_to: "vero@economics.cl",
    subject: "¡Bienvenida a tuslibros.cl, Marta Olivia! 📚",
    html,
  }),
});
console.log("email → yllades@gmail.com:", res.ok ? "✅ enviado" : "❌ "+res.status+" "+(await res.text()));
