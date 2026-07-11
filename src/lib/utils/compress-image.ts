/** Browsers don't decode HEIC/HEIF natively (only some Safari versions do),
 * so <img>/canvas silently fails on it. Android/Chrome also often reports
 * an empty MIME type for HEIC files, so we fall back to the extension. */
export function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') return true;
  if (!type) return /\.hei[cf]$/i.test(file.name);
  return false;
}

// heic2any's bundled libheif build is stale and rejects some modern iPhone
// HEIC variants (e.g. 10-bit HDR photos) with "format not supported", so we
// decode with libheif-js instead — it tracks upstream libheif releases.
export async function convertHeicToJpeg(file: File): Promise<File> {
  const mod = await import('libheif-js/wasm-bundle');
  const libheif = await ((mod as { default?: unknown }).default ?? mod);
  const decoder = new (libheif as any).HeifDecoder();
  const buffer = await file.arrayBuffer();
  const images = decoder.decode(new Uint8Array(buffer));
  if (!images.length) throw new Error('Nenhuma imagem encontrada no arquivo HEIC');

  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');

  const imageData = ctx.createImageData(width, height);
  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (displayData: ImageData | null) => {
      if (!displayData) { reject(new Error('Falha ao decodificar HEIC')); return; }
      resolve();
    });
  });
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compression failed'))), 'image/jpeg', 0.92);
  });

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
}

/**
 * Compresses and resizes an image file before upload.
 * - Converts any format (HEIC, PNG, WebP, BMP…) to JPEG
 * - Resizes to max 1920×1080 (keeps aspect ratio)
 * - JPEG quality 85% — good balance of quality vs size
 * - Typical result: 4-8 MB phone photo → 300-800 KB
 */
export async function compressImage(
  file: File,
  maxWidth  = 1920,
  maxHeight = 1080,
  quality   = 0.85,
): Promise<File> {
  if (isHeic(file)) {
    try {
      file = await convertHeicToJpeg(file);
    } catch (err) {
      throw new Error(`Não foi possível ler o arquivo HEIC: ${file.name} (${(err as Error).message})`);
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate target dimensions preserving aspect ratio
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not available')); return; }

      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          // Rename to .jpg regardless of original extension
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Não foi possível ler o arquivo: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/** Max raw file size accepted before compression (20 MB) */
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

/** Human-readable formats accepted */
export const ACCEPTED_IMAGE_FORMATS = 'JPEG, PNG, WebP e HEIC (fotos de iPhone)';

/** Accept attribute for <input type="file"> */
export const IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif';
