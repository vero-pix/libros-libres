"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";

interface Props {
  listingId: string;
  existingImages: { id: string; image_url: string }[];
  onImagesChanged: (images: { id: string; image_url: string }[]) => void;
}

export default function ImageUploadMultiple({ listingId, existingImages, onImagesChanged }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Debes iniciar sesión");
      setUploading(false);
      return;
    }

    const newImages: { id: string; image_url: string }[] = [];

    for (const rawFile of Array.from(files)) {
      if (!rawFile.type.startsWith("image/")) continue;
      if (rawFile.size > 10 * 1024 * 1024) continue; // 10MB raw max, will compress

      const file = await compressImage(rawFile);
      const ext = "jpg";
      const path = `${user.id}/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("covers")
        .upload(path, file, { upsert: true });

      if (uploadErr) continue;

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(path);

      const { data: row } = await supabase
        .from("listing_images")
        .insert({
          listing_id: listingId,
          image_url: publicUrl,
          sort_order: images.length + newImages.length,
        })
        .select("id, image_url")
        .single();

      if (row) newImages.push(row);
    }

    // If the listing has no cover image, set it to the first uploaded image
    if (newImages.length > 0) {
      const { data: listing } = await supabase
        .from("listings")
        .select("cover_image_url")
        .eq("id", listingId)
        .single();

      if (listing && !listing.cover_image_url) {
        const firstUrl = images.length > 0 ? images[0].image_url : newImages[0].image_url;
        await supabase
          .from("listings")
          .update({ cover_image_url: firstUrl })
          .eq("id", listingId);
      }
    }

    const updated = [...images, ...newImages];
    setImages(updated);
    onImagesChanged(updated);
    setUploading(false);
  }

  async function handleRemove(imageId: string) {
    await supabase.from("listing_images").delete().eq("id", imageId);
    const updated = images.filter((i) => i.id !== imageId);
    setImages(updated);
    onImagesChanged(updated);
  }

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">
        Fotos adicionales (contraportada, estado, etc.)
      </p>
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative w-16 h-20 rounded overflow-hidden border border-gray-200">
            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
            >
              x
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= 5}
          className="w-16 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center hover:border-brand-400 transition-colors disabled:opacity-40"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[9px] text-gray-400">Foto</span>
            </>
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-[10px] text-gray-400 mt-1">{images.length}/5 fotos adicionales</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
