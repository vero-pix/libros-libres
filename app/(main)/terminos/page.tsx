import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";

export const metadata = {
  title: "Términos y Condiciones — Libros Libres",
};

export default async function TerminosPage() {
  const filePath = path.join(process.cwd(), "content", "terminos.mdx");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContent);

  return (
    <div className="min-h-screen bg-cream">

      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80"
          alt="Conocimiento"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-cream/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-ink mb-2">Términos y Condiciones</h1>
          <p className="text-ink-muted text-lg max-w-xl">Condiciones de uso de la plataforma Libros Libres</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-gray prose-headings:font-bold prose-h1:hidden prose-h2:text-xl prose-h3:text-lg prose-a:text-brand-600 max-w-none bg-white rounded-xl shadow-sm border border-cream-dark p-8">
          <MDXRemote source={content} />
        </article>
      </main>
    </div>
  );
}
