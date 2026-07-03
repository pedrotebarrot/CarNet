'use server';

import { getAdminDb } from '@/firebase/admin';

/**
 * OLX Autoupload REST integration.
 *
 * Endpoint: PUT https://apps.olx.com.br/autoupload/import
 * Auth:     access_token inside the JSON body (NOT a Bearer header).
 * Docs:     github.com/olxbr/ad_integration (official repo, now offline —
 *           schema preserved in forks, e.g. dasioneto/ad_integration).
 *
 * Two hard-won gotchas encoded here:
 *  1. The host is apps.olx.com.br — api.olx.com.br returns opaque 543s.
 *  2. OLX's WAF blocks requests without a browser-like User-Agent.
 *
 * statusCode -6 ("Without permission") means the dealer's OLX account has
 * not yet been enabled for autoupload by OLX support — that per-account
 * activation is what registering the account email with OLX unlocks.
 */

const OLX_IMPORT_URL = 'https://apps.olx.com.br/autoupload/import';
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// ─── Param mappers (categoria 2020 — Carros, vans e utilitários) ────────────

// fuel: 1=Gasolina 2=Álcool 3=Flex 4=GNV 5=Diesel. Hybrid/electric have no
// code in this schema — omit the param (it's optional) rather than lie.
function mapFuel(fuel: string): string | null {
  const f = (fuel ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (f.includes('flex'))                              return '3';
  if (f.includes('diesel'))                            return '5';
  if (f.includes('gas natural') || f.includes('gnv')) return '4';
  if (f.includes('etanol') || f.includes('alcool'))   return '2';
  if (f.includes('gasolina'))                          return '1';
  return null; // elétrico, híbrido, desconhecido → omit
}

// gearbox: 1=Manual 2=Automático 3=Semi-Automático
function mapGearbox(t: string): string | null {
  const s = (t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (s.includes('semi') || s.includes('automatizado')) return '3';
  if (s.includes('auto') || s.includes('cvt'))          return '2';
  if (s.includes('manual'))                              return '1';
  return null;
}

// carcolor: 1=Preto 2=Branco 3=Prata 4=Vermelho 5=Cinza 6=Azul 7=Amarelo
//           8=Verde 9=Laranja 10=Outra
function mapCarColor(color: string): string {
  const c = (color ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (c.includes('pret'))    return '1';
  if (c.includes('branc'))   return '2';
  if (c.includes('prat'))    return '3';
  if (c.includes('vermelh')) return '4';
  if (c.includes('cinz'))    return '5';
  if (c.includes('azul'))    return '6';
  if (c.includes('amarel'))  return '7';
  if (c.includes('verde'))   return '8';
  if (c.includes('laranj'))  return '9';
  return '10';
}

// doors: 1 = "2 portas", 2 = "4 portas" (option ids, not the count!)
function mapDoors(doors?: number): string | null {
  if (!doors) return null;
  if (doors <= 2) return '1';
  if (doors >= 4) return '2';
  return null; // 3 portas has no option — omit
}

// end_tag: plate ending digit d → option id d+1 (0→1 … 9→10)
function mapEndTag(plateEnding?: string): string | null {
  const d = Number((plateEnding ?? '').trim());
  if (Number.isInteger(d) && d >= 0 && d <= 9) return String(d + 1);
  return null;
}

// OLX ad id: max 19 chars, [A-Za-z0-9_{}-]
function olxAdId(firestoreId: string): string {
  return firestoreId.replace(/[^A-Za-z0-9_{}-]/g, '').slice(0, 19);
}

// ─── Token ───────────────────────────────────────────────────────────────────

/**
 * Returns the dealer's stored OLX token. OLX does not issue refresh tokens
 * and re-issues the *same* access_token on re-auth, so we return the stored
 * token optimistically even past its nominal expiry — the API response is
 * the source of truth on validity.
 */
async function getOlxToken(dealershipId: string): Promise<string | null> {
  const db   = getAdminDb();
  const snap = await db.doc(`dealerships/${dealershipId}`).get();
  if (!snap.exists) return null;
  const olx = (snap.data() as any)?.integrations?.olx;
  if (!olx?.connected || !olx?.accessToken) return null;
  return olx.accessToken as string;
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

// ─── Import call helper ──────────────────────────────────────────────────────

async function olxImport(token: string, adList: object[]): Promise<any> {
  const res = await fetch(OLX_IMPORT_URL, {
    method:  'PUT',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':   BROWSER_UA,
    },
    body: JSON.stringify({ access_token: token, ad_list: adList }),
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { statusCode: -999, statusMessage: `HTTP ${res.status}: ${text.slice(0, 200)}` }; }
}

function friendlyImportError(result: any): string {
  const code = result?.statusCode;
  switch (code) {
    case -2: return 'OLX bloqueou temporariamente por excesso de requisições. Tente em alguns minutos.';
    case -4: {
      const cats = (result?.errors ?? [])
        .flatMap((e: any) => (e?.messages ?? []).map((m: any) => m?.category))
        .filter(Boolean);
      const map: Record<string, string> = {
        NO_IMAGE:            'o anúncio precisa de pelo menos 1 foto',
        NO_REGION:           'CEP inválido — confira o CEP da loja em Configurações',
        NOT_ENOUGH_AD_SLOTS: 'limite de anúncios do plano OLX atingido',
        UNDEFINED_AD_ID:     'erro interno (anúncio sem ID)',
      };
      const details = cats.map((c: string) => map[c] ?? c).join('; ');
      return `OLX recusou o anúncio: ${details || result?.statusMessage}`;
    }
    case -6: return 'Conta OLX ainda não habilitada para importação. Aguardando liberação pela equipe da OLX — normalmente 1-2 dias úteis após o registro do e-mail da conta.';
    case -7:
    case -8: return `Limite de anúncios do plano OLX: ${result?.statusMessage}`;
    default: return `OLX: ${result?.statusMessage ?? 'erro desconhecido'} (código ${code})`;
  }
}

// ─── Publish (insert/edit) ───────────────────────────────────────────────────

export async function publishVehicleToOlx(v: PublishVehicleToOlxInput): Promise<OlxPublishResult> {
  const token = await getOlxToken(v.dealershipId);
  if (!token) return { success: false, error: 'OLX não conectado. Conecte sua conta em Configurações.' };

  const db     = getAdminDb();
  const dSnap  = await db.doc(`dealerships/${v.dealershipId}`).get();
  const dealer = (dSnap.data() ?? {}) as any;

  const zipcode = String(dealer.zipcode ?? '').replace(/\D/g, '');
  if (!zipcode) {
    return { success: false, error: 'Preencha o CEP da loja em Configurações antes de publicar na OLX.' };
  }

  const phoneDigits = String(dealer.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    return { success: false, error: 'Telefone da loja inválido — confira em Configurações.' };
  }

  const images = (v.images ?? []).slice(0, 20);
  if (images.length === 0) {
    return { success: false, error: 'O anúncio precisa de pelo menos 1 foto.' };
  }

  const priceReais = Math.max(0, Math.round((v.price ?? 0) / 100));
  const mileage    = Math.max(0, v.mileage ?? 0);

  const subject = `${v.make} ${v.model} ${v.year}${v.modelYear && v.modelYear !== v.year ? `/${v.modelYear}` : ''}`.slice(0, 90);
  const body    = (
    v.description ||
    `${subject} — ${mileage.toLocaleString('pt-BR')} km, ${v.fuel}, ${v.transmission}, ${v.color}.`
  ).slice(0, 6000);

  const fuel    = mapFuel(v.fuel);
  const gearbox = mapGearbox(v.transmission);
  const doors   = mapDoors(v.doors);
  const endTag  = mapEndTag(v.plateEnding);

  const adId = olxAdId(v.vehicleId);

  const ad: Record<string, any> = {
    id:        adId,
    operation: 'insert',
    category:  2020,
    subject,
    body,
    phone:     Number(phoneDigits),
    type:      's',
    ...(priceReais > 0 ? { price: priceReais } : {}),
    zipcode,
    params: {
      regdate: String(v.year),
      mileage,
      carcolor: mapCarColor(v.color),
      ...(fuel    ? { fuel }     : {}),
      ...(gearbox ? { gearbox }  : {}),
      ...(doors   ? { doors }    : {}),
      ...(endTag  ? { end_tag: endTag } : {}),
    },
    images,
  };

  const result = await olxImport(token, [ad]);

  if (result?.statusCode !== 0) {
    console.error('[OLX import] failed:', JSON.stringify(result));
    return { success: false, error: friendlyImportError(result) };
  }

  await db.doc(`vehicles/${v.vehicleId}`).update({
    olxEnabled: true, // keep the pull-feed consistent as a fallback channel
    'publishedTo.olx': {
      adId,
      importToken: result.token ?? null,
      publishedAt: new Date(),
    },
  });

  return { success: true, adId };
}

// ─── Unpublish (delete) ──────────────────────────────────────────────────────

export async function unpublishVehicleFromOlx(
  vehicleId:    string,
  dealershipId: string,
): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDb();

  const token = await getOlxToken(dealershipId);
  if (token) {
    const adId   = olxAdId(vehicleId);
    const result = await olxImport(token, [{ id: adId, operation: 'delete' }]);
    // -6 etc. here is non-fatal for the local state — the dealer may have
    // deleted the ad on OLX manually; we still clear our flags.
    if (result?.statusCode !== 0) {
      console.warn('[OLX delete] non-zero status:', JSON.stringify(result));
    }
  }

  await db.doc(`vehicles/${vehicleId}`).update({
    olxEnabled:       false,
    'publishedTo.olx': null,
  });

  return { success: true };
}

// ─── Import status check ─────────────────────────────────────────────────────

export async function checkOlxImportStatus(
  dealershipId: string,
  importToken:  string,
): Promise<{ success: boolean; status?: any; error?: string }> {
  const token = await getOlxToken(dealershipId);
  if (!token) return { success: false, error: 'OLX não conectado.' };

  const res = await fetch(`https://apps.olx.com.br/autoupload/import/${importToken}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': BROWSER_UA },
    body: JSON.stringify({ access_token: token }),
  });
  if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
  return { success: true, status: await res.json() };
}

// ─── Disconnect ──────────────────────────────────────────────────────────────

export async function disconnectOLX(dealershipId: string): Promise<void> {
  const db = getAdminDb();
  await db.doc(`dealerships/${dealershipId}`).update({
    'integrations.olx': {
      connected:    false,
      accessToken:  null,
      refreshToken: null,
    },
  });
}
