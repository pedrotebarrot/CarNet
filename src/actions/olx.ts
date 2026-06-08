'use server';

import { getAdminDb } from '@/firebase/admin';

// ─── OLX category IDs for vehicles ───────────────────────────────────────────
// Category 2020 = Carros, Vans e Utilitários
// https://developers.olx.com.br/anuncio/home.html

function mapOlxFuel(fuel: string): string {
  const f = fuel.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (f.includes('flex'))                                           return 'flex';
  if (f.includes('eletric') || f.includes('eletro'))               return 'eletrico';
  if (f.includes('hibrido') || f.includes('hybrid'))               return 'hibrido';
  if (f.includes('diesel'))                                         return 'diesel';
  if (f.includes('gas natural') || f.includes('gnv'))              return 'gnv';
  if (f.includes('etanol') || f.includes('alcool'))                return 'alcool';
  return 'gasolina';
}

function mapOlxTransmission(t: string): string {
  const s = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (s.includes('auto') || s.includes('cvt')) return 'automatico';
  return 'manual';
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublishVehicleToOlxInput {
  dealershipId: string;
  vehicleId:    string;
  make:         string;
  model:        string;
  year:         number;
  modelYear?:   number;
  mileage?:     number;
  price?:       number; // cents
  fuel:         string;
  transmission: string;
  color:        string;
  doors?:       number;
  description?: string;
  images?:      string[];
  plate?:       string;
  plateEnding?: string;
}

export interface OlxPublishResult {
  success: boolean;
  adId?:   string;
  error?:  string;
}

// ─── Refresh token helper ─────────────────────────────────────────────────────

async function refreshOlxToken(dealershipId: string, refreshToken: string): Promise<string | null> {
  const clientId     = process.env.OLX_CLIENT_ID;
  const clientSecret = process.env.OLX_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://auth.olx.com.br/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;

  const tokens = await res.json();
  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);

  const db = getAdminDb();
  await db.doc(`dealerships/${dealershipId}`).update({
    'integrations.olx.accessToken':  tokens.access_token,
    'integrations.olx.expiresAt':    expiresAt,
    ...(tokens.refresh_token
      ? { 'integrations.olx.refreshToken': tokens.refresh_token }
      : {}),
  });

  return tokens.access_token as string;
}

// ─── Get valid OLX token ──────────────────────────────────────────────────────

async function getOlxToken(dealershipId: string): Promise<string | null> {
  const db   = getAdminDb();
  const snap = await db.doc(`dealerships/${dealershipId}`).get();
  if (!snap.exists) return null;

  const olx = (snap.data() as any)?.integrations?.olx;
  if (!olx?.connected || !olx?.accessToken) return null;

  const expiresAt = olx.expiresAt?.toDate?.() ?? new Date(olx.expiresAt);
  const isExpired = expiresAt < new Date(Date.now() + 60_000); // 1 min buffer

  if (isExpired && olx.refreshToken) {
    return refreshOlxToken(dealershipId, olx.refreshToken);
  }

  return olx.accessToken as string;
}

// ─── Publish vehicle to OLX ──────────────────────────────────────────────────

export async function publishVehicleToOlx(v: PublishVehicleToOlxInput): Promise<OlxPublishResult> {
  const token = await getOlxToken(v.dealershipId);
  if (!token) return { success: false, error: 'OLX não conectado. Conecte sua conta em Configurações.' };

  const db        = getAdminDb();
  const dSnap     = await db.doc(`dealerships/${v.dealershipId}`).get();
  const dealership = { id: v.dealershipId, ...(dSnap.data() ?? {}) } as any;

  const priceReais = Math.round((v.price ?? 0) / 100);
  const mileage    = Math.max(0, v.mileage ?? 0);
  const images     = (v.images ?? []).slice(0, 20);

  const subject = `${v.make} ${v.model} ${v.year}/${v.modelYear ?? v.year}`;
  const body    =
    v.description ||
    `${subject} — ${mileage.toLocaleString('pt-BR')} km, ${v.fuel}, ${v.transmission}, ${v.color}` +
    (v.doors ? `, ${v.doors} portas` : '') +
    (v.plateEnding ? `. Final de placa: ${v.plateEnding}` : '') +
    '.';

  // OLX auto-upload JSON format
  const payload: Record<string, any> = {
    subject,
    body,
    category: { id: '2020' }, // Carros, Vans e Utilitários
    price:    priceReais > 0 ? { price: priceReais, negotiable: '1' } : { negotiable: '1' },
    phone:    { phone: dealership.phone ?? '', phone_hidden: '0' },
    params:   {
      cartype:      [{ key: 'carros_e_caminhonetes' }],
      marca:        v.make,
      modelo:       v.model,
      regiao:       [{ key: dealership.city ?? '' }],
      fuel:         [{ key: mapOlxFuel(v.fuel) }],
      car_color:    [{ key: v.color.toLowerCase() }],
      gearbox:      [{ key: mapOlxTransmission(v.transmission) }],
      ...(v.doors    ? { doors:    [{ key: String(v.doors) }] }    : {}),
      ...(mileage    ? { mileage:  [{ key: String(Math.round(mileage / 1000) * 1000) }] } : {}),
      ...(v.year     ? { car_year: [{ key: String(v.year) }] }     : {}),
    },
    images: images.map((url, i) => ({ url, label: i === 0 ? 'capa' : String(i) })),
  };

  const res = await fetch('https://api.olx.com.br/autoupload/v1.0/insertado', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('OLX publish error:', errText);
    return { success: false, error: `OLX: ${errText.slice(0, 300)}` };
  }

  const result = await res.json();
  const adId   = result?.ad_id ?? result?.id ?? result?.listId;

  // Save OLX ad ID on vehicle doc
  if (adId) {
    await db.doc(`vehicles/${v.vehicleId}`).update({
      'publishedTo.olx': { adId, publishedAt: new Date() },
    });
  }

  return { success: true, adId };
}

// ─── Disconnect OLX ──────────────────────────────────────────────────────────

export async function disconnectOLX(dealershipId: string): Promise<void> {
  const db = getAdminDb();
  await db.doc(`dealerships/${dealershipId}`).update({
    'integrations.olx': {
      connected:   false,
      accessToken: null,
      refreshToken: null,
    },
  });
}
