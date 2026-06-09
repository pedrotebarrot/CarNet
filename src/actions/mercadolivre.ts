'use server';

import { getAdminDb } from '@/firebase/admin';

const ML_CATEGORY_CARS_BR = 'MLB1744';

// FUEL_TYPE is value_type: list → must use value_id
function mapFuelTypeId(fuel: string): string {
  const f = fuel.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (f.includes('flex') || (f.includes('alcool') && f.includes('gasolina'))) return '372591'; // Gasolina e álcool
  if (f.includes('diesel')) return '60406';    // Diesel
  if (f.includes('eletric') || f.includes('eletro')) return '403613'; // Elétrico
  if (f.includes('hibrido') || f.includes('hybrid')) return '61257';  // Híbrido
  if (f.includes('gas natural') || f.includes('gnv')) return '372593'; // Gasolina e gás natural
  if (f.includes('etanol') || f.includes('alcool')) return '2517339'; // Álcool
  return '64364'; // Gasolina (fallback)
}

// TRANSMISSION is value_type: list → must use value_id
function mapTransmissionId(t: string): string {
  const s = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (s.includes('cvt')) return '77915073';  // Automática CVT
  if (s.includes('semi') || s.includes('automatizado')) return '378323'; // Semiautomática
  if (s.includes('auto')) return '370876';   // Automática
  return '370877'; // Manual (fallback)
}

// COLOR is value_type: string — normalize common BR car color names to ML names
function normalizeColor(color: string): string {
  const c = color.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (c.includes('prat') || c.includes('silver') || c.includes('cinza prat')) return 'Prateado';
  if (c.includes('preto') || c.includes('black')) return 'Preto';
  if (c.includes('branco') || c.includes('white')) return 'Branco';
  if (c.includes('cinza') || c.includes('gray') || c.includes('grey')) return 'Cinza';
  if (c.includes('vermelho') || c.includes('red')) return 'Vermelho';
  if (c.includes('azul') && c.includes('escuro')) return 'Azul-escuro';
  if (c.includes('azul') && c.includes('celeste')) return 'Azul-celeste';
  if (c.includes('azul')) return 'Azul';
  if (c.includes('verde')) return 'Verde';
  if (c.includes('amarelo') || c.includes('yellow')) return 'Amarelo';
  if (c.includes('bege') || c.includes('beige')) return 'Bege';
  if (c.includes('marrom') || c.includes('brown')) return 'Marrom';
  if (c.includes('dourado') || c.includes('gold')) return 'Dourado';
  if (c.includes('laranja') || c.includes('orange')) return 'Laranja';
  if (c.includes('bordo') || c.includes('vinho')) return 'Bordô';
  return color; // keep as-is if no match
}

// ── Token management ────────────────────────────────────────────────────────

export async function getValidToken(dealershipId: string): Promise<string | null> {
  const db = getAdminDb();
  const snap = await db.doc(`dealerships/${dealershipId}`).get();
  if (!snap.exists) return null;

  const ml = snap.data()?.integrations?.mercadolivre;
  if (!ml?.connected || !ml?.accessToken) return null;

  const expiresAt: Date =
    ml.expiresAt?.toDate ? ml.expiresAt.toDate() : new Date(ml.expiresAt);

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

    await db.doc(`dealerships/${dealershipId}`).update({
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
  version?:     string;
  year:         number;
  modelYear:    number;
  price:        number;
  mileage:      number;
  fuel:         string;
  transmission: string;
  color:        string;
  doors:        number;
  plate?:       string;
  plateEnding:  string;
  description?: string;
  images:       string[];
  dealershipId: string;
}

export async function publishVehicleToML(
  v: PublishVehicleInput
): Promise<{ success: boolean; mlId?: string; permalink?: string; error?: string }> {
  try {
    const db = getAdminDb();
    const dealershipSnap = await db.doc(`dealerships/${v.dealershipId}`).get();
    const dealership = dealershipSnap.data() ?? {};

    const token = await getValidToken(v.dealershipId);
    if (!token) return { success: false, error: 'ML não conectado' };

    const city    = dealership.city    ?? '';
    const stateId = dealership.stateId ?? 'BR-SP';

    if (!city) return { success: false, error: 'Preencha a cidade da revenda em Configurações antes de publicar.' };

    // Parse phone "(43) 99999-9999" → { area_code: "43", phone: "999999999" }
    const rawPhone = (dealership.phone ?? '').replace(/\D/g, '');
    const areaCode = rawPhone.length >= 10 ? rawPhone.slice(0, 2) : '';
    const phoneNum = rawPhone.length >= 10 ? rawPhone.slice(2) : '';

    const priceReais = Math.round(v.price / 100);

    const trim = v.version?.trim() || v.model;

    const mileage = Math.max(0, v.mileage ?? 0);

    const attributes = [
      { id: 'BRAND',        value_name: v.make },
      { id: 'MODEL',        value_name: v.model },
      { id: 'VEHICLE_YEAR', value_name: String(v.year) },
      { id: 'TRIM',         value_name: trim },
      { id: 'VEHICLE_TYPE', value_id: '398351' },
      { id: 'FUEL_TYPE',    value_id: mapFuelTypeId(v.fuel) },
      { id: 'TRANSMISSION', value_id: mapTransmissionId(v.transmission) },
      { id: 'COLOR',        value_name: normalizeColor(v.color) },
      { id: 'DOORS',        value_name: String(v.doors) },
      ...(mileage > 0 ? [{ id: 'KILOMETERS', value_name: `${mileage} km` }] : []),
      ...(v.plate ? [{ id: 'LICENSE_PLATE', value_name: v.plate }] : []),
      ...(v.plateEnding ? [
        { id: 'LICENSE_PLATE_LAST_DIGIT', value_name: v.plateEnding },
        { id: 'LICENSE_PLATE_PARITY', value_id: Number(v.plateEnding) % 2 === 0 ? '6832186' : '6832187' },
      ] : []),
    ];

    const body: any = {
      title:              `${v.make} ${v.model} ${v.year}/${v.modelYear}`,
      category_id:        ML_CATEGORY_CARS_BR,
      price:              priceReais,
      currency_id:        'BRL',
      available_quantity: 1,
      buying_mode:        'classified',
      condition:          mileage === 0 ? 'new' : 'used',
      listing_type_id:    'free',
      location: {
        address_line: dealership.address ?? '',
        city:         { name: city },
        state:        { id: stateId },
        country:      { id: 'BR' },
      },
      ...(v.description && { description: { plain_text: v.description } }),
      ...(areaCode && phoneNum ? { seller_contact: { country_code: '55', area_code: areaCode, phone: phoneNum } } : {}),
      pictures:   v.images.slice(0, 12).map(url => ({ source: url })),
      attributes,
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
      console.error('ML publish error:', JSON.stringify(result));
      return { success: false, error: JSON.stringify(result) };
    }

    // Send description as separate call (required for classified listings)
    if (v.description) {
      await fetch(`https://api.mercadolibre.com/items/${result.id}/description`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plain_text: v.description }),
      });
    }

    await db.doc(`vehicles/${v.id}`).update({
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

    const db = getAdminDb();
    const snap = await db.doc(`vehicles/${vehicleId}`).get();
    if (!snap.exists) return { success: false };

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

    await db.doc(`vehicles/${vehicleId}`).update({
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
  const db = getAdminDb();
  await db.doc(`dealerships/${dealershipId}`).update({
    'integrations.mercadolivre': { connected: false },
  });
}
