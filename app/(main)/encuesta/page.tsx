import { createClient } from "@/lib/supabase/server";
import EncuestaForm from "@/components/encuesta/EncuestaForm";
import { grupoDesdeParam, type Grupo } from "@/lib/encuesta";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encuesta",
  description: "Cuéntame qué te falta en tuslibros.cl. Dos minutos.",
  // No queremos esta página en Google: es para quien recibe el correo.
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: { g?: string };
}

export default async function EncuestaPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El grupo viene en el link del correo. Si no viene —alguien que llegó de otra
  // parte— se infiere: quien ya publicó algo responde el cuestionario de vendedor.
  let grupo: Grupo | null = grupoDesdeParam(searchParams.g);
  let email: string | null = null;

  if (user) {
    email = user.email ?? null;
    if (!grupo) {
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", user.id);
      grupo = (count ?? 0) > 0 ? "vendedor" : "no_publico";
    }
  }

  // Sin sesión y sin parámetro no hay cómo saberlo. El de vendedor es el que
  // sirve a cualquiera que conozca el sitio.
  if (!grupo) grupo = "vendedor";

  return (
    <div className="min-h-screen bg-cream">
      <main className="max-w-xl mx-auto px-4 py-10">
        <EncuestaForm grupo={grupo} emailInicial={email} />
      </main>
    </div>
  );
}
