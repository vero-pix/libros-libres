/**
 * Shared email helper using Resend API.
 * Requires RESEND_API_KEY env var.
 */

interface SendEmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, from = "noreply@tuslibros.cl", subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return null;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend API error:", res.status, body);
    return null;
  }

  return res.json();
}
