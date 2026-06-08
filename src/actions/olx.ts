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

// ─── Enable vehicle in OLX feed ──────────────────────────────────────────────
//
// OLX auto-upload uses a pull/feed model: OLX periodically fetches our JSON
// feed and syncs the inventory. We do NOT push individual ads via REST API.
// Instead, we flag each vehicle with `olxEnabled: true` and our feed endpoint
// (/api/olx/feed) filters on that flag. The next OLX sync picks it up.

export async function publishVehicleToOlx(v: PublishVehicleToOlxInput): Promise<OlxPublishResult> {
  const db = getAdminDb();

  // Just flag the vehicle as enabled in the OLX feed
  await db.doc(`vehicles/${v.vehicleId}`).update({
    olxEnabled:       true,
    'publishedTo.olx': { enabledAt: new Date() },
  });

  return { success: true };
}

export async function unpublishVehicleFromOlx(vehicleId: string): Promise<void> {
  const db = getAdminDb();
  await db.doc(`vehicles/${vehicleId}`).update({
    olxEnabled:       false,
    'publishedTo.olx': null,
  });
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
