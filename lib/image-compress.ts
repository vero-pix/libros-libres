/**
 * Ultra-light compression for AI scanning.
 * We don't need high res, just enough for the AI to read text.
 * Max 800px, 0.6 quality, JPG (most compatible).
 */
export async function compressScanImage(file: File): Promise<File> {
  return compressImage(file, 800, 800, 0.6);
}

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
