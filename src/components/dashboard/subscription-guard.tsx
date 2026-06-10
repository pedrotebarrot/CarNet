'use client';

import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import {
  Subscription,
  PLANS,
  toDate,
  daysRemaining,
  isSubscriptionActive,
  fmtPrice,
} from '@/lib/billing/plans';

interface Props {
  dealership: any | null | undefined;
  children:   React.ReactNode;
}

/**
 * Wraps dashboard content. If the dealership has no active subscription
 * (expired, cancelled, or no subscription record at all), shows a
 * blocking screen with a WhatsApp CTA to Pedro instead of the content.
 *
 * Trial banner: a smaller, non-blocking warning shows on top of the
 * normal content during the last 5 days of trial, so the dealer knows
 * they need to pay soon.
 */
export function SubscriptionGuard({ dealership, children }: Props) {
  // Still loading
  if (dealership === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#3980f4' }} />
      </div>
    );
  }

  const sub = dealership?.subscription as Subscription | undefined;
  const active = isSubscriptionActive(sub);

  // Block — no sub or expired
  if (!active) {
    return <BlockedScreen dealership={dealership} sub={sub} />;
  }

  // Active — show content, with trial warning banner if applicable
  const days = daysRemaining(sub);
  const isTrial = sub?.status === 'trial';
  const showTrialWarning = isTrial && days <= 7 && days >= 0;

  return (
    <>
      {showTrialWarning && <TrialBanner daysLeft={days} />}
      {children}
    </>
  );
}

// ── Trial countdown banner ───────────────────────────────────────────────

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const urgent = daysLeft <= 3;
  return (
    <div
      className="rounded-lg border p-4 flex items-start gap-3"
      style={{
        borderColor:     urgent ? '#fca5a5' : '#fde68a',
        backgroundColor: urgent ? '#fef2f2' : '#fffbeb',
      }}
    >
      <Clock className="h-5 w-5 shrink-0 mt-0.5" style={{ color: urgent ? '#dc2626' : '#d97706' }} />
      <div className="flex-1">
        <p className="font-headline font-semibold text-sm" style={{ color: urgent ? '#7f1d1d' : '#92400e' }}>
          {daysLeft === 0
            ? 'Seu período de teste termina hoje.'
            : daysLeft === 1
            ? 'Seu período de teste termina amanhã.'
            : `Seu período de teste termina em ${daysLeft} dias.`}
        </p>
        <p className="text-xs mt-1" style={{ color: urgent ? '#991b1b' : '#92400e' }}>
          Para continuar usando depois disso, chama no WhatsApp pra a gente ativar sua assinatura.
        </p>
      </div>
      <a
        href="https://wa.me/5543991234567?text=Quero%20continuar%20usando%20o%20AutosDigital%20depois%20do%20teste"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#25d366', color: '#fff' }}
      >
        Ativar assinatura
      </a>
    </div>
  );
}

// ── Full blocking screen for expired / no subscription ────────────────────

function BlockedScreen({ dealership, sub }: { dealership: any; sub: Subscription | undefined }) {
  const planLabel = sub?.planId ? PLANS[sub.planId]?.label ?? sub.planId : null;
  const lastPaymentDate = toDate(sub?.lastPayment);
  const paidUntilDate   = toDate(sub?.paidUntil);

  const wasTrialExpired = sub?.status === 'trial' || sub?.planId === 'trial';

  const title = wasTrialExpired
    ? 'Seu período de teste expirou.'
    : 'Sua assinatura está pausada.';

  const body = wasTrialExpired
    ? 'Você usou o AutosDigital nos últimos 14 dias. Pra continuar publicando carros e centralizando leads, é só ativar sua assinatura.'
    : 'O pagamento mais recente venceu. Assim que recebermos o próximo Pix, sua loja volta no ar imediatamente.';

  const waText = encodeURIComponent(
    `Olá! Sou ${dealership?.name ?? 'da revenda'} e quero ${
      wasTrialExpired ? 'ativar minha assinatura' : 'renovar minha assinatura'
    } no AutosDigital.`,
  );

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div
        className="max-w-lg w-full rounded-2xl border bg-white p-8 md:p-10 shadow-sm"
        style={{ borderColor: '#fde8e8' }}
      >
        <div
          className="inline-flex rounded-full p-3 mb-5"
          style={{ backgroundColor: '#fef2f2' }}
        >
          <AlertCircle className="h-6 w-6" style={{ color: '#dc2626' }} />
        </div>

        <h1 className="font-headline font-bold text-2xl md:text-3xl mb-3" style={{ color: '#0b1c30' }}>
          {title}
        </h1>

        <p className="text-base leading-relaxed mb-6" style={{ color: '#45464d' }}>
          {body}
        </p>

        {/* Subscription details */}
        {sub && (
          <div
            className="rounded-lg border p-4 mb-6 space-y-2"
            style={{ borderColor: '#e5eeff', backgroundColor: '#f8f9ff' }}
          >
            {planLabel && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#45464d' }}>Plano</span>
                <span className="font-semibold" style={{ color: '#0b1c30' }}>{planLabel}</span>
              </div>
            )}
            {paidUntilDate && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#45464d' }}>Acesso até</span>
                <span className="font-semibold" style={{ color: '#0b1c30' }}>
                  {new Intl.DateTimeFormat('pt-BR').format(paidUntilDate)}
                </span>
              </div>
            )}
            {lastPaymentDate && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#45464d' }}>Último pagamento</span>
                <span className="font-semibold" style={{ color: '#0b1c30' }}>
                  {new Intl.DateTimeFormat('pt-BR').format(lastPaymentDate)}
                </span>
              </div>
            )}
            {sub.lastPaymentValue && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#45464d' }}>Valor</span>
                <span className="font-semibold" style={{ color: '#0b1c30' }}>
                  {fmtPrice(sub.lastPaymentValue)}
                </span>
              </div>
            )}
          </div>
        )}

        <a
          href={`https://wa.me/5543991234567?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 mb-3"
          style={{ backgroundColor: '#25d366' }}
        >
          <CheckCircle2 className="h-4 w-4" />
          {wasTrialExpired ? 'Quero ativar minha assinatura' : 'Quero renovar minha assinatura'}
        </a>

        <p className="text-xs text-center" style={{ color: '#45464d' }}>
          Seu estoque, configurações e integrações continuam salvos. Tudo volta no ar assim que confirmarmos o pagamento.
        </p>
      </div>
    </div>
  );
}
