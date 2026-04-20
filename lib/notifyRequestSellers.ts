import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/email";

interface RequestInfo {
  id: string;
  title: string;
  author: string | null;
  notes: string | null;
  requester_location: string | null;
}

/**
 * Notifica a vendedores con listings activos que alguien está buscando
 * un libro. Se corre como side effect al crear una solicitud en
 * /api/requests — no bloquea el response del usuario.
 *
 * Excluye al admin (vero@tuslibros.cl) para no recibirse a sí misma en
 * cada solicitud. También excluye sellers sin email válido.
 */
export async function notifyRequestSellers(req: RequestInfo) {
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Sellers con al menos 1 listing activo — audiencia concreta, no spam.
  const { data: activeSellers } = await admin
    .from("listings")
    .select("seller_id")
    .eq("status", "active");
  const seen = new Set<string>();
  const sellerIds: string[] = [];
  for (const l of activeSellers ?? []) {
    if (l.seller_id && !seen.has(l.seller_id)) {
      seen.add(l.seller_id);
      sellerIds.push(l.seller_id);
    }
  }

  if (!sellerIds.length) return;

  const { data: users } = await admin
    .from("users")
    .select("id, email, full_name")
    .in("id", sellerIds);

  // Excluir vero@tuslibros.cl (admin) para que no se reciba a sí misma.
  // En dev/pro puede setear NOTIFY_TEST_EMAILS_ONLY=vero@tuslibros.cl para testing.
  const testOnly = process.env.NOTIFY_TEST_EMAILS_ONLY?.split(",").map((e) => e.trim());
  const recipients = (users ?? []).filter((u) => {
    if (!u.email) return false;
    if (testOnly?.length) return testOnly.includes(u.email);
    return u.email !== "vero@tuslibros.cl";
  });

  if (!recipients.length) return;

  const titleEsc = escapeHtml(req.title);
  const authorEsc = escapeHtml(req.author ?? "");
  const notesEsc = escapeHtml(req.notes ?? "");
  const locationEsc = escapeHtml(req.requester_location ?? "");

  const publishUrl = `https://tuslibros.cl/publish?title=${encodeURIComponent(req.title)}${req.author ? `&author=${encodeURIComponent(req.author)}` : ""}`;

  const subject = req.author
    ? `Alguien busca "${req.title}" de ${req.author} — tuslibros.cl`
    : `Alguien busca "${req.title}" — tuslibros.cl`;

  const html = `
<!DOCTYPE html>
<html lang="es-CL">
<body style="margin:0; padding:0; background:#f5f1e8; font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <div style="max-width:540px; margin:0 auto; padding:32px 20px;">

    <p style="color:#9a8a6e; font-size:11px; text-transform:uppercase; letter-spacing:0.3em; font-weight:600; margin:0 0 8px;">
      Economía inversa · Se busca
    </p>

    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size:26px; color:#1c1c1c; line-height:1.2; margin:0 0 18px;">
      Alguien está buscando un libro. ¿Lo tienes?
    </h1>

    <div style="background:#ffffff; border:1px solid #e5ddc8; border-radius:12px; padding:20px 22px; margin:20px 0;">
      <p style="font-family: Georgia, serif; font-size:22px; color:#1c1c1c; margin:0 0 6px; line-height:1.25;">
        ${titleEsc}
      </p>
      ${authorEsc ? `<p style="font-style:italic; color:#6b5b42; font-size:15px; margin:0 0 10px;">${authorEsc}</p>` : ""}
      ${locationEsc ? `<p style="color:#8a6d2e; font-weight:600; font-size:13px; margin:8px 0 0;">📍 ${locationEsc}</p>` : ""}
      ${notesEsc ? `<p style="color:#6b6b6b; font-size:13px; margin:10px 0 0; padding:10px 12px; background:#faf6eb; border-radius:6px;">${notesEsc}</p>` : ""}
    </div>

    <p style="color:#3c3c3c; font-size:15px; line-height:1.55; margin:18px 0;">
      Alguien dejó esta solicitud en <strong>tuslibros.cl/solicitudes</strong>. Si tienes este libro en tu estantería, publícalo — le avisamos a quien lo pidió.
    </p>

    <p style="margin:24px 0;">
      <a href="${publishUrl}"
         style="display:inline-block; background:#8a6d2e; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:6px; font-size:14px; font-weight:600; letter-spacing:0.02em;">
        Publicar este libro →
      </a>
    </p>

    <hr style="border:none; border-top:1px solid #e5ddc8; margin:26px 0;" />

    <p style="color:#8a8a8a; font-size:12px; line-height:1.5; margin:0;">
      Recibes este email porque tienes al menos un libro publicado en tuslibros.cl. Cada solicitud es una venta potencial que no existía antes. <a href="https://tuslibros.cl/solicitudes" style="color:#8a6d2e;">Ver todas las solicitudes</a>.
    </p>
    <p style="color:#b5b5b5; font-size:11px; margin:10px 0 0;">
      — Vero, tuslibros.cl
    </p>
  </div>
</body>
</html>`;

  // Enviar en paralelo pero sin bloquear si alguno falla
  const results = await Promise.allSettled(
    recipients.map((u) =>
      sendEmail({
        to: u.email!,
        subject,
        html,
      })
    )
  );

  const ok = results.filter((r) => r.status === "fulfilled" && r.value).length;
  const failed = results.length - ok;
  console.log(`[notifyRequestSellers] request ${req.id.slice(0, 8)}: enviados ${ok}/${results.length} ${failed ? `(${failed} fallidos)` : ""}`);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
