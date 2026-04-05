import MapaClient from "./MapaClient";

export const dynamic = "force-dynamic";

export default function MapaPage() {
  return (
    <div className="flex flex-col h-screen">
      <MapaClient />
    </div>
  );
}
