'use server';

import { getAdminDb } from '@/firebase/admin';
import { PLANS, type PlanId, type Subscription } from '@/lib/billing/plans';
import { revalidatePath } from 'next/cache';

// Pedro's email — only this account can call admin actions.
// When we add a real role system, this moves to user.roles.includes('admin').
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'pedrotebarrot08@gmail.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

async function assertAdmin(callerEmail?: string | null) {
  const email = (callerEmail ?? '').toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new Error('Acesso negado: apenas administradores podem executar esta ação.');
  }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

interface AdminCallerOpts {
  /** Caller email — pass from the page (server component) using auth state. */
  callerEmail: string | null | undefined;
}

// ── Mark Pix payment received → activate / extend subscription ────────────

export async function markSubscriptionPaid(
  dealershipId: string,
  planId:       PlanId,
  paymentValue: number,
  opts:         AdminCallerOpts,
): Promise<{ success: true; paidUntil: Date }> {
  await assertAdmin(opts.callerEmail);

  const plan = PLANS[planId];
  if (!plan) throw new Error(`Plano desconhecido: ${planId}`);
  if (plan.id === 'trial') throw new Error('Não dá pra marcar trial como pago — use extendTrial.');

  const db   = getAdminDb();
  const ref  = db.doc(`dealerships/${dealershipId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Revenda não encontrada.');

  const data       = snap.data() as any;
  const currentSub = data?.subscription as Subscription | undefined;
  const now        = new Date();

  // Extend from the later of (paidUntil, now) so paying early doesn't lose days.
  const currentPaidUntil = currentSub?.paidUntil ? new Date((currentSub.paidUntil as any)._seconds ? (currentSub.paidUntil as any)._seconds * 1000 : currentSub.paidUntil as any) : null;
  const startFrom        = currentPaidUntil && currentPaidUntil > now ? currentPaidUntil : now;
  const newPaidUntil     = addDays(startFrom, plan.durationDays);

  const startedAt = currentSub?.startedAt ?? now;

  const sub: Subscription = {
    planId,
    status:          'active',
    startedAt:       startedAt as any,
    paidUntil:       newPaidUntil,
    lastPayment:     now,
    lastPaymentValue: paymentValue,
    ...(plan.isFounding && plan.foundingLockDays
      ? { foundingLockedUntil: addDays(now, plan.foundingLockDays) }
      : {}),
    ...(currentSub?.notes ? { notes: currentSub.notes } : {}),
  };

  await ref.update({ subscription: sub });
  revalidatePath('/admin/dealerships');

  return { success: true, paidUntil: newPaidUntil };
}

// ── Extend the trial period (admin override for stuck signups) ────────────

export async function extendTrial(
  dealershipId: string,
  extraDays:    number,
  opts:         AdminCallerOpts,
): Promise<{ success: true; trialEndsAt: Date }> {
  await assertAdmin(opts.callerEmail);

  const db   = getAdminDb();
  const ref  = db.doc(`dealerships/${dealershipId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Revenda não encontrada.');

  const data       = snap.data() as any;
  const currentSub = data?.subscription as Subscription | undefined;
  const now        = new Date();

  const currentPaidUntil = currentSub?.paidUntil ? new Date((currentSub.paidUntil as any)._seconds ? (currentSub.paidUntil as any)._seconds * 1000 : currentSub.paidUntil as any) : null;
  const startFrom        = currentPaidUntil && currentPaidUntil > now ? currentPaidUntil : now;
  const newEnd           = addDays(startFrom, extraDays);

  const sub: Subscription = {
    planId:     'trial',
    status:     'trial',
    startedAt:  currentSub?.startedAt ?? now,
    paidUntil:  newEnd,
    trialEndsAt: newEnd,
    ...(currentSub?.notes ? { notes: currentSub.notes } : {}),
  };

  await ref.update({ subscription: sub });
  revalidatePath('/admin/dealerships');

  return { success: true, trialEndsAt: newEnd };
}

// ── Cancel subscription (dealer asked to leave) ───────────────────────────

export async function cancelSubscription(
  dealershipId: string,
  opts:         AdminCallerOpts,
): Promise<{ success: true }> {
  await assertAdmin(opts.callerEmail);

  const db  = getAdminDb();
  const ref = db.doc(`dealerships/${dealershipId}`);

  await ref.update({
    'subscription.status': 'cancelled',
  });

  revalidatePath('/admin/dealerships');
  return { success: true };
}

// ── Add an admin note to a dealership ──────────────────────────────────────

export async function setSubscriptionNote(
  dealershipId: string,
  note:         string,
  opts:         AdminCallerOpts,
): Promise<{ success: true }> {
  await assertAdmin(opts.callerEmail);

  const db  = getAdminDb();
  const ref = db.doc(`dealerships/${dealershipId}`);

  await ref.update({
    'subscription.notes': note.slice(0, 500),
  });

  revalidatePath('/admin/dealerships');
  return { success: true };
}
