/**
 * Daily cron — renews OLX ads for every connected dealer.
 *
 * Flow:
 *   1. For each dealer with `integrations.olx.connected == true`:
 *      a. GET  /autoupload/v1/published         — list active OLX ads (paginated)
 *      b. PATCH /autoupload/v1/ads/renewals    — batches of ≤100 list_ids
 *   2. AD_NOT_EXPIRED responses are safe — just means the ad still has
 *      runway, will be renewed on a future run.
 *   3. 401 → token expired; we log it and surface to the dealer to reconnect.
 *
 * Schedule (vercel.json): every day at 06:00 UTC (~03:00 BRT).
 *
 * Security: Vercel cron sends `Authorization: Bearer <CRON_SECRET>` so we
 * gate the endpoint on that. Set CRON_SECRET in Vercel env vars.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // seconds — most plans allow up to 60s on hobby

const OLX_API     = 'https://apps.olx.com.br';
const BATCH_SIZE  = 100;

interface DealerSummary {
  dealershipId: string;
  slug?:        string;
  published?:   number;
  renewed?:     number;
  alreadyOk?:   number;
  failed?:      number;
  errors?:      string[];
  tokenError?:  string;
}

async function fetchPublishedListIds(token: string): Promise<string[]> {
  const ids: string[] = [];
  let nextToken: string | undefined = undefined;
  let pages = 0;

  do {
    const url = new URL(`${OLX_API}/autoupload/v1/published`);
    if (nextToken) url.searchParams.set('next_token', nextToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`GET published failed (${res.status}): ${t.slice(0, 200)}`);
    }
    const data: any = await res.json();

    // Doc isn't explicit on field names — handle the common shapes
    const arr: any[] = data?.ads ?? data?.published ?? data?.items ?? (Array.isArray(data) ? data : []);
    for (const a of arr) {
      const id = a?.list_id ?? a?.listId ?? a?.id;
      if (id) ids.push(String(id));
    }

    nextToken = data?.next_token ?? data?.nextToken ?? undefined;
    pages++;
  } while (nextToken && pages < 50); // hard safety cap

  return ids;
}

async function renewBatch(token: string, listIds: string[]): Promise<{ renewed: number; alreadyOk: number; failed: number; errors: string[] }> {
  const res = await fetch(`${OLX_API}/autoupload/v1/ads/renewals`, {
    method:  'PATCH',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ list_ids: listIds }),
  });

  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { /* keep as text */ }

  if (!res.ok) {
    return { renewed: 0, alreadyOk: 0, failed: listIds.length, errors: [`HTTP ${res.status}: ${text.slice(0, 200)}`] };
  }

  // OLX returns per-ad results: { results: [{ list_id, status, error? }] }
  const results: any[] = body?.results ?? body?.ads ?? [];
  let renewed = 0, alreadyOk = 0, failed = 0;
  const errors: string[] = [];

  for (const r of results) {
    const err = r?.error ?? r?.status_code ?? r?.statusCode;
    if (!err || r?.status === 'renewed' || r?.status === 'success') {
      renewed++;
    } else if (String(err).toUpperCase().includes('AD_NOT_EXPIRED')) {
      alreadyOk++;
    } else {
      failed++;
      errors.push(`${r?.list_id ?? '?'}: ${err}`);
    }
  }

  // Fallback: if OLX returns no per-ad detail, assume the whole batch succeeded
  if (results.length === 0) {
    renewed = listIds.length;
  }

  return { renewed, alreadyOk, failed, errors: errors.slice(0, 5) };
}

export async function GET(request: NextRequest) {
  // ── Auth ──
  const auth     = request.headers.get('authorization') ?? '';
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const db = getAdminDb();

  // ── Fetch all connected dealers ──
  const dSnap = await db
    .collection('dealerships')
    .where('integrations.olx.connected', '==', true)
    .get();

  const summaries: DealerSummary[] = [];

  for (const dDoc of dSnap.docs) {
    const dealership = dDoc.data() as any;
    const sum: DealerSummary = {
      dealershipId: dDoc.id,
      slug:         dealership.slug,
    };

    const token = dealership?.integrations?.olx?.accessToken as string | undefined;
    if (!token) {
      sum.tokenError = 'no access token';
      summaries.push(sum);
      continue;
    }

    try {
      // 1) Get published list_ids
      const listIds = await fetchPublishedListIds(token);
      sum.published = listIds.length;

      if (listIds.length === 0) {
        sum.renewed = 0;
        summaries.push(sum);
        continue;
      }

      // 2) Renew in batches of 100
      let renewed = 0, alreadyOk = 0, failed = 0;
      const errs: string[] = [];

      for (let i = 0; i < listIds.length; i += BATCH_SIZE) {
        const batch = listIds.slice(i, i + BATCH_SIZE);
        const r = await renewBatch(token, batch);
        renewed   += r.renewed;
        alreadyOk += r.alreadyOk;
        failed    += r.failed;
        errs.push(...r.errors);
      }

      sum.renewed   = renewed;
      sum.alreadyOk = alreadyOk;
      sum.failed    = failed;
      if (errs.length) sum.errors = errs;
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      if (msg.includes('401')) {
        sum.tokenError = 'expired or invalid — dealer must reconnect OLX';
        // Mark connection as needing re-auth so the UI can prompt the dealer
        await db.doc(`dealerships/${dDoc.id}`).set({
          integrations: {
            olx: {
              tokenExpired:        true,
              tokenExpiredAt:      new Date(),
              tokenExpiredMessage: msg.slice(0, 200),
            },
          },
        }, { merge: true });
      } else {
        sum.errors = [msg.slice(0, 200)];
      }
    }

    summaries.push(sum);
  }

  // ── Persist cron run summary for observability ──
  const runDoc = await db.collection('cronRuns').add({
    type:        'olx-renewals',
    ranAt:       new Date(),
    dealersTotal: summaries.length,
    summary:     summaries,
  });

  return NextResponse.json({
    ok:      true,
    runId:   runDoc.id,
    dealers: summaries.length,
    summary: summaries,
  }, { status: 200 });
}
