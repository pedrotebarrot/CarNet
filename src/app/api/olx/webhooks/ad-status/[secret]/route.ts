/**
 * OLX AD_STATUS webhook receiver
 *
 * URL pattern: /api/olx/webhooks/ad-status/{secret}
 *
 * The {secret} in the URL is the per-dealership token registered with OLX.
 * We look up the dealership by that secret and update the matching vehicle's
 * olxStatus field. Payload shape per OLX docs:
 *   { list_id, status, reasons?, imageErrors? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (!secret) return NextResponse.json({ ok: false, error: 'no secret' }, { status: 400 });

  let payload: any = null;
  try { payload = await request.json(); } catch { /* ignore body parse */ }

  const db = getAdminDb();

  // Find dealership by webhook secret
  const dSnap = await db
    .collection('dealerships')
    .where('integrations.olx.webhooks.adStatus.secret', '==', secret)
    .limit(1)
    .get();

  if (dSnap.empty) {
    console.warn('[OLX AD_STATUS] no dealership matches secret');
    return NextResponse.json({ ok: false, error: 'unknown secret' }, { status: 401 });
  }

  const dealership = dSnap.docs[0];
  const dealershipId = dealership.id;

  // Payload may be an array or single object — normalize
  const events = Array.isArray(payload) ? payload : [payload];

  for (const ev of events) {
    if (!ev) continue;
    const listId   = String(ev.list_id ?? ev.listId ?? ev.id ?? '');
    const status   = String(ev.status  ?? ev.state  ?? '');
    const reasons  = ev.reasons ?? ev.reason ?? null;
    const imgErrs  = ev.imageErrors ?? null;
    const olxAdId  = String(ev.ad_id  ?? ev.adId   ?? '');

    if (!listId && !olxAdId) continue;

    // Find vehicle by OLX listId/adId previously saved on publish
    // Our `id` field in the feed is the truncated firestoreId.
    // Try direct lookup first by listId === olxId(vehicleId).
    const vSnap = await db.collection('vehicles')
      .where('dealershipId', '==', dealershipId)
      .where('olxEnabled',  '==', true)
      .get();

    for (const vDoc of vSnap.docs) {
      const vid = vDoc.id;
      const matches =
        vid.startsWith(listId) ||           // truncated 19-char match
        listId.startsWith(vid) ||
        (vDoc.data() as any)?.publishedTo?.olx?.adId === olxAdId;
      if (!matches) continue;

      // Normalize reasons/imageErrors into the same `messages` array the
      // vehicle card renders (matching checkOlxImportStatus output shape).
      const messages: string[] = [
        ...(Array.isArray(reasons) ? reasons.map(String) : reasons ? [String(reasons)] : []),
        ...(Array.isArray(imgErrs) ? imgErrs.map((e: any) => typeof e === 'string' ? e : JSON.stringify(e)) : []),
      ];

      await vDoc.ref.update({
        olxStatus: {
          status,
          ...(messages.length ? { messages } : {}),
          ...(olxAdId ? { adId: olxAdId } : {}),
          checkedAt: new Date(),
          rawPayload: ev,
        },
      });
      break;
    }
  }

  // OLX expects 2xx ack
  return NextResponse.json({ ok: true }, { status: 200 });
}

// Some OLX webhooks send a verification GET — respond 200 so they don't disable us
export async function GET() {
  return NextResponse.json({ ok: true, message: 'ad-status webhook ready' });
}
