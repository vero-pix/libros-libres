import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  paid: ["active"],
  active: ["returning", "overdue"],
  returning: ["completed"],
  overdue: ["defaulted", "completed"],
};

/**
 * PATCH /api/rentals/[id]
 * Update rental status with validation.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { status: newStatus } = await req.json();
  if (!newStatus) return NextResponse.json({ error: "Falta status" }, { status: 400 });

  // Get rental with participants
  const { data: rental } = await supabase
    .from("rentals")
    .select("*, listing:listings(id, book:books(title)), renter:users!rentals_renter_id_fkey(id, full_name, email), owner:users!rentals_owner_id_fkey(id, full_name, email)")
    .eq("id", params.id)
    .single();

  if (!rental) return NextResponse.json({ error: "Arriendo no encontrado" }, { status: 404 });

  // Verify user is participant
  if (rental.renter_id !== user.id && rental.owner_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[rental.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({ error: `No se puede cambiar de ${rental.status} a ${newStatus}` }, { status: 400 });
  }

  // Build update
  const update: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "active") {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + rental.period_days);
    update.start_date = start.toISOString().split("T")[0];
    update.end_date = end.toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("rentals")
    .update(update)
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // When completed, release listing back to active
  if (newStatus === "completed") {
    await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("id", rental.listing_id);
  }

  // Send email notifications
  try {
    const bookTitle = (rental.listing as any)?.book?.title ?? "Libro";
    const renterName = (rental.renter as any)?.full_name ?? "Arrendatario";
    const ownerName = (rental.owner as any)?.full_name ?? "Propietario";
    const renterEmail = (rental.renter as any)?.email;
    const ownerEmail = (rental.owner as any)?.email;

    const messages: Record<string, { to: string; subject: string; body: string }[]> = {
      active: [
        ...(renterEmail ? [{ to: renterEmail, subject: `Libro entregado — ${bookTitle}`, body: `<p>${ownerName} confirmó la entrega de <strong>${bookTitle}</strong>. Tu arriendo está activo por ${rental.period_days} días.</p>` }] : []),
      ],
      returning: [
        ...(ownerEmail ? [{ to: ownerEmail, subject: `Devolución iniciada — ${bookTitle}`, body: `<p>${renterName} inició la devolución de <strong>${bookTitle}</strong>. Confirma cuando lo recibas.</p>` }] : []),
      ],
      completed: [
        ...(renterEmail ? [{ to: renterEmail, subject: `Arriendo completado — ${bookTitle}`, body: `<p>La devolución de <strong>${bookTitle}</strong> fue confirmada. Tu garantía será liberada.</p>` }] : []),
        ...(ownerEmail ? [{ to: ownerEmail, subject: `Libro devuelto — ${bookTitle}`, body: `<p><strong>${bookTitle}</strong> fue devuelto por ${renterName}. El libro vuelve a estar disponible.</p>` }] : []),
      ],
      overdue: [
        ...(renterEmail ? [{ to: renterEmail, subject: `Arriendo vencido — ${bookTitle}`, body: `<p>Tu arriendo de <strong>${bookTitle}</strong> ha vencido. Por favor coordina la devolución con ${ownerName}.</p>` }] : []),
      ],
    };

    for (const msg of messages[newStatus] ?? []) {
      await sendEmail({
        to: msg.to,
        subject: msg.subject,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">${msg.body}<p style="color:#888;font-size:13px;margin-top:16px">tuslibros.cl</p></div>`,
      });
    }
  } catch (emailErr) {
    console.error("[rental] Email error:", emailErr);
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
