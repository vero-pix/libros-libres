"use client";

import Image from "next/image";
import type { BookData } from "@/types";

interface Props {
  book: BookData;
  onClear: () => void;
}

export default function BookPreview({ book, onClear }: Props) {
  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      {book.cover_url ? (
        <Image
          src={book.cover_url}
          alt={book.title}
          width={56}
          height={80}
          className="rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-20 bg-gray-200 rounded flex items-center justify-center text-2xl flex-shrink-0">
          📚
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{book.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
        {book.genre && (
          <p className="text-xs text-gray-400 mt-0.5">{book.genre}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="text-gray-400 hover:text-gray-600 text-sm self-start"
        aria-label="Cambiar libro"
      >
        ✕
      </button>
    </div>
  );
}
