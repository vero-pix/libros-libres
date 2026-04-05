"use client";

import { useState, useEffect } from "react";

/**
 * Ilustración animada: estantería personal → red de libros conectados en la ciudad.
 * Transición de libros ocultos a marketplace vivo con geolocalización.
 */

const BOOKS = [
  { color: "#e74c3c", title: "Neruda", h: 58 },
  { color: "#3498db", title: "Bolaño", h: 52 },
  { color: "#f39c12", title: "Allende", h: 62 },
  { color: "#2ecc71", title: "Mistral", h: 48 },
  { color: "#9b59b6", title: "Lemebel", h: 55 },
  { color: "#e67e22", title: "Donoso", h: 50 },
  { color: "#1abc9c", title: "Parra", h: 60 },
];

const NODES = [
  { x: 85, y: 65, label: "Providencia" },
  { x: 200, y: 45, label: "Las Condes" },
  { x: 310, y: 80, label: "Ñuñoa" },
  { x: 140, y: 150, label: "Santiago Centro" },
  { x: 260, y: 140, label: "Macul" },
  { x: 380, y: 55, label: "La Reina" },
  { x: 50, y: 160, label: "Estación Central" },
  { x: 340, y: 170, label: "Peñalolén" },
  { x: 420, y: 140, label: "La Florida" },
];

const CONNECTIONS = [
  [0, 1], [0, 3], [1, 2], [1, 5], [2, 4], [2, 5],
  [3, 4], [3, 6], [4, 7], [5, 8], [7, 8], [6, 3],
];

