// ── HSL ↔ HEX conversions ────────────────────────────────────────────────────

export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360, sNorm = s / 100, lNorm = l / 100;
  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;
  const toRgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const r = Math.round(toRgb(hNorm + 1/3) * 255);
  const g = Math.round(toRgb(hNorm) * 255);
  const b = Math.round(toRgb(hNorm - 1/3) * 255);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

// ── Brand palette generator ──────────────────────────────────────────────────

export interface BrandPalette {
  header:  string;  // Very dark — navbar bg
  primary: string;  // Vibrant — buttons, badges, icons
  light:   string;  // Very light tint — card bg, section bg
  border:  string;  // Soft — card borders
  text:    string;  // Text on primary bg (white or near-black)
}

export function buildBrandPalette(primaryHex: string): BrandPalette {
  const safe = /^#[0-9a-fA-F]{6}$/.test(primaryHex) ? primaryHex : '#3980f4';
  const [h, s] = hexToHsl(safe);

  return {
    header:  hslToHex(h, Math.min(s, 55), 13),   // Dark, slight saturation
    primary: safe,
    light:   hslToHex(h, Math.min(s, 40), 96),   // Near-white tint
    border:  hslToHex(h, Math.min(s, 45), 90),   // Soft border
    text:    '#ffffff',
  };
}

// Default Stitch palette (no custom brand color)
export const DEFAULT_PALETTE: BrandPalette = {
  header:  '#131b2e',
  primary: '#3980f4',
  light:   '#eff4ff',
  border:  '#e5eeff',
  text:    '#ffffff',
};

// ── Client-side dominant color extraction ───────────────────────────────────

/**
 * Extracts the most saturated (vibrant) color from an image.
 * Works with File objects (before upload) or URLs (for existing logos).
 */
export function extractDominantColor(source: File | string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    const run = () => {
      const SIZE = 80;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve('#3980f4'); return; }

      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

      let bestColor = '#3980f4';
      let bestSat   = -1;

      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i+1], data[i+2], data[i+3]];
        if (a < 128) continue; // skip transparent

        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        const l   = (max + min) / 2;
        const d   = max - min;

        // Skip near-white, near-black, and near-gray
        if (l < 0.08 || l > 0.92 || d < 0.12) continue;

        const s = d / (1 - Math.abs(2 * l - 1));
        if (s > bestSat) {
          bestSat   = s;
          bestColor = rgbToHex(r, g, b);
        }
      }

      resolve(bestColor);
    };

    img.onload  = run;
    img.onerror = () => resolve('#3980f4');

    if (typeof source === 'string') {
      img.crossOrigin = 'Anonymous';
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}
