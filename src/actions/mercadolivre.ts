'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const ML_CATEGORY_CARS_BR = 'MLB1744'; // Carros e Caminhonetes — Brasil

// ── Token management ────────────────────────────────────────────────────────

async function getValidToken(dealershipId: string): Promise<string | null> {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  const snap = await getDoc(doc(db, 'dealerships', dealershipId));
  if (!snap.exists()) return null;

  const ml = snap.data()?.integrations?.mercadolivre;
  if (!ml?.connected || !ml?.accessToken) return null;

  const expiresAt: Date =
    ml.expiresAt?.toDate ? ml.expiresAt.toDate() : new Date(ml.expiresAt);

  // Refresh if expires in less than 10 minutes
  if (expiresAt.getTime() - Date.now() < 10 * 60 * 1000) {
    const appId  = process.env.ML_APP_ID;
    const secret = process.env.ML_SECRET_KEY;
    if (!appId || !secret) return null;

    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     appId,
        client_secret: secret,
        refresh_token: ml.refreshToken,
      }),
    });

    if (!res.ok) return null;
    const tokens = await res.json();
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    await updateDoc(doc(db, 'dealerships', dealershipId), {
      'integrations.mercadolivre.accessToken':  tokens.access_token,
      'integrations.mercadolivre.refreshToken': tokens.refresh_token,
      'integrations.mercadolivre.expiresAt':    newExpiry,
    });

    return tokens.access_token;
  }

  return ml.accessToken;
}

// ── Publish ─────────────────────────────────────────────────────────────────

export interface PublishVehicleInput {
  id:           string;
  make:         string;
  model:        string;
  year:         number;
  modelYear:    number;
  price:        number;   // centavos
  mileage:      number;
  fuel:         string;
  transmission: string;
  color:        string;
  doors:        number;
  plateEnding:  string;
  description?: string;
  images:       string[];
  dealershipId: string;
}

export async function publishVehicleToML(
  v: PublishVehicleInput
): Promise<{ success: boolean; mlId?: string; permalink?: string; error?: string }> {
  try {
    const token = await getValidToken(v.dealershipId);
    if (!token) return { success: false, error: 'ML não conectado' };

    const priceReais = Math.round(v.price / 100);

    const body = {
      title:              `${v.make} ${v.model} ${v.year}/${v.modelYear}`,
      category_id:        ML_CATEGORY_CARS_BR,
      price:              priceReais,
      currency_id:        'BRL',
      available_quantity: 1,
      buying_mode:        'classified',
      condition:          v.mileage === 0 ? 'new' : 'used',
      listing_type_id:    'gold_special',
      ...(v.description && { description: { plain_text: v.description } }),
      pictures: v.images.slice(0, 12).map(url => ({ source: url })),
      attributes: [
        { id: 'BRAND',        value_name: v.make },
        { id: 'MODEL',        value_name: v.model },
        { id: 'VEHICLE_YEAR', value_name: String(v.year) },
        { id: 'KILOMETERS',   value_struct: { number: v.mileage, unit: 'km' } },
        { id: 'FUEL_TYPE',    value_name: v.fuel },
        { id: 'TRANSMISSION', value_name: v.transmission },
        { id: 'COLOR',        value_name: v.color },
        { id: 'DOORS',        value_name: String(v.doors) },
      ],
    };

    const res = await fetch('https://api.mercadolibre.com/items', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('ML publish error:', result);
      return { success: false, error: result.message ?? 'Erro ao publicar' };
    }

    // Persist ML listing reference on the vehicle doc
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db  = getFirestore(app);
    await updateDoc(doc(db, 'vehicles', v.id), {
      'marketplace.mercadolivre': {
        id:          result.id,
        permalink:   result.permalink,
        status:      result.status,
        publishedAt: new Date(),
      },
    });

    return { success: true, mlId: result.id, permalink: result.permalink };
  } catch (err: any) {
    console.error('ML publish exception:', err);
    return { success: false, error: err.message };
  }
}

// ── Unpublish ────────────────────────────────────────────────────────────────

export async function unpublishVehicleFromML(
  vehicleId: string,
  dealershipId: string
): Promise<{ success: boolean }> {
  try {
    const token = await getValidToken(dealershipId);
    if (!token) return { success: false };

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db  = getFirestore(app);

    const snap = await getDoc(doc(db, 'vehicles', vehicleId));
    if (!snap.exists()) return { success: false };

    const mlId = snap.data()?.marketplace?.mercadolivre?.id;
    if (!mlId) return { success: true };

    await fetch(`https://api.mercadolibre.com/items/${mlId}`, {
      method: 'PUT',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'closed' }),
    });

    await updateDoc(doc(db, 'vehicles', vehicleId), {
      'marketplace.mercadolivre.status': 'closed',
    });

    return { success: true };
  } catch (err) {
    console.error('ML unpublish error:', err);
    return { success: false };
  }
}

// ── Disconnect ───────────────────────────────────────────────────────────────

export async function disconnectML(dealershipId: string): Promise<void> {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db  = getFirestore(app);
  await updateDoc(doc(db, 'dealerships', dealershipId), {
    'integrations.mercadolivre': {
      connected: false,
    },
  });
}