export default function ShelfTransformation() {
  const [phase, setPhase] = useState<"shelf" | "transform" | "network">("shelf");

  useEffect(() => {
    const cycle = () => {
      setPhase("shelf");
      setTimeout(() => setPhase("transform"), 3500);
      setTimeout(() => setPhase("network"), 6000);
    };
    cycle();
    const interval = setInterval(cycle, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Phase indicator */}
      <div className="flex justify-between mb-3 px-2">
        <span className={`text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-700 ${
          phase === "shelf" ? "text-ink-muted" : "text-cream-dark/40"
        }`}>
          Antes
        </span>
        <span className={`text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-700 ${
          phase === "network" ? "text-brand-600" : "text-cream-dark/40"
        }`}>
          Con tuslibros.cl
        </span>
      </div>

      <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-cream-warm to-cream border border-cream-dark/30">
        {/* ── PHASE 1: DUSTY BOOKSHELF ── */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${
          phase === "shelf" ? "opacity-100 scale-100" : phase === "transform" ? "opacity-50 scale-95 blur-[2px]" : "opacity-0 scale-90 blur-sm"
        }`}>
          {/* Dust overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-900/5" />

          {/* Shelf */}
          <div className="relative">
            {/* Top shelf */}
            <div className="flex items-end gap-1.5 px-3 pb-0">
              {BOOKS.map((book, i) => (
                <div
                  key={i}
                  className="relative rounded-t-sm shadow-sm opacity-60"
                  style={{
                    width: 22,
                    height: book.h,
                    backgroundColor: book.color,
                    filter: "grayscale(50%) brightness(0.8)",
                  }}
                >
                  <div className="absolute inset-x-0 top-2 bottom-2 mx-[3px] border-l border-white/15 border-r border-white/10" />
                  <div className="absolute bottom-1 left-0 right-0 text-[3px] text-white/30 text-center truncate px-0.5">
                    {book.title}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-[190px] h-2 bg-amber-800/20 rounded-sm shadow-inner" />

            {/* Bottom shelf */}
            <div className="flex items-end gap-1.5 px-3 pb-0 mt-1">
              {[...BOOKS].reverse().slice(0, 5).map((book, i) => (
                <div
                  key={i}
                  className="relative rounded-t-sm shadow-sm opacity-50"
                  style={{
                    width: 22,
                    height: book.h - 8,
                    backgroundColor: book.color,
                    filter: "grayscale(60%) brightness(0.7)",
                  }}
                >
                  <div className="absolute inset-x-0 top-2 bottom-2 mx-[3px] border-l border-white/10" />
                </div>
              ))}
            </div>
            <div className="w-[190px] h-2 bg-amber-800/20 rounded-sm shadow-inner" />
          </div>

          {/* Dust particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-amber-700/10 animate-pulse"
              style={{
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                left: `${20 + Math.random() * 60}%`,
                top: `${30 + Math.random() * 50}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}

          <p className="mt-5 text-xs text-ink-muted/60 italic">
            Millones de libros acumulando polvo...
          </p>
        </div>

        {/* ── PHASE 2: TRANSFORMATION ── */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
          phase === "transform" ? "opacity-100" : "opacity-0"
        }`}>
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {/* Spinning ring */}
              <div className="w-16 h-16 rounded-full border-2 border-brand-600/30 border-t-brand-600 animate-spin" />
              {/* Book icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-600">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-brand-600 animate-pulse">
              Conectando lectores...
            </p>
          </div>
        </div>

        {/* ── PHASE 3: CONNECTED NETWORK ── */}
        <div className={`absolute inset-0 transition-all duration-1000 ${
          phase === "network" ? "opacity-100 scale-100" : "opacity-0 scale-110"
        }`}>
          <svg viewBox="0 0 480 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Cordillera silhouette */}
            <path
              d="M0,60 Q40,20 80,45 Q120,10 160,35 Q200,5 240,30 Q280,0 320,25 Q360,10 400,40 Q440,15 480,50 L480,240 L0,240 Z"
              fill="url(#mountainGrad)"
              opacity="0.15"
            />
            <defs>
              <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d4a017" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#d4a017" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#d4a017" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Connection lines */}
            {CONNECTIONS.map(([a, b], i) => (
              <line
                key={i}
                x1={NODES[a].x}
                y1={NODES[a].y}
                x2={NODES[b].x}
                y2={NODES[b].y}
                stroke="url(#lineGrad)"
                strokeWidth="1.5"
              >
                <animate
                  attributeName="opacity"
                  values="0.2;0.6;0.2"
                  dur={`${2 + i * 0.3}s`}
                  repeatCount="indefinite"
                />
              </line>
            ))}

            {/* Nodes — each is a book location */}
            {NODES.map((node, i) => {
              const book = BOOKS[i % BOOKS.length];
              return (
                <g key={i}>
                  {/* Pulse */}
                  <circle cx={node.x} cy={node.y} r="8" fill={book.color} opacity="0.15">
                    <animate
                      attributeName="r"
                      values="8;18;8"
                      dur="3s"
                      begin={`${i * 0.35}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.15;0;0.15"
                      dur="3s"
                      begin={`${i * 0.35}s`}
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Book mini icon */}
                  <rect
                    x={node.x - 6}
                    y={node.y - 8}
                    width="12"
                    height="16"
                    rx="2"
                    fill={book.color}
                    stroke="#fff"
                    strokeWidth="1.5"
                    className="drop-shadow-sm"
                  />
                  <line
                    x1={node.x - 3}
                    y1={node.y - 6}
                    x2={node.x + 4}
                    y2={node.y - 6}
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  <line
                    x1={node.x - 3}
                    y1={node.y - 3}
                    x2={node.x + 2}
                    y2={node.y - 3}
                    stroke="white"
                    strokeWidth="0.8"
                    opacity="0.4"
                  />

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + 18}
                    textAnchor="middle"
                    className="text-[7px] font-sans"
                    fill="#6b6b7b"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* Traveling book animation */}
            {CONNECTIONS.slice(0, 4).map(([a, b], i) => (
              <circle key={`travel-${i}`} r="2.5" fill="#d4a017">
                <animateMotion
                  dur={`${2 + i * 0.5}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.8}s`}
                  path={`M${NODES[a].x},${NODES[a].y} L${NODES[b].x},${NODES[b].y}`}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur={`${2 + i * 0.5}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.8}s`}
                />
              </circle>
            ))}

            {/* Counter */}
            <text x="240" y="228" textAnchor="middle" className="text-[9px] font-sans font-medium" fill="#b8860b">
              9 libros conectando lectores en Santiago
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
