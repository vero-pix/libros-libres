"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const close = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={close}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`text-[14px] font-medium text-black-soft px-3 py-2 rounded-full hover:bg-black/[0.05] transition-colors whitespace-nowrap flex items-center gap-1 ${open ? "bg-black/[0.05]" : ""}`}
      >
        {label}
        <svg className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div
        className={`absolute top-full right-0 bg-paper-card border border-line rounded-xl shadow-card py-1.5 min-w-[210px] z-[60] transition-all duration-200 ${
          open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
        }`}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-ink hover:bg-cream-warm/50 hover:text-coral transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
