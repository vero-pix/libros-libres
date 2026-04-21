import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";

interface BookRequest {
  id: string;
  title: string;
  author: string | null;
  requester_location: string | null;
}

export default async function HeroRequestStrip() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("book_requests")
    .select("id, title, author, requester_location")
    .eq("fulfilled", false)
    .order("created_at", { ascending: false })
    .limit(1);

  const req = (data as BookRequest[] | null)?.[0];
  if (!req) return null;

  const params = new URLSearchParams({ title: req.title });
  if (req.author) params.set("author", req.author);
  const publishHref = `/publish?${params.toString()}`;

  const location = req.requester_location?.trim();

  return (
    <Link
      href={publishHref}
      className="group block bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 border-b border-amber-600/40 hover:brightness-105 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 text-center">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-amber-900 bg-white/70 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
          Se busca
        </span>
        <p className="text-sm sm:text-[15px] text-amber-950 leading-snug">
          <span className="font-semibold">
            {location ? `Alguien en ${location} busca` : "Alguien busca"}
          </span>{" "}
          <span className="italic font-serif">«{req.title}»</span>
          {req.author && <span className="text-amber-900/80"> de {req.author}</span>}
          <span className="hidden sm:inline text-amber-900 font-bold ml-2 group-hover:translate-x-1 inline-block transition-transform">
            ¿Lo tienes? Publícalo →
          </span>
        </p>
      </div>
    </Link>
  );
}
