'use client';

import type { Vehicle } from '@/lib/data';
import type { BrandPalette } from '@/lib/utils/colors';
import { DEFAULT_PALETTE } from '@/lib/utils/colors';

interface Dealership {
  name?: string;
  logoUrl?: string;
  phone?: string;
}

interface PostPreviewProps {
  vehicle: Vehicle;
  dealership?: Dealership | null;
  palette?: BrandPalette;
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatMileage(km: number) {
  return new Intl.NumberFormat('pt-BR').format(km);
}

export function PostPreview({ vehicle, dealership, palette = DEFAULT_PALETTE }: PostPreviewProps) {
  const coverImage = vehicle.featuredImage ?? vehicle.images?.[0];
  const otherImages = (vehicle.images ?? []).slice(1);
  const dealershipName = dealership?.name ?? '';
  const initials = dealershipName.substring(0, 2).toUpperCase() || 'AD';

  return (
    <div className="space-y-3">

      {/* ── Cover template ────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-xl shadow-lg"
        style={{ aspectRatio: '1 / 1', width: '100%' }}
      >
        {/* Background: car photo */}
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: palette.header }} />
        )}

        {/* Subtle full-image dark veil */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.12)' }} />

        {/* Bottom gradient in brand color */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top,
              ${palette.header}f2 0%,
              ${palette.header}cc 20%,
              ${palette.header}66 42%,
              ${palette.header}22 58%,
              transparent 72%)`,
          }}
        />

        {/* Top-left: logo */}
        <div className="absolute top-4 left-4">
          {dealership?.logoUrl ? (
            <div
              className="h-14 w-14 overflow-hidden rounded-xl"
              style={{
                border: '2px solid rgba(255,255,255,0.30)',
                backgroundColor: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <img
                src={dealership.logoUrl}
                alt={dealershipName}
                className="h-full w-full object-contain"
              />
            </div>
          ) : dealershipName ? (
            <div
              className="h-14 w-14 flex items-center justify-center rounded-xl font-headline font-bold text-lg text-white"
              style={{
                backgroundColor: palette.primary,
                border: '2px solid rgba(255,255,255,0.25)',
              }}
            >
              {initials}
            </div>
          ) : null}
        </div>

        {/* Top-right: subtle "AutosDigital" watermark */}
        <div
          className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.30)' }}
        >
          autosdigital
        </div>

        {/* Bottom info block */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10">
          {/* Make + Model */}
          <p
            className="font-headline font-bold text-2xl leading-tight text-white"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
          >
            {vehicle.make} {vehicle.model}
          </p>

          {/* Year • Mileage */}
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {vehicle.year}/{vehicle.modelYear}&nbsp;&nbsp;•&nbsp;&nbsp;{formatMileage(vehicle.mileage)} km
          </p>

          {/* Price + Phone */}
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="font-headline font-bold text-2xl text-white">
              {formatPrice(vehicle.price)}
            </p>
            {dealership?.phone && (
              <p
                className="font-mono text-xs pb-0.5 truncate"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {dealership.phone}
              </p>
            )}
          </div>

          {/* Dealership name */}
          {dealershipName && (
            <p
              className="mt-1 font-mono text-[10px] uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              {dealershipName}
            </p>
          )}
        </div>
      </div>

      {/* ── Carousel strip ────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-medium" style={{ color: '#45464d' }}>
          Carrossel — {1 + otherImages.length} slide{otherImages.length > 0 ? 's' : ''}
          {otherImages.length > 0 && <span style={{ color: '#45464d' }}> (capa + {otherImages.length} foto{otherImages.length > 1 ? 's' : ''})</span>}
        </p>
        <div className="flex gap-2 flex-wrap">
          {/* Cover thumbnail */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg" style={{ border: `2px solid ${palette.primary}` }}>
            {coverImage && (
              <img src={coverImage} alt="Capa" className="h-full w-full object-cover" />
            )}
            <div
              className="absolute inset-0 flex items-end justify-center pb-1"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}
            >
              <span className="font-mono text-[8px] font-bold text-white">CAPA</span>
            </div>
          </div>

          {/* Other images */}
          {otherImages.map((img, i) => (
            <div
              key={i}
              className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
              style={{ border: '1px solid #e5eeff' }}
            >
              <img src={img} alt={`Foto ${i + 2}`} className="h-full w-full object-cover" />
            </div>
          ))}

          {/* Placeholder if no other images */}
          {otherImages.length === 0 && (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg"
              style={{ border: '1px dashed #e5eeff', backgroundColor: '#f8f9ff' }}
            >
              <span className="text-center font-mono text-[9px]" style={{ color: '#45464d' }}>
                + fotos<br/>do carro
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
