"use client";

import { useState, useEffect } from "react";

/**
 * Ilustración animada: estantería personal → librería visible en la red.
 * Muestra la transformación de libros ocultos a libros geolocalizados.
 */
export default function ShelfTransformation() {
  const [phase, setPhase] = useState<"shelf" | "transform" | "network">("shelf");

  useEffect(() => {
    const cycle = () => {
      setPhase("shelf");
      setTimeout(() => setPhase("transform"), 3000);
      setTimeout(() => setPhase("network"), 5000);
    };
    cycle();
    const interval = setInterval(cycle, 9000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto h-72 sm:h-80">
      {/* Phase labels */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-4">
        <span className={`text-[10px] uppercase tracking-widest font-semibold transition-all duration-700 ${
          phase === "shelf" ? "text-ink-muted" : "text-cream-dark"
        }`}>
          Antes
        </span>
        <span className={`text-[10px] uppercase tracking-widest font-semibold transition-all duration-700 ${
          phase === "network" ? "text-brand-600" : "text-cream-dark"
        }`}>
          Con tuslibros.cl
        </span>
      </div>

      <svg
        viewBox="0 0 500 300"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── BOOKSHELF (always visible, fades in phase) ── */}
        <g className={`transition-all duration-1000 ${
          phase === "network" ? "opacity-20" : "opacity-100"
        }`}>
          {/* Shelf structure */}
          <rect x="100" y="60" width="140" height="8" rx="2" fill="#ede7db" />
          <rect x="100" y="130" width="140" height="8" rx="2" fill="#ede7db" />
          <rect x="100" y="200" width="140" height="8" rx="2" fill="#ede7db" />
          <rect x="96" y="56" width="4" height="156" rx="1" fill="#ede7db" />
          <rect x="240" y="56" width="4" height="156" rx="1" fill="#ede7db" />

          {/* Books on shelf — top row */}
          <rect x="108" y="72" width="14" height="54" rx="2" fill="#d4a017" opacity="0.8" />
          <rect x="125" y="78" width="12" height="48" rx="2" fill="#b8860b" opacity="0.7" />
          <rect x="140" y="70" width="16" height="56" rx="2" fill="#966d09" opacity="0.6" />
          <rect x="160" y="76" width="11" height="50" rx="2" fill="#d4a017" opacity="0.5" />
          <rect x="175" y="72" width="15" height="54" rx="2" fill="#b8860b" opacity="0.7" />
          <rect x="194" y="80" width="13" height="46" rx="2" fill="#7a580a" opacity="0.5" />
          <rect x="210" y="74" width="14" height="52" rx="2" fill="#d4a017" opacity="0.6" />

          {/* Books — bottom row */}
          <rect x="110" y="142" width="16" height="54" rx="2" fill="#966d09" opacity="0.6" />
          <rect x="130" y="148" width="12" height="48" rx="2" fill="#d4a017" opacity="0.5" />
          <rect x="146" y="140" width="14" height="56" rx="2" fill="#b8860b" opacity="0.7" />
          <rect x="164" y="146" width="13" height="50" rx="2" fill="#7a580a" opacity="0.5" />
          <rect x="181" y="142" width="15" height="54" rx="2" fill="#d4a017" opacity="0.8" />
          <rect x="200" y="150" width="11" height="46" rx="2" fill="#966d09" opacity="0.6" />

          {/* Dust particles — invisible books */}
          <circle cx="170" cy="240" r="2" fill="#ede7db" opacity="0.5" />
          <circle cx="130" cy="245" r="1.5" fill="#ede7db" opacity="0.3" />
          <circle cx="210" cy="238" r="1.5" fill="#ede7db" opacity="0.4" />
        </g>

        {/* Label under shelf */}
        <text
          x="170" y="260"
          textAnchor="middle"
          className={`text-[11px] font-sans transition-all duration-700 ${
            phase === "shelf" ? "fill-[#6b6b7b]" : "fill-[#ede7db]"
          }`}
        >
          {phase === "shelf" ? "Libros acumulando polvo" : ""}
        </text>

        {/* ── TRANSFORMATION ARROW ── */}
        <g className={`transition-all duration-1000 ${
          phase === "transform" ? "opacity-100" : "opacity-0"
        }`}>
          {/* Arrow */}
          <line x1="260" y1="140" x2="320" y2="140" stroke="#d4a017" strokeWidth="2" strokeDasharray="6 4">
            <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
          </line>
          <polygon points="320,134 332,140 320,146" fill="#d4a017" />

          {/* Sparkles around arrow */}
          <circle cx="290" cy="125" r="2" fill="#d4a017">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="305" cy="155" r="1.5" fill="#d4a017">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="275" cy="150" r="1.5" fill="#d4a017">
            <animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="1s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* ── NETWORK / MAP ── */}
        <g className={`transition-all duration-1000 ${
          phase === "network" ? "opacity-100" : phase === "transform" ? "opacity-40" : "opacity-0"
        }`}>
          {/* Map background */}
          <rect x="300" y="50" width="170" height="200" rx="12" fill="#faf8f4" stroke="#ede7db" strokeWidth="1.5" />

          {/* Map "streets" */}
          <line x1="320" y1="90" x2="450" y2="90" stroke="#ede7db" strokeWidth="1" />
          <line x1="320" y1="140" x2="450" y2="140" stroke="#ede7db" strokeWidth="1" />
          <line x1="320" y1="190" x2="450" y2="190" stroke="#ede7db" strokeWidth="1" />
          <line x1="350" y1="60" x2="350" y2="240" stroke="#ede7db" strokeWidth="1" />
          <line x1="400" y1="60" x2="400" y2="240" stroke="#ede7db" strokeWidth="1" />
          <line x1="440" y1="60" x2="440" y2="240" stroke="#ede7db" strokeWidth="1" />

          {/* Book pins with pulse */}
          {[
            { cx: 340, cy: 80, delay: "0s" },
            { cx: 370, cy: 120, delay: "0.3s" },
            { cx: 420, cy: 95, delay: "0.6s" },
            { cx: 355, cy: 170, delay: "0.9s" },
            { cx: 410, cy: 160, delay: "1.2s" },
            { cx: 445, cy: 130, delay: "0.4s" },
            { cx: 330, cy: 210, delay: "0.7s" },
            { cx: 390, cy: 210, delay: "1s" },
            { cx: 450, cy: 200, delay: "0.2s" },
          ].map((pin, i) => (
            <g key={i}>
              {/* Pulse ring */}
              <circle cx={pin.cx} cy={pin.cy} r="6" fill="none" stroke="#d4a017" strokeWidth="1" opacity="0.3">
                <animate attributeName="r" values="6;14;6" dur="2s" begin={pin.delay} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" begin={pin.delay} repeatCount="indefinite" />
              </circle>
              {/* Pin */}
              <circle cx={pin.cx} cy={pin.cy} r="5" fill="#d4a017" stroke="#fff" strokeWidth="1.5">
                <animate attributeName="r" values="4;5;4" dur="2s" begin={pin.delay} repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          {/* Connection lines between nearby pins */}
          <line x1="340" y1="80" x2="370" y2="120" stroke="#d4a017" strokeWidth="0.5" opacity="0.2" />
          <line x1="370" y1="120" x2="420" y2="95" stroke="#d4a017" strokeWidth="0.5" opacity="0.2" />
          <line x1="355" y1="170" x2="410" y2="160" stroke="#d4a017" strokeWidth="0.5" opacity="0.2" />
          <line x1="330" y1="210" x2="390" y2="210" stroke="#d4a017" strokeWidth="0.5" opacity="0.2" />

          {/* "You are here" marker */}
          <circle cx="385" cy="150" r="8" fill="#3b82f6" opacity="0.15">
            <animate attributeName="r" values="8;16;8" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="385" cy="150" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
        </g>

        {/* Network label */}
        <text
          x="385" y="265"
          textAnchor="middle"
          className={`text-[11px] font-sans transition-all duration-700 ${
            phase === "network" ? "fill-[#b8860b]" : "fill-[#ede7db]"
          }`}
        >
          {phase === "network" ? "Visibles para todos" : ""}
        </text>
      </svg>
    </div>
  );
}
