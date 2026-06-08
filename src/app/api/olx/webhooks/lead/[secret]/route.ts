/**
 * OLX LEAD webhook receiver
 *
 * URL pattern: /api/olx/webhooks/lead/{secret}
 *
 * Buyer contacts (lead) from OLX arrive here. We persist them under
 * /dealerships/{id}/leads/{leadId} so they show up in the dealer's CRM page.
 *
 * Payload per OLX docs may include:
 *   { name, email, phone, message, listId, source, buyerHistory? }
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
  try { payload = await request.json(); } catch { /* ignore */ }

  const db = getAdminDb();

  // Find dealership by webhook secret
  const dSnap = await db
    .collection('dealerships')
    .where('integrations.olx.webhooks.leads.secret', '==', secret)
    .limit(1)
    .get();

  if (dSnap.empty) {
    console.warn('[OLX LEAD] no dealership matches secret');
    return NextResponse.json({ ok: false, error: 'unknown secret' }, { status: 401 });
  }

  const dealership = dSnap.docs[0];
  const dealershipId = dealership.id;

  // Payload may be an array or single object
  const events = Array.isArray(payload) ? payload : [payload];

  for (const ev of events) {
    if (!ev) continue;

    const listId  = String(ev.listId ?? ev.list_id ?? ev.adId ?? '');
    const olxLeadId = String(ev.id ?? ev.leadId ?? '');

    // Try to find the vehicle that originated this lead
    let vehicleId: string | null = null;
    if (listId) {
      const vSnap = await db.collection('vehicles')
        .where('dealershipId', '==', dealershipId)
        .where('olxEnabled', '==', true)
        .get();
      for (const vDoc of vSnap.docs) {
        if (vDoc.id.startsWith(listId) || listId.startsWith(vDoc.id)) {
          vehicleId = vDoc.id;
          break;
        }
      }
    }

    await db.collection('leads').add({
      dealershipId,
      vehicleId,
      source:    'olx',
      olxLeadId: olxLeadId || null,
      olxListId: listId || null,
      name:      ev.name  ?? ev.buyerName  ?? null,
      email:     ev.email ?? ev.buyerEmail ?? null,
      phone:     ev.phone ?? ev.buyerPhone ?? null,
      message:   ev.message ?? ev.text ?? null,
      buyerHistory: ev.buyerHistory ?? null,
      status:    'new',
      receivedAt: new Date(),
      rawPayload: ev,
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'lead webhook ready' });
}
