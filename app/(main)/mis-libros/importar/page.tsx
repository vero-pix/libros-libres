import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ImportForm from "./ImportForm";

export const metadata = { title: "Importar Libros — tuslibros.cl" };

export default async function ImportarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Importar libros</h1>
        <p className="text-ink-muted mb-8">
          Sube un archivo CSV con tus libros y se publican todos de una vez.
        </p>
        <ImportForm />
      </main>
    </div>
  );
}
