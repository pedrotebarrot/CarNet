/**
 * OLX webhook auto-registration
 *
 * Called from the OAuth callback right after the dealer authorizes.
 * Registers TWO webhooks on the dealer's OLX account:
 *
 *   1. AD_STATUS  — POST /autoservice/v1/notification
 *      Triggered whenever an ad changes status (accepted, pending, refused…)
 *
 *   2. LEADS      — POST /autoservice/v1/lead
 *      Triggered whenever a buyer contacts the dealer through OLX
 *
 * Each webhook URL contains a per-dealership secret. The URL itself is the
 * authentication mechanism (effectively a long random token). The secret is
 * stored on the dealership doc for reverse-lookup on inbound calls.
 */
import { randomBytes } from 'crypto';
import { getAdminDb } from '@/firebase/admin';

interface RegistrationResult {
  adStatus?: { id?: string; secret: string; error?: string };
  leads?:    { id?: string; secret: string; error?: string };
}

function genSecret(): string {
  return randomBytes(24).toString('base64url'); // 32-char URL-safe
}

export async function registerOlxWebhooks(
  dealershipId: string,
  accessToken:  string,
): Promise<RegistrationResult> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autosdigital.vercel.app').replace(/\/$/, '');

  const adStatusSecret = genSecret();
  const leadsSecret    = genSecret();

  const adStatusUrl = `${base}/api/olx/webhooks/ad-status/${adStatusSecret}`;
  const leadsUrl    = `${base}/api/olx/webhooks/lead/${leadsSecret}`;

  const result: RegistrationResult = {};

  // ── 1) AD_STATUS webhook ──
  try {
    const res = await fetch('https://apps.olx.com.br/autoservice/v1/notification', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method:     'POST',
        url:        adStatusUrl,
        media_type: 'application/json',
        token:      adStatusSecret,
        type:       'AD_STATUS',
      }),
    });

    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }

    if (!res.ok) {
      console.error(`[OLX webhook AD_STATUS] failed ${res.status}:`, text);
      result.adStatus = { secret: adStatusSecret, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    } else {
      result.adStatus = { id: parsed?.id ?? parsed?.notificationId, secret: adStatusSecret };
    }
  } catch (err: any) {
    console.error('[OLX webhook AD_STATUS] exception:', err);
    result.adStatus = { secret: adStatusSecret, error: String(err?.message ?? err) };
  }

  // ── 2) LEAD webhook ──
  try {
    const res = await fetch('https://apps.olx.com.br/autoservice/v1/lead', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url:   leadsUrl,
        token: leadsSecret,
      }),
    });

    const text = await res.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }

    if (!res.ok) {
      console.error(`[OLX webhook LEAD] failed ${res.status}:`, text);
      result.leads = { secret: leadsSecret, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    } else {
      result.leads = { id: parsed?.id ?? parsed?.leadId, secret: leadsSecret };
    }
  } catch (err: any) {
    console.error('[OLX webhook LEAD] exception:', err);
    result.leads = { secret: leadsSecret, error: String(err?.message ?? err) };
  }

  // Persist secrets even if OLX registration failed, so we can retry later
  const db = getAdminDb();
  await db.doc(`dealerships/${dealershipId}`).set({
    integrations: {
      olx: {
        webhooks: {
          adStatus: {
            ...(result.adStatus?.id    ? { id: result.adStatus.id }       : {}),
            ...(result.adStatus?.error ? { error: result.adStatus.error } : {}),
            secret:        adStatusSecret,
            url:           adStatusUrl,
            registeredAt:  new Date(),
          },
          leads: {
            ...(result.leads?.id    ? { id: result.leads.id }       : {}),
            ...(result.leads?.error ? { error: result.leads.error } : {}),
            secret:        leadsSecret,
            url:           leadsUrl,
            registeredAt:  new Date(),
          },
        },
      },
    },
  }, { merge: true });

  return result;
}
