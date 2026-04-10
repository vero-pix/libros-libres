/**
 * Compress and resize an image file before uploading.
 * Outputs WebP for smaller file sizes and better quality.
 * Max dimensions: 1200x1600 (book cover proportions)
 * Quality: 0.8 — good balance between quality and size
 */
export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1600, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressed = new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressed);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
