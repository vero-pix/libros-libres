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

  // Mapa opcional de fotos: { "nombre_archivo.jpg": "https://...url-publica" }.
  // El cliente sube las fotos a Storage y nos manda solo el mapeo nombre→URL,
  // así evitamos límites de tamaño/timeout de subir las imágenes por la API.
  // Claves normalizadas a minúsculas para matchear sin importar mayúsculas.
  const photoMap: Record<string, string> = {};
  const photoMapRaw = formData.get("photoMap");
  if (typeof photoMapRaw === "string" && photoMapRaw.trim()) {
    try {
      const parsed = JSON.parse(photoMapRaw) as Record<string, string>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string" && v) photoMap[k.trim().toLowerCase()] = v;
      }
    } catch {
      return NextResponse.json({ error: "photoMap inválido" }, { status: 400 });
    }
  }

  // Índice por nombre SIN extensión: muchos vendedores escriben en el CSV el
  // nombre del archivo sin el ".jpg" (caso CIM/Carlos). Así calza igual.
  const stripExt = (n: string) => n.trim().toLowerCase().replace(/\.[a-z0-9]+$/i, "");
  const photoMapNoExt: Record<string, string> = {};
  for (const [k, v] of Object.entries(photoMap)) {
    const ne = stripExt(k);
    if (ne && !photoMapNoExt[ne]) photoMapNoExt[ne] = v;
  }
  // Busca una URL tolerando: mayúsculas, espacios, y extensión ausente/distinta.
  const lookupPhoto = (name: string): string | null => {
    const key = name.trim().toLowerCase();
    return photoMap[key] ?? photoMapNoExt[stripExt(name)] ?? null;
  };

  const MAX_GALLERY_PHOTOS = 5;
  // Nombres de archivo que el CSV referencia en una fila (para detectar los que
  // no encontraron foto subida y avisar al vendedor).
  function referencedNames(row: Record<string, string>): string[] {
    const raw = [
      row.foto_portada || row.portada || "",
      row.resto_fotos || row.fotos_resto || row.fotos_galeria || "",
      row.fotos || "",
    ].join(";");
    return raw.split(";").map((n) => n.trim()).filter(Boolean);
  }

  // Resuelve { cover, gallery } de una fila usando el photoMap.
  // Prioridad de columnas: foto_portada + resto_fotos  →  fotos (todo junto).
  function resolveRowPhotos(row: Record<string, string>): { cover: string | null; gallery: string[] } {
    if (Object.keys(photoMap).length === 0) return { cover: null, gallery: [] };
    // Quita URLs duplicadas conservando el orden (algunos CSV repiten el mismo nombre).
    const dedupe = (urls: string[]) => Array.from(new Set(urls));

    const portadaName = (row.foto_portada || row.portada || "").trim();
    const restoRaw = (row.resto_fotos || row.fotos_resto || row.fotos_galeria || "").trim();
    if (portadaName || restoRaw) {
      const cover = portadaName ? lookupPhoto(portadaName) : null;
      const gallery = dedupe(
        restoRaw
          .split(";").map((n) => n.trim()).filter(Boolean)
          .map(lookupPhoto).filter((u): u is string => !!u)
      )
        .filter((u) => u !== cover)
        .slice(0, MAX_GALLERY_PHOTOS);
      // Si no se nombró portada pero sí hay galería, la 1ª pasa a portada.
      if (!cover && gallery.length > 0) return { cover: gallery.shift()!, gallery };
      return { cover, gallery };
    }

    // Columna `fotos` (todo junto, la 1ª es portada)
    const fotosRaw = (row.fotos || "").trim();
    if (fotosRaw) {
      const urls = dedupe(
        fotosRaw
          .split(";").map((n) => n.trim()).filter(Boolean)
          .map(lookupPhoto).filter((u): u is string => !!u)
      );
      const cover = urls.shift() ?? null;
      return { cover, gallery: urls.slice(0, MAX_GALLERY_PHOTOS) };
    }

    return { cover: null, gallery: [] };
  }

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    return NextResponse.json({ error: "El archivo está vacío o solo tiene encabezados" }, { status: 400 });
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

  const results: { title: string; status: "ok" | "error" | "skip"; message?: string }[] = [];

  // Estadísticas de fotos para devolver feedback claro al vendedor.
  const photosProvided = Object.keys(photoMap).length;
  let coversFromOwnPhotos = 0;
  let galleryImagesAdded = 0;
  const unmatchedRefs = new Set<string>();

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
    // Foto propia del vendedor si la mapeó en el CSV; si no, portada de Google.
    const { cover: ownCover, gallery } = resolveRowPhotos(row);
    const coverUrl = ownCover || buildCoverUrl(isbn);

    // Si el vendedor subió fotos, detectar nombres del CSV que no encontraron archivo.
    if (photosProvided > 0) {
      for (const name of referencedNames(row)) {
        if (!lookupPhoto(name)) unmatchedRefs.add(name);
      }
    }
    if (ownCover) coversFromOwnPhotos++;

    const { data: inserted, error: listErr } = await supabase
      .from("listings")
      .insert({
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
      })
      .select("id")
      .single();

    if (listErr) {
      results.push({ title, status: "error", message: listErr.message });
    } else {
      results.push({ title, status: "ok" });
      // Galería: el resto de fotos propias (la portada ya quedó en el listing).
      if (inserted?.id && gallery.length > 0) {
        await supabase.from("listing_images").insert(
          gallery.map((url, idx) => ({
            listing_id: inserted.id,
            image_url: url,
            sort_order: idx,
          }))
        );
        galleryImagesAdded += gallery.length;
      }
      // Gong Telegram (fire-and-forget)
      if (inserted?.id) {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuslibros.cl"}/api/webhooks/listing-created`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: inserted.id }),
        }).catch(() => {});
      }
    }
  }

  const created = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const failed = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    created,
    skipped,
    failed,
    results,
    photos: {
      provided: photosProvided,
      coversFromOwnPhotos,
      galleryImagesAdded,
      unmatched: Array.from(unmatchedRefs),
    },
  });
}
