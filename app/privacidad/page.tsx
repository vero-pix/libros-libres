import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import Navbar from "@/components/ui/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — Libros Libres",
};

export default async function PrivacidadPage() {
  const filePath = path.join(process.cwd(), "content", "privacidad.mdx");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(fileContent);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-brand-500 hover:text-brand-600 mb-6 inline-block">
          ← Volver al inicio
        </Link>
        <p className="text-sm text-gray-400 mb-2">{data.description as string}</p>
        <article className="prose prose-gray prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-a:text-brand-500 max-w-none">
          <MDXRemote source={content} />
        </article>
      </main>
    </div>
  );
}
