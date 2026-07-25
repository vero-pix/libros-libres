/**
 * Compresión de imágenes en el navegador antes de subir.
 * Forzamos JPEG porque iOS Safari no soporta codificación WebP en canvas
 * — si se envía WebP declarado pero con contenido JPEG, Anthropic lo rechaza.
 *
 * MEMORIA (crítico en móvil): iOS Safari tira "no hay suficiente memoria para
 * la operación" cuando se decodifican fotos grandes o se suben muchas seguidas.
 * Por eso: (1) preferimos createImageBitmap, que decodifica fuera del hilo
 * principal y se libera de golpe con .close(); (2) liberamos el canvas y los
 * object URLs siempre. Sin esto, subir 10-15 libros seguidos reventaba la pestaña.
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

/** Redimensiona manteniendo proporción; solo achica, nunca agranda. */
function fit(width: number, height: number, maxWidth: number, maxHeight: number): [number, number] {
  if (width <= maxWidth && height <= maxHeight) return [width, height];
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return [Math.round(width * ratio), Math.round(height * ratio)];
}

/** Dibuja el origen ya escalado y lo codifica a JPEG, liberando el canvas. */
function drawToJpeg(
  source: CanvasImageSource & { width: number; height: number },
  originalFile: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File> {
  const [width, height] = fit(source.width, source.height, maxWidth, maxHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const out = blob
          ? new File([blob], originalFile.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
          : originalFile;
        // Liberamos el canvas de inmediato (evita acumular memoria en móvil).
        canvas.width = 0;
        canvas.height = 0;
        resolve(out);
      },
      "image/jpeg",
      quality
    );
  });
}

async function canvasCompress(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
  // Camino preferido: createImageBitmap decodifica de forma eficiente y permite
  // soltar el bitmap con .close() sin esperar al recolector — decisivo para que
  // el iPhone no se quede sin memoria subiendo muchas fotos.
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | null = null;
    try {
      // "from-image" respeta la orientación EXIF (si no, las fotos salen giradas).
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" as unknown as ImageOrientation });
      return await drawToJpeg(bitmap, file, maxWidth, maxHeight, quality);
    } catch {
      // Navegador viejo o decode fallido → caemos al método clásico.
    } finally {
      bitmap?.close();
    }
  }
  return imageElementCompress(file, maxWidth, maxHeight, quality);
}

/** Método clásico (fallback): <img> + canvas, ahora liberando el object URL. */
function imageElementCompress(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    const finish = (result: File) => {
      URL.revokeObjectURL(url); // <-- antes nunca se liberaba: fuga acumulativa
      img.src = "";
      resolve(result);
    };
    img.onload = async () => {
      finish(await drawToJpeg(img, file, maxWidth, maxHeight, quality));
    };
    img.onerror = () => finish(file);
    img.src = url;
  });
}
