/**
 * Mercado Livre notifications webhook (one URL for the whole app).
 *
 * Configured in the ML Developer Panel:
 *   https://autosdigital.vercel.app/api/mercadolivre/webhooks/notifications
 *
 * Subscribed topics: `questions`, `messages`, `items` (for status changes).
 *
 * Payload shape (POST):
 *   {
 *     "_id": "...",
 *     "resource": "/questions/123" | "/messages/123" | "/items/MLB...",
 *     "user_id": 12345,           // dealer's ML user_id
 *     "topic": "questions",
 *     "application_id": ...,
 *     "attempts": 1,
 *     "sent": "...",
 *     "received": "..."
 *   }
 *
 * For each event:
 *   1. Find dealership by integrations.mercadolivre.userId == user_id
 *   2. Fetch the resource using the dealer's access token
 *   3. Reverse-lookup the vehicle by ML item_id
 *   4. Persist to /leads (questions/messages) or update vehicle.mlStatus (items)
 *
 * ML expects 2xx ACK within ~5s, otherwise retries.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';
import { getValidToken } from '@/actions/mercadolivre';

export const dynamic = 'force-dynamic';

const ML_API = 'https://api.mercadolibre.com';

interface MLNotification {
  _id?:           string;
  resource?:      string;
  user_id?:       number;
  topic?:         string;
  application_id?: number;
  attempts?:      number;
  sent?:          string;
  received?:      string;
}

async function findDealershipByUserId(userId: number | string) {
  const db = getAdminDb();
  // userId can be number or string in Firestore — try both
  const tries = [Number(userId), String(userId)];
  for (const uid of tries) {
    const snap = await db.collection('dealerships')
      .where('integrations.mercadolivre.userId', '==', uid)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

async function findVehicleByMlItemId(dealershipId: string, itemId: string) {
  const db   = getAdminDb();
  const snap = await db.collection('vehicles')
    .where('dealershipId', '==', dealershipId)
    .where('marketplace.mercadolivre.id', '==', itemId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
}

async function handleQuestion(notif: MLNotification, dealership: any, dealershipId: string) {
  const db   = getAdminDb();
  const token = await getValidToken(dealershipId);
  if (!token) return { skipped: 'no token' };

  // Fetch question detail
  const res = await fetch(`${ML_API}${notif.resource}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { error: `fetch question ${res.status}` };
  const q: any = await res.json();

  // Reverse-lookup vehicle by item_id
  const itemId   = String(q.item_id ?? '');
  const vehicle  = itemId ? await findVehicleByMlItemId(dealershipId, itemId) : null;

  // Fetch buyer name (best-effort)
  let buyerName: string | null = null;
  if (q.from?.id) {
    try {
      const uRes = await fetch(`${ML_API}/users/${q.from.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (uRes.ok) {
        const u: any = await uRes.json();
        buyerName = u.nickname ?? u.first_name ?? null;
      }
    } catch { /* ignore */ }
  }

  // Upsert lead (idempotent by mlQuestionId)
  const qId  = String(q.id ?? notif.resource?.split('/').pop() ?? '');
  const ref  = db.collection('leads').doc(`ml-q-${qId}`);
  await ref.set({
    dealershipId,
    vehicleId:     vehicle?.id ?? null,
    source:        'mercadolivre',
    sourceKind:    'question',
    mlQuestionId:  qId,
    mlItemId:      itemId,
    mlBuyerId:     q.from?.id ? String(q.from.id) : null,
    name:          buyerName,
    email:         null,
    phone:         null,
    message:       q.text ?? null,
    status:        q.status === 'ANSWERED' ? 'contacted' : 'new',
    receivedAt:    new Date(q.date_created ?? Date.now()),
    rawPayload:    q,
  }, { merge: true });

  return { ok: true, leadId: `ml-q-${qId}` };
}

