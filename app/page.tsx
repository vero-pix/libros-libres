import { Suspense } from "react";
import BookMap from "@/components/map/BookMap";
import SearchBar from "@/components/books/SearchBar";
import Navbar from "@/components/ui/Navbar";

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-96 flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <Suspense>
              <SearchBar />
            </Suspense>
          </div>
          <div className="flex-1 p-4">
            <p className="text-sm text-gray-500 text-center mt-8">
              Usá el mapa para explorar libros disponibles cerca tuyo.
            </p>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <Suspense fallback={<div className="w-full h-full bg-gray-100 animate-pulse" />}>
            <BookMap />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
