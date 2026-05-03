import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No se recibió imagen." }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = (image.type || "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Sin configuración de IA." }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: `Analiza esta portada de libro. Responde SOLO con JSON sin texto adicional ni backticks:
{
  "title": "título exacto del libro",
  "author": "nombre completo del autor",
  "publisher": "editorial o null",
  "published_year": año como número o null
}
Si no puedes leer algún campo con certeza, usa null. Prioriza título y autor.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Anthropic error:", err);
      // Si es error de créditos, retornar código especial
      if (response.status === 529 || err?.error?.type === "overloaded_error") {
        return NextResponse.json({ error: "Sin créditos disponibles." }, { status: 402 });
      }
      return NextResponse.json({ error: "Error al analizar la imagen." }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed: { title?: string; author?: string; publisher?: string | null; published_year?: number | null };
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "No se pudo leer la portada." }, { status: 422 });
    }

    if (!parsed.title?.trim()) {
      return NextResponse.json({ error: "No se pudo identificar el título." }, { status: 422 });
    }

    return NextResponse.json({
      title: parsed.title?.trim() ?? "",
      author: parsed.author?.trim() ?? "",
      publisher: parsed.publisher ?? null,
      published_year: parsed.published_year ?? null,
      isbn: undefined,
      description: undefined,
      cover_url: null,
      genre: null,
      pages: null,
    });
  } catch (err) {
    console.error("scan-cover error:", err);
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
