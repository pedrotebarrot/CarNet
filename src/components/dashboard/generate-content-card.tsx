'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Copy, Loader2, Download, Instagram } from 'lucide-react';
import type { Vehicle } from '@/lib/data';
import { generateInstagramCaption } from '@/ai/flows/generate-instagram-caption';
import { PostPreview } from './post-preview';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { buildBrandPalette, DEFAULT_PALETTE, type BrandPalette, hexToHsl, hslToHex } from '@/lib/utils/colors';

// ── Canvas helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateCoverCanvas(
  vehicle: Vehicle,
  dealership: { name?: string; logoUrl?: string; phone?: string } | null | undefined,
  palette: BrandPalette,
): Promise<Blob> {
  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // 1. Background — car photo or solid fallback
  const carImageSrc = vehicle.images?.[0] ?? vehicle.featuredImage;
  if (carImageSrc) {
    try {
      const img = await loadImage(carImageSrc);
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
    } catch {
      ctx.fillStyle = palette.header;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }
  } else {
    ctx.fillStyle = palette.header;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  // 2. Subtle full-image dark veil
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 3. Bottom gradient overlay in brand color
  const headerRgb = hexToRgb(palette.header);
  const grad = ctx.createLinearGradient(0, SIZE * 0.28, 0, SIZE);
  grad.addColorStop(0,    `rgba(${headerRgb}, 0)`);
  grad.addColorStop(0.30, `rgba(${headerRgb}, 0.4)`);
  grad.addColorStop(0.55, `rgba(${headerRgb}, 0.8)`);
  grad.addColorStop(1,    `rgba(${headerRgb}, 0.95)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 4. Logo (top-left)
  const LOGO_PAD = 44;
  const LOGO_SIZE = 88;
  const LOGO_RADIUS = 14;

  if (dealership?.logoUrl) {
    try {
      const logoImg = await loadImage(dealership.logoUrl);
      ctx.save();
      roundRectPath(ctx, LOGO_PAD, LOGO_PAD, LOGO_SIZE, LOGO_SIZE, LOGO_RADIUS);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.clip();
      ctx.drawImage(logoImg, LOGO_PAD, LOGO_PAD, LOGO_SIZE, LOGO_SIZE);
      ctx.restore();
      // Border ring
      ctx.save();
      roundRectPath(ctx, LOGO_PAD, LOGO_PAD, LOGO_SIZE, LOGO_SIZE, LOGO_RADIUS);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    } catch {
      drawLogoFallback(ctx, dealership?.name, palette, LOGO_PAD, LOGO_SIZE, LOGO_RADIUS);
    }
  } else {
    drawLogoFallback(ctx, dealership?.name, palette, LOGO_PAD, LOGO_SIZE, LOGO_RADIUS);
  }

  // 5. Subtle watermark (top-right)
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '500 24px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('autosdigital', SIZE - LOGO_PAD, LOGO_PAD + 10);
  ctx.restore();

  // 6. Text block (bottom)
  const PAD = 50;
  const BOTTOM = SIZE - PAD;

  // Dealership name (tiny, topmost)
  if (dealership?.name) {
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = '400 26px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(dealership.name.toUpperCase(), PAD, BOTTOM - 248);
  }

  // Make + Model
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 74px 'Helvetica Neue', Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  const carName = `${vehicle.make} ${vehicle.model}`;
  // Trim if too long
  let displayName = carName;
  while (ctx.measureText(displayName).width > SIZE - PAD * 2 - 20 && displayName.length > 0) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== carName) displayName += '…';
  ctx.fillText(displayName, PAD, BOTTOM - 165);
  ctx.shadowBlur = 0;

  // Year • Mileage
  const km = vehicle.mileage.toLocaleString('pt-BR');
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.font = '400 36px Arial, sans-serif';
  ctx.fillText(`${vehicle.year}/${vehicle.modelYear}  •  ${km} km`, PAD, BOTTOM - 108);

  // Price
  const price = (vehicle.price / 100).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  });
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 58px 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillText(price, PAD, BOTTOM - 44);

  // Phone (right side, aligned with price)
  if (dealership?.phone) {
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.font = '400 30px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(dealership.phone, SIZE - PAD, BOTTOM - 44);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

function drawLogoFallback(
  ctx: CanvasRenderingContext2D,
  name: string | undefined,
  palette: BrandPalette,
  pad: number,
  size: number,
  radius: number,
) {
  ctx.save();
  roundRectPath(ctx, pad, pad, size, size, radius);
  ctx.fillStyle = palette.primary;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.34}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name ?? 'AD').substring(0, 2).toUpperCase(), pad + size / 2, pad + size / 2);
  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GenerateContentCard({ vehicle }: { vehicle: Vehicle }) {
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [isDownloading,    setIsDownloading]    = useState(false);
  const [caption,          setCaption]          = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  // Fetch dealership to get logo, phone and brand colors
  const dealershipRef = useMemo(() =>
    vehicle.dealershipId ? doc(firestore, 'dealerships', vehicle.dealershipId) : null,
    [vehicle.dealershipId, firestore],
  );
  const { data: dealership } = useDoc(dealershipRef);

  const palette: BrandPalette = dealership?.brandColors?.primary
    ? buildBrandPalette(dealership.brandColors.primary)
    : DEFAULT_PALETTE;

  // ── Caption generation ──────────────────────────────────────
  const handleGenerateCaption = async () => {
    setIsCaptionLoading(true);
    setCaption('');
    try {
      const result = await generateInstagramCaption({
        make:         vehicle.make,
        model:        vehicle.model,
        year:         vehicle.year,
        modelYear:    vehicle.modelYear,
        fuel:         vehicle.fuel,
        doors:        vehicle.doors,
        color:        vehicle.color,
        transmission: vehicle.transmission,
        plateEnding:  vehicle.plateEnding,
        mileage:      vehicle.mileage,
        price:        vehicle.price,
        description:  vehicle.description ?? '',
      });
      setCaption(result.caption);
    } catch (err) {
      console.error('Caption generation failed:', err);
      toast({
        title: 'Erro ao gerar legenda',
        description: 'Não foi possível conectar com o serviço de IA. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCaptionLoading(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast({ title: 'Copiado!', description: 'A legenda foi copiada para sua área de transferência.' });
  };

  // ── Cover download ──────────────────────────────────────────
  const handleDownloadCover = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateCoverCanvas(vehicle, dealership, palette);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${vehicle.make}-${vehicle.model}-capa-ig`
        .replace(/\s+/g, '-')
        .toLowerCase() + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: '✅ Capa baixada!', description: 'Arquivo PNG 1080×1080 salvo.' });
    } catch (err) {
      console.error('Cover download failed:', err);
      toast({
        title: 'Erro ao gerar capa',
        description: 'Não foi possível gerar a imagem. Verifique se o carro tem foto cadastrada.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="rounded-lg border bg-white" style={{ borderColor: '#e5eeff' }}>

      {/* Header */}
      <div className="border-b px-6 py-4" style={{ borderColor: '#e5eeff' }}>
        <div className="flex items-center gap-2">
          <Instagram className="h-5 w-5" style={{ color: '#c084fc' }} />
          <h3 className="font-headline font-semibold text-base" style={{ color: '#0b1c30' }}>
            Conteúdo para Instagram
          </h3>
        </div>
        <p className="mt-0.5 text-sm" style={{ color: '#45464d' }}>
          Gere a legenda e baixe a capa do carrossel com as cores da sua loja.
        </p>
      </div>

      <div className="p-6 grid gap-8 md:grid-cols-2">

        {/* ── Left: caption ───────────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm mb-1" style={{ color: '#0b1c30' }}>
              1. Legenda para o post
            </p>
            <p className="text-xs" style={{ color: '#45464d' }}>
              Gerada com base nos dados do veículo. Edite antes de publicar.
            </p>
          </div>

          <button
            onClick={handleGenerateCaption}
            disabled={isCaptionLoading}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#9333ea' }}
          >
            {isCaptionLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Sparkles className="h-4 w-4" />}
            {isCaptionLoading ? 'Gerando...' : 'Gerar Legenda com IA'}
          </button>

          {(isCaptionLoading || caption) && (
            <div className="relative">
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder={isCaptionLoading ? 'Aguarde, gerando legenda...' : ''}
                className="w-full min-h-[220px] resize-none rounded-lg border p-3 text-sm outline-none focus:ring-2"
                style={{
                  borderColor: '#e5eeff',
                  color: '#0b1c30',
                  backgroundColor: '#f8f9ff',
                  lineHeight: '1.6',
                }}
                readOnly={isCaptionLoading}
              />
              {caption && (
                <button
                  onClick={handleCopyCaption}
                  className="absolute top-2 right-2 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-white"
                  style={{ color: '#45464d' }}
                  title="Copiar legenda"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </button>
              )}
            </div>
          )}

          {!caption && !isCaptionLoading && (
            <div
              className="rounded-lg border-2 border-dashed p-8 text-center"
              style={{ borderColor: '#e5eeff' }}
            >
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: '#9333ea' }} />
              <p className="text-sm" style={{ color: '#45464d' }}>
                Clique em "Gerar Legenda" para criar o texto do post automaticamente.
              </p>
            </div>
          )}
        </div>

        {/* ── Right: cover template ───────────────────────────── */}
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm mb-1" style={{ color: '#0b1c30' }}>
              2. Capa do carrossel
            </p>
            <p className="text-xs" style={{ color: '#45464d' }}>
              Template com as cores da sua loja. Baixe o PNG 1080×1080 e combine com as outras fotos do carro.
            </p>
          </div>

          <PostPreview vehicle={vehicle} dealership={dealership} palette={palette} />

          <button
            onClick={handleDownloadCover}
            disabled={isDownloading}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: palette.primary }}
          >
            {isDownloading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
            {isDownloading ? 'Gerando imagem...' : 'Baixar Capa (PNG 1080×1080)'}
          </button>

          <p className="text-center text-xs" style={{ color: '#45464d' }}>
            Monte o carrossel: <strong>Capa</strong> + demais fotos do veículo em ordem.
          </p>
        </div>
      </div>
    </div>
  );
}
