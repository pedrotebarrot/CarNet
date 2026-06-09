/**
 * Admin-only: list leads for a dealership (bypasses Firestore rules via Admin SDK).
 * GET /api/admin/list-leads?dealershipId=...
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealershipId = searchParams.get('dealershipId');
  if (!dealershipId) return NextResponse.json({ error: 'dealershipId required' }, { status: 400 });

  const db   = getAdminDb();
  const snap = await db.collection('leads')
    .where('dealershipId', '==', dealershipId)
    .get();

  const leads = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  return NextResponse.json({ total: leads.length, leads });
}
