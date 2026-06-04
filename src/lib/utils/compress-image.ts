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
