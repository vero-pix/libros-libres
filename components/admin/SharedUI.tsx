"use client";

export function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
        active ? "bg-ink text-white" : "text-gray-500 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

export function SmallBtn({ onClick, color, children }: { onClick: () => void; color: "red" | "green" | "yellow"; children: React.ReactNode }) {
  const colors = {
    red: "text-red-500 border-red-200 hover:bg-red-50",
    green: "text-green-600 border-green-200 hover:bg-green-50",
    yellow: "text-yellow-600 border-yellow-200 hover:bg-yellow-50",
  };
  return (
    <button onClick={onClick} className={`text-[10px] px-2 py-1 rounded border ${colors[color]}`}>
      {children}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-gray-400 py-8">{text}</p>;
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
