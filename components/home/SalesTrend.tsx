"use client";

import { useEffect, useRef } from "react";

const MONTH_NAMES: Record<string, string> = {
  "01": "ene", "02": "feb", "03": "mar", "04": "abr",
  "05": "may", "06": "jun", "07": "jul", "08": "ago",
  "09": "sep", "10": "oct", "11": "nov", "12": "dic",
};

interface Props {
  soldByMonth: Record<string, number>;
  totalSold: number;
}

export default function SalesTrend({ soldByMonth, totalSold }: Props) {
  const barRefs = useRef<(SVGRectElement | null)[]>([]);

  const months = Object.keys(soldByMonth).sort();
  const counts = months.map((m) => soldByMonth[m]);
  const max = Math.max(...counts, 1);

  const BAR_W = 32;
  const GAP = 20;
  const H = 56;
  const W = months.length * (BAR_W + GAP) - GAP;

  // Animar barras al montar
  useEffect(() => {
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      const fullH = (counts[i] / max) * H;
      el.style.transition = `height 0.6s cubic-bezier(.4,0,.2,1) ${i * 0.12}s, y 0.6s cubic-bezier(.4,0,.2,1) ${i * 0.12}s`;
      requestAnimationFrame(() => {
        el.setAttribute("height", String(fullH));
        el.setAttribute("y", String(H - fullH));
      });
    });
  }, []);

  // Determinar si el último mes está incompleto (mes actual)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = months[months.length - 1];
  const lastIsPartial = lastMonth === currentMonth;

  return (
    <div className="bg-cream-warm/50 border-y border-cream-dark py-6 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Texto */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-coral font-semibold mb-1">
            Actividad real
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-ink leading-none">
            {totalSold.toLocaleString("es-CL")}
            <span className="text-base font-normal text-ink-muted ml-2">libros vendidos</span>
          </p>
          <p className="text-[12px] text-ink-muted mt-1.5">
            y contando — cada uno a su nuevo lector
          </p>
        </div>

        {/* Gráfico */}
        <div className="flex flex-col items-center gap-1">
          <svg width={W} height={H + 4} className="overflow-visible">
            {months.map((m, i) => {
              const x = i * (BAR_W + GAP);
              const isLast = i === months.length - 1;
              const color = isLast && lastIsPartial ? "#c8553d99" : "#c8553d";
              return (
                <g key={m}>
                  {/* Valor */}
                  <text
                    x={x + BAR_W / 2}
                    y={-4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#3d2b1f"
                    fontFamily="inherit"
                  >
                    {counts[i]}
                  </text>
                  {/* Barra — arranca en height=0 y anima */}
                  <rect
                    ref={(el) => { barRefs.current[i] = el; }}
                    x={x}
                    y={H}
                    width={BAR_W}
                    height={0}
                    rx={4}
                    fill={color}
                  />
                </g>
              );
            })}
          </svg>

          {/* Labels de meses */}
          <div className="flex gap-0" style={{ width: W }}>
            {months.map((m, i) => {
              const label = MONTH_NAMES[m.slice(5, 7)] ?? m.slice(5, 7);
              const isLast = i === months.length - 1;
              return (
                <div
                  key={m}
                  className="text-center font-mono text-[10px] uppercase tracking-wider"
                  style={{
                    width: BAR_W,
                    marginRight: i < months.length - 1 ? GAP : 0,
                    color: isLast && lastIsPartial ? "#c8553d99" : "#7a6355",
                  }}
                >
                  {label}
                  {isLast && lastIsPartial && (
                    <span className="block text-[8px] normal-case tracking-normal">en curso</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