async function handleMessage(notif: MLNotification, dealership: any, dealershipId: string) {
  const db   = getAdminDb();
  const token = await getValidToken(dealershipId);
  if (!token) return { skipped: 'no token' };

  const res = await fetch(`${ML_API}${notif.resource}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { error: `fetch message ${res.status}` };
  const m: any = await res.json();

  const mId  = String(m.id ?? notif.resource?.split('/').pop() ?? '');
  const itemId = String(m.resource_id ?? m.item_id ?? '');
  const vehicle = itemId ? await findVehicleByMlItemId(dealershipId, itemId) : null;

  await db.collection('leads').doc(`ml-m-${mId}`).set({
    dealershipId,
    vehicleId:    vehicle?.id ?? null,
    source:       'mercadolivre',
    sourceKind:   'message',
    mlMessageId:  mId,
    mlItemId:     itemId || null,
    name:         m.from?.name ?? m.from?.nickname ?? null,
    email:        m.from?.email ?? null,
    phone:        null,
    message:      m.text?.plain ?? m.text ?? null,
    status:       'new',
    receivedAt:   new Date(m.message_date?.received ?? Date.now()),
    rawPayload:   m,
  }, { merge: true });

  return { ok: true };
}

/**
 * VIS Leads — vehicle/real-estate lead notifications.
 *
 * Different from the generic "questions" topic: VIS leads include the
 * buyer's full contact info (name, phone, email) upfront, since the
 * vertical works as a classifieds lead-gen platform.
 *
 * Resource path is typically /vis/leads/{id} or /leads/{id}.
 */
async function handleVisLead(notif: MLNotification, dealershipId: string) {
  const db    = getAdminDb();
  const token = await getValidToken(dealershipId);
  if (!token) return { skipped: 'no token' };

  const res = await fetch(`${ML_API}${notif.resource}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { error: `fetch vis lead ${res.status}` };
  const lead: any = await res.json();

  // VIS leads usually contain item_id, contact info, buyer message
  const itemId   = String(lead.item_id ?? lead.itemId ?? '');
  const vehicle  = itemId ? await findVehicleByMlItemId(dealershipId, itemId) : null;
  const leadIdMl = String(lead.id ?? notif.resource?.split('/').pop() ?? '');

  await db.collection('leads').doc(`ml-vis-${leadIdMl}`).set({
    dealershipId,
    vehicleId:    vehicle?.id ?? null,
    source:       'mercadolivre',
    sourceKind:   'vis_lead',
    mlLeadId:     leadIdMl,
    mlItemId:     itemId || null,
    name:         lead.contact?.name      ?? lead.name      ?? lead.buyer?.name      ?? null,
    email:        lead.contact?.email     ?? lead.email     ?? lead.buyer?.email     ?? null,
    phone:        lead.contact?.phone     ?? lead.phone     ?? lead.buyer?.phone     ?? null,
    message:      lead.message ?? lead.text ?? null,
    status:       'new',
    receivedAt:   new Date(lead.date_created ?? lead.created_at ?? Date.now()),
    rawPayload:   lead,
  }, { merge: true });

  return { ok: true, leadId: `ml-vis-${leadIdMl}` };
}

async function handleItem(notif: MLNotification, dealershipId: string) {
  // /items/MLB1234567 → vehicle status update
  const itemId = notif.resource?.split('/').pop() ?? '';
  if (!itemId) return { skipped: 'no itemId' };

  const token = await getValidToken(dealershipId);
  if (!token) return { skipped: 'no token' };

  const res = await fetch(`${ML_API}/items/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { error: `fetch item ${res.status}` };
  const item: any = await res.json();

  const vehicle = await findVehicleByMlItemId(dealershipId, itemId);
  if (!vehicle) return { skipped: 'vehicle not found' };

  await vehicle.ref.update({
    'marketplace.mercadolivre.status':     item.status,
    'marketplace.mercadolivre.permalink':  item.permalink,
    'marketplace.mercadolivre.lastSyncAt': new Date(),
  });

  return { ok: true };
}

export async function POST(request: NextRequest) {
  let notif: MLNotification;
  try { notif = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 }); }

  console.log('[ML notification]', JSON.stringify(notif));

  if (!notif.user_id) {
    return NextResponse.json({ ok: true, skipped: 'no user_id' }, { status: 200 });
  }

  const dDoc = await findDealershipByUserId(notif.user_id);
  if (!dDoc) {
    console.warn(`[ML notification] dealer not found for user_id=${notif.user_id}`);
    return NextResponse.json({ ok: true, skipped: 'dealer not found' }, { status: 200 });
  }

  const dealership   = dDoc.data();
  const dealershipId = dDoc.id;

  let result: any;
  try {
    const topic = (notif.topic ?? '').toLowerCase();
    // VIS Leads has multiple sub-topics — all start with "vis" or contain "lead"
    const isVisLead =
      topic.startsWith('vis') ||
      topic === 'leads' ||
      topic === 'whatsapp_call' ||
      topic.includes('visit_request') ||
      topic.includes('contact_request') ||
      topic.includes('reservation');

    if (isVisLead) {
      result = await handleVisLead(notif, dealershipId);
    } else if (topic === 'questions') {
      result = await handleQuestion(notif, dealership, dealershipId);
    } else if (topic === 'messages' || topic === 'messages_created' || topic === 'messages_read') {
      result = await handleMessage(notif, dealership, dealershipId);
    } else if (topic === 'items' || topic === 'items_prices' || topic === 'stock_locations') {
      result = await handleItem(notif, dealershipId);
    } else {
      result = { skipped: `topic ${notif.topic}` };
    }
  } catch (err: any) {
    console.error('[ML notification] handler error:', err);
    result = { error: String(err?.message ?? err) };
  }

  // Always 200 to prevent ML retries on our own bugs
  return NextResponse.json({ ok: true, ...result }, { status: 200 });
}

// ML may also send a GET to validate the URL
export async function GET() {
  return NextResponse.json({ ok: true, message: 'ML notifications webhook ready' });
}
