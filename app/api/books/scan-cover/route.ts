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
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 400,
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
                text: `Actúa como un bibliotecario experto con visión perfecta. Analiza esta portada de libro (posiblemente del mercado chileno). 
Extrae toda la información posible para una ficha técnica profesional. Si el texto es algo borroso, usa tu conocimiento literario para identificar el título y autor correcto.

Responde ÚNICAMENTE con un objeto JSON válido:
{
  "title": "título oficial completo",
  "author": "nombre completo del autor",
  "publisher": "editorial",
  "published_year": 2024,
  "description": "Una sinopsis atractiva de 2 a 3 frases. Si conoces el libro, aporta datos reales de su contenido para ayudar a la venta."
}

IMPORTANTE: 
- Prioriza la exactitud sobre el silencio. Si ves "DIBUJANDO EL COSMOS" y a "José Maza", identifícalo con seguridad.
- Si no estás seguro de la editorial o año, deja esos campos como null, pero el TÍTULO y AUTOR son obligatorios si son legibles.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Anthropic error:", err);
      
      const errType = err?.error?.type;
      const errMsg = err?.error?.message?.toLowerCase() || "";
      
      // Si es error de créditos o facturación, retornar código 402 especial
      if (
        response.status === 429 || // Too many requests / Out of credits
        response.status === 402 || 
        response.status === 529 || // Overloaded
        errType === "credit_balance_too_low" ||
        errType === "insufficient_quota" ||
        errMsg.includes("credit") ||
        errMsg.includes("billing")
      ) {
        return NextResponse.json({ error: "Sin créditos disponibles en la IA." }, { status: 402 });
      }
      
      return NextResponse.json({ error: "Error al analizar la imagen." }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed: { title?: string; author?: string; publisher?: string | null; published_year?: number | null; description?: string | null };
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Intento de rescate si Claude puso texto antes o después del JSON
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          return NextResponse.json({ error: "No se pudo leer la portada." }, { status: 422 });
        }
      } else {
        return NextResponse.json({ error: "No se pudo leer la portada." }, { status: 422 });
      }
    }

    if (!parsed.title?.trim()) {
      return NextResponse.json({ error: "No se pudo identificar el título." }, { status: 422 });
    }

    return NextResponse.json({
      title: parsed.title?.trim() ?? "",
      author: parsed.author?.trim() ?? "",
      publisher: parsed.publisher ?? null,
      published_year: parsed.published_year ?? null,
      description: parsed.description ?? null,
      isbn: undefined,
      cover_url: null,
      genre: null,
      pages: null,
    });
  } catch (err) {
    console.error("scan-cover error:", err);
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
