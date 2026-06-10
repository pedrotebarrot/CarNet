/**
 * Plans + subscription data shape — single source of truth.
 *
 * All UI (signup, admin, settings, expired-banner) and server logic
 * (access guard, mark-as-paid action) read from here. Changing a price
 * here changes it everywhere.
 *
 * Storage shape on Firestore: dealerships/{id}.subscription = Subscription
 */

export type PlanId =
  | 'trial'           // 14 days, no card
  | 'mensal'          // R$ 449/mês — Pix recurring
  | 'anual'           // R$ 360/mês = R$ 4,320 upfront — Pix one-shot
  | 'founding_mensal' // R$ 279/mês — Pix recurring, 12-month price-lock
  | 'founding_anual'; // R$ 197/mês = R$ 2,364 upfront — Pix one-shot

export type SubscriptionStatus =
  | 'trial'           // Active during 14-day trial
  | 'active'          // Paid + paidUntil > now
  | 'expired'         // paidUntil < now, blocked
  | 'cancelled';      // Dealer asked to cancel

export interface Plan {
  id:                PlanId;
  label:             string;          // For UI: "Plano Mensal", "Anual", etc.
  pricePerMonth:     number;          // Price the dealer pays per month (R$)
  billing:           'monthly' | 'yearly' | 'trial';
  totalUpfront?:     number;          // For yearly: R$ paid once. Undefined for monthly.
  durationDays:      number;          // How many days each payment cycle covers
  isFounding?:       boolean;         // True for the 15-spot promo plans
  foundingLockDays?: number;          // Days the founding price is locked (365)
  visibleOnSite:     boolean;         // Founding plans are hidden from public landing
}

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id:           'trial',
    label:        'Avaliação gratuita',
    pricePerMonth: 0,
    billing:      'trial',
    durationDays: 14,
    visibleOnSite: true,
  },
  mensal: {
    id:           'mensal',
    label:        'Mensal',
    pricePerMonth: 449,
    billing:      'monthly',
    durationDays: 30,
    visibleOnSite: true,
  },
  anual: {
    id:           'anual',
    label:        'Anual',
    pricePerMonth: 360,
    totalUpfront: 4320,
    billing:      'yearly',
    durationDays: 365,
    visibleOnSite: true,
  },
  founding_mensal: {
    id:           'founding_mensal',
    label:        'Founding Mensal',
    pricePerMonth: 279,
    billing:      'monthly',
    durationDays: 30,
    isFounding:   true,
    foundingLockDays: 365,
    visibleOnSite: false,
  },
  founding_anual: {
    id:           'founding_anual',
    label:        'Founding Anual',
    pricePerMonth: 197,
    totalUpfront: 2364,
    billing:      'yearly',
    durationDays: 365,
    isFounding:   true,
    foundingLockDays: 365,
    visibleOnSite: false,
  },
};

// ── Subscription document shape ──────────────────────────────────────────

export interface Subscription {
  planId:           PlanId;
  status:           SubscriptionStatus;
  startedAt:        Date | { _seconds: number };       // First time the plan started
  paidUntil:        Date | { _seconds: number };       // Active until this date (inclusive)
  lastPayment?:     Date | { _seconds: number };       // Date of the most recent Pix
  lastPaymentValue?: number;                            // R$ value of last Pix
  trialEndsAt?:     Date | { _seconds: number };       // For trial only
  foundingLockedUntil?: Date | { _seconds: number };   // Founding price guarantee end
  notes?:           string;                             // Admin-only notes
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Get the public plans displayed on the landing/signup. */
export const PUBLIC_PLANS = (Object.values(PLANS) as Plan[]).filter(p => p.visibleOnSite && p.id !== 'trial');

/** Total founding slots reserved for the first cohort. */
export const FOUNDING_TOTAL_SLOTS = 15;

/** Convert any Firestore-or-Date timestamp to a JS Date. */
export function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v?.toDate)          return v.toDate();
  if (v?._seconds != null) return new Date(v._seconds * 1000);
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  return null;
}

/**
 * Returns true if the dealer's subscription gives them access right now.
 * Used by the access guard and the admin badge.
 */
export function isSubscriptionActive(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status === 'cancelled' || sub.status === 'expired') return false;
  const paidUntil = toDate(sub.paidUntil);
  if (!paidUntil) return false;
  return paidUntil.getTime() > Date.now();
}

/** Format a price for UI: 279 → "R$ 279" */
export function fmtPrice(reais: number): string {
  return `R$ ${reais.toLocaleString('pt-BR')}`;
}

/** Format full upfront price for yearly plans. */
export function fmtUpfront(plan: Plan): string {
  if (plan.totalUpfront) return fmtPrice(plan.totalUpfront);
  return `${fmtPrice(plan.pricePerMonth)}/mês`;
}

/** Days remaining until paidUntil (negative if expired). */
export function daysRemaining(sub: Subscription | null | undefined): number {
  if (!sub) return 0;
  const paidUntil = toDate(sub.paidUntil);
  if (!paidUntil) return 0;
  const ms = paidUntil.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
