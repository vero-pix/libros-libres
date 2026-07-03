import { readFileSync } from "fs";
const env = readFileSync(".env.local", "utf-8");
for (const line of env.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("="); const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const RESEND = process.env.RESEND_API_KEY;

const wrap = (body) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1a1a2e;max-width:560px">
  <h2 style="font-family:Georgia,serif;color:#1a3a6b;margin:0 0 4px">tuslibros.cl</h2>
  <div style="height:3px;width:54px;background:#d4a017;border-radius:2px;margin-bottom:18px"></div>
  ${body}
  <p style="color:#837c70;font-size:12px;margin-top:26px">tuslibros.cl · marketplace de libros usados en Chile</p>
</div>`;

const stepsBlock = `
  <div style="background:#f4f7fb;border:1px solid #d8e3f0;border-radius:10px;padding:14px 16px;margin:18px 0">
    <p style="margin:0 0 8px"><strong>Cómo queda con tus fotos:</strong></p>
    <p style="margin:0 0 6px">1. En tu planilla agrega dos columnas: <strong>foto_portada</strong> (el nombre del archivo de la portada, ej: <em>tapa.jpg</em>) y <strong>resto_fotos</strong> (hasta 5 nombres separados por punto y coma, ej: <em>lomo.jpg;contra.jpg</em>).</p>
    <p style="margin:0 0 6px">2. Entra a <strong>Mis libros → Importar</strong>, sube el CSV y, al lado, seleccionas todas tus fotos de una vez.</p>
    <p style="margin:0 0 12px">3. El sistema calza cada foto con su libro por el nombre del archivo. Si subes desde el iPhone (HEIC), las convierte solo.</p>
    <a href="https://tuslibros.cl/mis-libros/importar" style="display:inline-block;background:#1a3a6b;color:#fff;text-decoration:none;padding:9px 18px;border-radius:8px;font-weight:600">Ir al importador</a>
  </div>`;

const html = wrap(`
  <p>Hola Carlos:</p>
  <p>Te escribo además del WhatsApp para dejártelo por escrito: tu propuesta para la carga masiva ya está hecha y funcionando en el sitio.</p>
  <p>La idea de separar la portada del resto de las fotos en el mismo archivo era exactamente lo que faltaba — la implementé tal cual la planteaste, con las dos columnas y todo.</p>
  ${stepsBlock}
  <p>Si la columna de fotos la dejas vacía, seguimos usando la portada del catálogo como antes, así que no rompe nada de lo que ya tienes.</p>
  <p>Pruébala con un par de libros primero y me cuentas si algo no calza bien — cualquier ajuste lo vemos. Gracias por empujar el proyecto desde adentro, en serio.</p>
  <p>Cualquier duda me respondes este correo directo.</p>
  <p>— Vero</p>`);

const SEND = process.argv.includes("--send");
if (!SEND) {
  console.log("DRY-RUN (sin --send). Destinatario: cimlibros@gmail.com\n");
  console.log(html.replace(/<[^>]+>/g, "").replace(/\n{2,}/g, "\n").trim());
  process.exit(0);
}

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: "Vero de tuslibros.cl <noreply@tuslibros.cl>",
    to: ["cimlibros@gmail.com"],
    reply_to: "vero@economics.cl",
    subject: "Carlos, tu propuesta para la carga masiva ya está lista 📚",
    html,
  }),
});
console.log(`email → cimlibros@gmail.com: ${res.ok ? "✅ enviado" : "❌ " + res.status + " " + (await res.text())}`);
