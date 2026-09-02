import Navbar from "@/components/ui/Navbar";

// Ojo: acá NO va <PageTracker />. Ya está montado en el layout raíz
// (app/layout.tsx), que envuelve a este. Tenerlo en los dos hacía que cada
// visita a una ruta de (main) se registrara DOS veces, con ~300ms de
// diferencia: el 38% de las filas de page_views eran duplicados.
// Corregido el 12 ago 2026.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
