/**
 * One-shot migration: give every existing dealership a Founding Anual
 * subscription valid for 365 days. Used right after rolling out the
 * subscription system so existing users (Pedro's own ivaipora-veiculos)
 * aren't locked out by the access guard.
 *
 * GET /api/admin/migrate-subscriptions
 *
 * Idempotent: skips dealerships that already have a subscription.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const db   = getAdminDb();
  const snap = await db.collection('dealerships').get();

  const now = new Date();
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setDate(oneYearFromNow.getDate() + 365);

  const migrated: string[] = [];
  const skipped:  string[] = [];

  for (const dDoc of snap.docs) {
    const data = dDoc.data() as any;
    if (data?.subscription) {
      skipped.push(dDoc.id);
      continue;
    }
    await dDoc.ref.update({
      subscription: {
        planId:          'founding_anual',
        status:          'active',
        startedAt:       now,
        paidUntil:       oneYearFromNow,
        lastPayment:     now,
        lastPaymentValue: 2364,
        foundingLockedUntil: oneYearFromNow,
        notes:           'Conta legacy migrada automaticamente como Founding Anual.',
      },
    });
    migrated.push(dDoc.id);
  }

  return NextResponse.json({
    ok: true,
    migrated: { count: migrated.length, ids: migrated },
    skipped:  { count: skipped.length,  ids: skipped },
  });
}
