import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) { if(line.startsWith("#")||!line.includes("="))continue; const i=line.indexOf("="); const k=line.slice(0,i).trim(); if(!process.env[k])process.env[k]=line.slice(i+1).trim(); }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND = process.env.RESEND_API_KEY;
const UID = "2511a774-142d-40c9-809a-44d31a84f161";

// Destacar
const { error: fe } = await s.from("users").update({ featured: true }).eq("id", UID);
console.log("featured @polette:", fe ? "❌ "+fe.message : "✅");

const wrap = (body) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  ${body}
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;

const html = wrap(`
  <p>Hola Polette:</p>
  <p>Soy Vero, la que está detrás de tuslibros.cl. Vi que el primer día subiste 10 libros con foto y todo, así que quise escribirte yo misma para darte la bienvenida.</p>
  <p>Me encantó tu selección: el terror cósmico de Lovecraft (Cthulhu, el Necronomicón, las Montañas de la Locura) junto con Drácula, y de paso la saga de Harry Potter. Esa mezcla de terror clásico con fantasía tiene público fiel acá y se busca harto.</p>
  <p>Te dejé como <strong>vendedora destacada</strong> en la portada para darte un empujón estos días. Y aproveché de dejarte la casa ordenada: tus libros quedaron <strong>categorizados en Novela y Ficción</strong> y tu <strong>comuna (Conchalí)</strong> lista para que te encuentren por cercanía.</p>
  <p>Vi que ya conectaste MercadoPago, así que estás 100% lista para vender, no te falta nada.</p>
  <p>Cualquier duda me respondes este correo directo. Bienvenida 📚</p>
  <p>— Vero</p>`);

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "Vero de tuslibros.cl <noreply@tuslibros.cl>",
    to: ["poletteatenas@gmail.com"],
    reply_to: "vero@economics.cl",
    subject: "¡Bienvenida a tuslibros.cl, Polette! 📚",
    html,
  }),
});
console.log("email → poletteatenas@gmail.com:", res.ok ? "✅ enviado" : "❌ "+res.status+" "+(await res.text()));
