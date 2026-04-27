import { NextRequest, NextResponse } from "next/server";
import { sendGong, escapeHtml } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { store, bookTitle, url } = body;

    if (!store || !bookTitle) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // GONG: Notificar Telegram sobre la fuga
    await sendGong(
      `💸 <b>Fuga hacia competencia</b>\n\n` +
      `Alguien hizo clic para comparar el precio en <b>${escapeHtml(store)}</b>.\n\n` +
      `Libro: <i>${escapeHtml(bookTitle)}</i>`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in external-click endpoint:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
