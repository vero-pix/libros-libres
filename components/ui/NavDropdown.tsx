"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface DropdownItem {
  href: string;
  label: string;
}

interface Props {
  label: string;
  items: DropdownItem[];
}

export default function NavDropdown({ label, items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        className="text-xs font-medium uppercase tracking-[0.15em] px-4 py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1"
      >
        {label}
        <svg className={`w-3 h-3 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 bg-white border border-cream-dark/30 rounded-lg shadow-xl py-1 min-w-[180px] z-50"
          onMouseLeave={() => setOpen(false)}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink hover:bg-cream-warm transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
