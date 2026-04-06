import Navbar from "@/components/ui/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Beta banner */}
      <div className="bg-brand-500 text-white text-center text-xs py-1.5 px-4 font-medium">
        Versión beta — Estamos preparando todo para el lanzamiento oficial. ¡Gracias por explorar!
      </div>
      <Navbar />
      {children}
    </>
  );
}
