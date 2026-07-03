import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = fs.readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("="); const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
}
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND = process.env.RESEND_API_KEY;

// ── 1) Lorena: todos sus libros son novelas → ficcion ──
const { data: lorena } = await s.from("users").select("id").eq("username", "lorena.cortes").maybeSingle();
const { data: ls } = await s.from("listings").select("book_id, book:books(category)").eq("seller_id", lorena.id);
const toFix = ls.filter((l) => !l.book?.category).map((l) => l.book_id);
console.log(`Lorena: ${toFix.length} libros sin categoría → ficcion`);
if (toFix.length) {
  const { error } = await s.from("books").update({ category: "ficcion" }).in("id", toFix);
  console.log(error ? "  ❌ " + error.message : "  ✅ categorizados");
}

// ── 2) Destacar a ambos ──
for (const un of ["lorena.cortes", "nicolas"]) {
  const { error } = await s.from("users").update({ featured: true }).eq("username", un);
  console.log(`featured @${un}: ${error ? "❌ " + error.message : "✅"}`);
}

// ── 3) Emails de bienvenida ──
const wrap = (body) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  ${body}
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;

const emails = [
  {
    to: "lbcortesm@gmail.com",
    subject: "¡Bienvenida a tuslibros.cl, Lorena! 📚",
    html: wrap(`
      <p>Hola Lorena:</p>
      <p>Soy Vero, la que está detrás de tuslibros.cl. Vi que subiste casi 40 libros y quería escribirte yo misma para darte las gracias por sumarte.</p>
      <p>Tienes muy buen ojo: Sparks, Danielle Steel, Megan Maxwell, y de paso Orwell, Bradbury y Huxley. Esa mezcla de novela romántica con clásicos se vende harto acá.</p>
      <p>Te dejé como <strong>vendedora destacada</strong> en la portada, así que tus libros van a aparecer arriba estos días. Ya están todos visibles y categorizados.</p>
      <p>Y vi que ya conectaste MercadoPago: estás 100% lista para vender, no te falta nada. Un solo tip para vender más rápido: completa tu <strong>comuna</strong> en el perfil, porque los compradores filtran por cercanía.</p>
      <p>Cualquier duda me respondes este correo directo. Bienvenida 📚</p>
      <p>— Vero</p>`),
  },
  {
    to: "librosdelbardo@gmail.com",
    subject: "¡Bienvenido a tuslibros.cl! 📚",
    html: wrap(`
      <p>Hola Nicolás:</p>
      <p>Soy Vero, de tuslibros.cl. Vi que partiste con tus primeros libros y quería darte la bienvenida yo misma.</p>
      <p>Me encantó la línea que elegiste: historia de Chile y del mundo (Allende, Lagos, la Segunda Guerra). Eso tiene público fiel acá y se busca harto.</p>
      <p>Te dejé como <strong>vendedor destacado</strong> en la portada para darle un empujón a Libros del Bardo. Tus fichas quedaron completas y visibles.</p>
      <p>Y vi que ya conectaste MercadoPago, así que estás listo para vender. Un solo tip: completa tu <strong>comuna</strong> en el perfil para que te encuentren por cercanía.</p>
      <p>Si te animas a subir más, acá estoy para lo que necesites. Bienvenido 📚</p>
      <p>— Vero</p>`),
  },
];

for (const e of emails) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Vero de tuslibros.cl <noreply@tuslibros.cl>",
      to: [e.to],
      reply_to: "vero@economics.cl",
      subject: e.subject,
      html: e.html,
    }),
  });
  console.log(`email → ${e.to}: ${res.ok ? "✅ enviado" : "❌ " + res.status + " " + (await res.text())}`);
}

// ── 4) Verificación ──
const { data: u } = await s.from("users").select("username, featured").in("username", ["lorena.cortes", "nicolas"]);
const { data: ls2 } = await s.from("listings").select("book:books(category)").eq("seller_id", lorena.id);
const c = {}; for (const l of ls2) c[l.book?.category ?? "NULL"] = (c[l.book?.category ?? "NULL"] ?? 0) + 1;
console.log("\nfeatured:", u);
console.log("categorías Lorena:", c);
