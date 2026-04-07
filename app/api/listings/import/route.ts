import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CONDITION_MAP: Record<string, string> = {
  como_nuevo: "new",
  buen_estado: "good",
  estado_regular: "fair",
  con_detalles: "poor",
  new: "new",
  good: "good",
  fair: "fair",
  poor: "poor",
};

const MODALITY_MAP: Record<string, string> = {
  venta: "sale",
  arriendo: "loan",
  ambos: "both",
  sale: "sale",
  loan: "loan",
  both: "both",
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function buildCoverUrl(isbn: string): string | null {
  if (!isbn) return null;
  return `https://books.google.com/books/content?vid=isbn:${isbn}&printsec=frontcover&img=1&zoom=1`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Get user profile for location
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, comuna, region, default_latitude, default_longitude, default_address")
    .eq("id", user.id)
    .single();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    return NextResponse.json({ error: "El archivo está vacío o solo tiene encabezados" }, { status: 400 });
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

  const results: { title: string; status: "ok" | "error" | "skip"; message?: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });

    const title = row.titulo || row.title || "";
    const author = row.autor || row.author || "";
    const isbn = row.isbn || "";
    const price = parseInt(row.precio || row.price || "0", 10);
    const condition = CONDITION_MAP[row.condicion || row.condition || "good"] || "good";
    const modality = MODALITY_MAP[row.tipo || row.type || row.modalidad || "sale"] || "sale";
    const genre = row.categoria || row.category || "Literatura";

    if (!title || !author) {
      results.push({ title: title || `Fila ${i}`, status: "skip", message: "Falta título o autor" });
      continue;
    }

    if (price <= 0) {
      results.push({ title, status: "skip", message: "Precio inválido" });
      continue;
    }

    // Check if book exists by ISBN
    let bookId: string | null = null;
    if (isbn) {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("isbn", isbn)
        .maybeSingle();

      if (existing) {
        // Check duplicate listing
        const { data: existingListing } = await supabase
          .from("listings")
          .select("id")
          .eq("book_id", existing.id)
          .eq("seller_id", user.id)
          .maybeSingle();

        if (existingListing) {
          results.push({ title, status: "skip", message: "Ya publicado" });
          continue;
        }
        bookId = existing.id;
      }
    }

    // Create book if needed
    if (!bookId) {
      const coverUrl = buildCoverUrl(isbn);
      const { data: newBook, error: bookErr } = await supabase
        .from("books")
        .insert({
          title,
          author,
          isbn: isbn || null,
          cover_url: coverUrl,
          genre,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (bookErr || !newBook) {
        results.push({ title, status: "error", message: bookErr?.message || "Error creando libro" });
        continue;
      }
      bookId = newBook.id;
    }

    // Create listing
    const address = profile?.default_address || [profile?.comuna, profile?.region].filter(Boolean).join(", ") || "Chile";
    const coverUrl = buildCoverUrl(isbn);

    const { error: listErr } = await supabase.from("listings").insert({
      book_id: bookId,
      seller_id: user.id,
      price,
      condition,
      modality,
      cover_image_url: coverUrl,
      address,
      latitude: profile?.default_latitude || null,
      longitude: profile?.default_longitude || null,
      status: "active",
    });

    if (listErr) {
      results.push({ title, status: "error", message: listErr.message });
    } else {
      results.push({ title, status: "ok" });
    }
  }

  const created = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const failed = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ created, skipped, failed, results });
}
