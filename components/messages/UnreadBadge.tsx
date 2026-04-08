"use client";

import { useState, useEffect } from "react";

export default function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/messages/unread");
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
        }
      } catch {
        // silently fail
      }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="bg-brand-500 text-white text-[9px] font-bold min-w-[16px] h-4 inline-flex items-center justify-center rounded-full px-1 ml-1">
      {count > 99 ? "99+" : count}
    </span>
  );
}
