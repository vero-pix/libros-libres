import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import Navbar from "@/components/ui/Navbar";
import Image from "next/image";

export const metadata = {
  title: "Política de Privacidad — Libros Libres",
};

export default async function PrivacidadPage() {
  const filePath = path.join(process.cwd(), "content", "privacidad.mdx");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContent);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80"
          alt="Biblioteca"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-2">Política de Privacidad</h1>
          <p className="text-gray-200 text-lg max-w-xl">Cómo protegemos tu información personal</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-gray prose-headings:font-bold prose-h1:hidden prose-h2:text-xl prose-h3:text-lg prose-a:text-[#2b6cb0] max-w-none bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <MDXRemote source={content} />
        </article>
      </main>
    </div>
  );
}
