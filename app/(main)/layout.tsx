import Navbar from "@/components/ui/Navbar";
import PageTracker from "@/components/ui/PageTracker";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageTracker />
      <Navbar />
      {children}
    </>
  );
}
