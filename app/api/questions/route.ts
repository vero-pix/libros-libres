import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/** GET /api/questions?listing_id=xxx */
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing_id");
  if (!listingId) {
    return NextResponse.json({ error: "listing_id requerido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*, asker:users!questions_asker_id_fkey(id, full_name)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data ?? [] });
}

/** POST /api/questions — crear pregunta */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión para preguntar" }, { status: 401 });
  }

  const { listing_id, question } = await req.json();

  if (!listing_id || !question?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  if (question.trim().length > 500) {
    return NextResponse.json({ error: "La pregunta es muy larga (máx 500 caracteres)" }, { status: 400 });
  }

  // Get listing + seller info
  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, book:books(title), seller:users!listings_seller_id_fkey(email, full_name)")
    .eq("id", listing_id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "No puedes preguntar en tu propia publicación" }, { status: 400 });
  }

  const { data: newQ, error } = await supabase
    .from("questions")
    .insert({
      listing_id,
      asker_id: user.id,
      question: question.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify seller by email
  const sellerEmail = (listing.seller as any)?.email;
  const bookTitle = (listing.book as any)?.title ?? "tu libro";
  if (sellerEmail) {
    try {
      const emailResult = await sendEmail({
        to: sellerEmail,
        subject: `Nueva pregunta sobre "${bookTitle}" — tuslibros.cl`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#1a1a1a">Tienes una nueva pregunta</h2>
            <p><strong>${bookTitle}</strong></p>
            <div style="background:#f5f0e8;padding:12px 16px;border-radius:8px;margin:16px 0">
              <p style="margin:0;color:#333">"${question.trim()}"</p>
            </div>
            <a href="https://tuslibros.cl/listings/${listing_id}" style="display:inline-block;background:#d4a017;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Responder</a>
            <p style="color:#888;font-size:13px;margin-top:16px">tuslibros.cl</p>
          </div>
        `,
      });
      if (!emailResult) {
        console.error("[questions] Email to seller failed (null result) for listing:", listing_id);
      } else {
        console.log("[questions] Email sent to seller for listing:", listing_id);
      }
    } catch (err) {
      console.error("[questions] Email error:", err);
    }
  }

  return NextResponse.json({ id: newQ.id });
}

/** PATCH /api/questions — responder pregunta (solo vendedor) */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { question_id, answer } = await req.json();

  if (!question_id || !answer?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // Verify user is the seller
  const { data: q } = await supabase
    .from("questions")
    .select("id, listing_id, asker:users!questions_asker_id_fkey(email, full_name), listing:listings(seller_id, book:books(title))")
    .eq("id", question_id)
    .single();

  if (!q) {
    return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });
  }

  if ((q.listing as any)?.seller_id !== user.id) {
    return NextResponse.json({ error: "Solo el vendedor puede responder" }, { status: 403 });
  }

  const { error } = await supabase
    .from("questions")
    .update({ answer: answer.trim(), answered_at: new Date().toISOString() })
    .eq("id", question_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify asker by email
  const askerEmail = (q.asker as any)?.email;
  const bookTitle = (q.listing as any)?.book?.title ?? "un libro";
  if (askerEmail) {
    try {
      const emailResult = await sendEmail({
        to: askerEmail,
        subject: `Respondieron tu pregunta sobre "${bookTitle}" — tuslibros.cl`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#1a1a1a">Tu pregunta fue respondida</h2>
            <p><strong>${bookTitle}</strong></p>
            <div style="background:#f5f0e8;padding:12px 16px;border-radius:8px;margin:16px 0">
              <p style="margin:0;color:#888;font-size:13px">Tu pregunta:</p>
              <p style="margin:4px 0 0;color:#333">"${answer.trim()}"</p>
            </div>
            <a href="https://tuslibros.cl/listings/${q.listing_id}" style="display:inline-block;background:#d4a017;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver respuesta</a>
            <p style="color:#888;font-size:13px;margin-top:16px">tuslibros.cl</p>
          </div>
        `,
      });
      if (!emailResult) {
        console.error("[questions] Email to asker failed (null result) for question:", question_id);
      } else {
        console.log("[questions] Email sent to asker for question:", question_id);
      }
    } catch (err) {
      console.error("[questions] Email error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
