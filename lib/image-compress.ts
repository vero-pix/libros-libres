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

// HEIC/HEIF (fotos de iPhone y Samsung) no se decodifican en <canvas> en
// Chrome/Android/Windows, así que el archivo se subía sin convertir y el
// navegador no podía mostrarlo. Lo convertimos a JPEG antes de comprimir.
function isHeic(file: File): boolean {
  return /image\/heic|image\/heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name);
}

async function heicToJpeg(file: File): Promise<File> {
  try {
    const heic2any = (await import("heic2any")).default;
    const blob = (await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })) as Blob;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file; // si falla la conversión, seguimos con el original
  }
}

async function compressToJpeg(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
  const input = isHeic(file) ? await heicToJpeg(file) : file;
  return canvasCompress(input, maxWidth, maxHeight, quality);
}

function canvasCompress(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
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
