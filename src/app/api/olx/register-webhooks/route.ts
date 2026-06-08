/**
 * Manual webhook (re-)registration for an existing OLX connection.
 *
 * GET /api/olx/register-webhooks?dealershipId=...
 *
 * Used to retro-fit webhooks on dealerships that connected OLX before
 * the auto-registration callback was deployed, or to recover from a
 * failed initial registration. Returns the OLX response verbatim.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';
import { registerOlxWebhooks } from '@/lib/olx/register-webhooks';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealershipId = searchParams.get('dealershipId');
  if (!dealershipId) {
    return NextResponse.json({ error: 'dealershipId required' }, { status: 400 });
  }

  const db   = getAdminDb();
  const snap = await db.doc(`dealerships/${dealershipId}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'dealership not found' }, { status: 404 });
  }

  const data        = snap.data() as any;
  const accessToken = data?.integrations?.olx?.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: 'OLX not connected — no access token' }, { status: 400 });
  }

  const result = await registerOlxWebhooks(dealershipId, accessToken);
  return NextResponse.json({ ok: true, result }, { status: 200 });
}
