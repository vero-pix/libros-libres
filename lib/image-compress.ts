/**
 * Ultra-light compression for AI scanning.
 * Forzamos JPEG porque iOS Safari no soporta codificación WebP en canvas
 * — si se envía WebP declarado pero con contenido JPEG, Anthropic lo rechaza.
 */
export async function compressScanImage(file: File): Promise<File> {
  return compressToJpeg(file, 900, 900, 0.82);
}

export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1600, quality = 0.8): Promise<File> {
  return compressToJpeg(file, maxWidth, maxHeight, quality);
}

function compressToJpeg(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
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
            const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressed);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
