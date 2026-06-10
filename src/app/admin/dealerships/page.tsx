'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import {
  Loader2, CheckCircle2, AlertCircle, Clock, MoreHorizontal, Sparkles, X,
} from 'lucide-react';
import {
  PLANS, type PlanId, type Subscription, toDate, daysRemaining,
  isSubscriptionActive, fmtPrice, FOUNDING_TOTAL_SLOTS,
} from '@/lib/billing/plans';
import {
  markSubscriptionPaid, extendTrial, cancelSubscription,
} from '@/actions/admin-subscription';
import { useToast } from '@/hooks/use-toast';

interface DealershipRow {
  id:           string;
  name?:        string;
  slug?:        string;
  ownerId?:     string;
  city?:        string;
  createdAt?:   any;
  subscription?: Subscription;
}

function fmtDate(d: any): string {
  const date = toDate(d);
  return date ? new Intl.DateTimeFormat('pt-BR').format(date) : '—';
}

function statusBadge(sub: Subscription | undefined) {
  if (!sub) return { label: 'Sem assinatura', bg: '#fef2f2', color: '#7f1d1d' };
  const active = isSubscriptionActive(sub);
  if (sub.status === 'cancelled')     return { label: 'Cancelado', bg: '#f3f4f6', color: '#374151' };
  if (!active)                         return { label: 'Expirado',  bg: '#fef2f2', color: '#7f1d1d' };
  if (sub.status === 'trial')         return { label: 'Trial',     bg: '#fef3c7', color: '#92400e' };
  return { label: 'Ativo', bg: '#d1fae5', color: '#065f46' };
}

export default function AdminDealershipsPage() {
  const { user }  = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const dealershipsQuery = useMemoFirebase(() =>
    query(collection(firestore, 'dealerships'), orderBy('createdAt', 'desc')),
    [firestore]
  );

  const { data: dealerships, isLoading } = useCollection<DealershipRow>(dealershipsQuery);

  // Pop-over for actions
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [busy, setBusy]            = useState<string | null>(null);

  // ── Stats ──
  const stats = useMemo(() => {
    if (!dealerships) return { total: 0, active: 0, trial: 0, expired: 0, foundingUsed: 0 };
    let active = 0, trial = 0, expired = 0, foundingUsed = 0;
    for (const d of dealerships) {
      const sub = d.subscription;
      if (!sub) { expired++; continue; }
      if (sub.status === 'cancelled') continue;
      if (isSubscriptionActive(sub)) {
        if (sub.status === 'trial') trial++; else active++;
      } else {
        expired++;
      }
      if (PLANS[sub.planId]?.isFounding) foundingUsed++;
    }
    return { total: dealerships.length, active, trial, expired, foundingUsed };
  }, [dealerships]);

  const run = async (rowId: string, fn: () => Promise<any>, successMsg: string) => {
    setBusy(rowId);
    try {
      await fn();
      toast({ title: successMsg });
      setActiveRow(null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const onMarkPaid = (d: DealershipRow, planId: PlanId, value: number) => {
    run(d.id, () => markSubscriptionPaid(d.id, planId, value, { callerEmail: user?.email }),
        `${d.name ?? 'Revenda'} — pagamento registrado!`);
  };

  const onExtendTrial = (d: DealershipRow, days: number) => {
    run(d.id, () => extendTrial(d.id, days, { callerEmail: user?.email }),
        `Trial estendido em ${days} dias.`);
  };

  const onCancel = (d: DealershipRow) => {
    if (!confirm(`Cancelar assinatura de ${d.name ?? 'esta revenda'}? Eles perdem acesso na próxima recarga.`)) return;
    run(d.id, () => cancelSubscription(d.id, { callerEmail: user?.email }),
        `${d.name ?? 'Revenda'} — cancelada.`);
  };

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#3980f4' }} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline font-bold text-2xl md:text-3xl" style={{ color: '#0b1c30' }}>
          Revendas
        </h1>
        <p className="text-sm mt-1" style={{ color: '#45464d' }}>
          Gerencie assinaturas, registre pagamentos via Pix e ative founding members.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',     value: stats.total,     color: '#0b1c30' },
          { label: 'Ativos',    value: stats.active,    color: '#006d2f' },
          { label: 'Em trial',  value: stats.trial,     color: '#d97706' },
          { label: 'Expirados', value: stats.expired,   color: '#dc2626' },
          { label: `Founding (${stats.foundingUsed}/${FOUNDING_TOTAL_SLOTS})`, value: `${FOUNDING_TOTAL_SLOTS - stats.foundingUsed} vagas`, color: '#3980f4' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-white p-4" style={{ borderColor: '#e5eeff' }}>
            <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#45464d' }}>{s.label}</p>
            <p className="font-headline font-bold text-2xl mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#e5eeff' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#f8f9ff' }}>
              <tr style={{ color: '#45464d' }}>
                <th className="text-left font-medium px-4 py-3">Revenda</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Plano</th>
                <th className="text-left font-medium px-4 py-3">Acesso até</th>
                <th className="text-left font-medium px-4 py-3">Último Pix</th>
                <th className="text-right font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dealerships?.map(d => {
                const sub = d.subscription;
                const badge = statusBadge(sub);
                const days = daysRemaining(sub);
                const planLabel = sub?.planId ? PLANS[sub.planId]?.label : '—';
                const showActions = activeRow === d.id;

                return (
                  <tr key={d.id} className="border-t" style={{ borderColor: '#f0f4ff' }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: '#0b1c30' }}>{d.name ?? '(sem nome)'}</p>
                      {d.slug && (
                        <p className="font-mono text-[10px] mt-0.5" style={{ color: '#45464d' }}>/{d.slug}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      {sub && isSubscriptionActive(sub) && days <= 7 && (
                        <p className="text-[10px] mt-0.5" style={{ color: days <= 3 ? '#dc2626' : '#d97706' }}>
                          ⏰ {days}d restantes
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#0b1c30' }}>
                      <div className="flex items-center gap-1.5">
                        {planLabel}
                        {sub && PLANS[sub.planId]?.isFounding && (
                          <Sparkles className="h-3 w-3" style={{ color: '#3980f4' }} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#0b1c30' }}>{fmtDate(sub?.paidUntil)}</td>
                    <td className="px-4 py-3">
                      <div style={{ color: '#0b1c30' }}>{fmtDate(sub?.lastPayment)}</div>
                      {sub?.lastPaymentValue && (
                        <div className="text-[10px]" style={{ color: '#45464d' }}>{fmtPrice(sub.lastPaymentValue)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() => setActiveRow(showActions ? null : d.id)}
                        disabled={busy === d.id}
                        className="inline-flex items-center justify-center rounded p-1.5 transition-colors hover:bg-gray-100"
                      >
                        {busy === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </button>

                      {showActions && (
                        <div
                          className="absolute right-4 top-full mt-1 z-10 w-72 rounded-lg border bg-white shadow-lg text-left"
                          style={{ borderColor: '#e5eeff' }}
                        >
                          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#f0f4ff' }}>
                            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#45464d' }}>Ações</p>
                            <button onClick={() => setActiveRow(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Mark as paid */}
                          <div className="p-2">
                            <p className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#006d2f' }}>
                              Pix recebido — ativar plano
                            </p>
                            {(['mensal', 'anual', 'founding_mensal', 'founding_anual'] as PlanId[]).map(pid => {
                              const p = PLANS[pid];
                              const valor = p.totalUpfront ?? p.pricePerMonth;
                              return (
                                <button
                                  key={pid}
                                  onClick={() => onMarkPaid(d, pid, valor)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f8f9ff] rounded"
                                  style={{ color: '#0b1c30' }}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {p.isFounding && <Sparkles className="h-3 w-3" style={{ color: '#3980f4' }} />}
                                    {p.label}
                                  </span>
                                  <span className="font-mono" style={{ color: '#006d2f' }}>{fmtPrice(valor)}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Extend trial */}
                          <div className="border-t p-2" style={{ borderColor: '#f0f4ff' }}>
                            <p className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#d97706' }}>
                              Estender trial
                            </p>
                            <div className="grid grid-cols-2 gap-1">
                              {[7, 14, 30].map(days => (
                                <button
                                  key={days}
                                  onClick={() => onExtendTrial(d, days)}
                                  className="px-2 py-1.5 text-xs rounded hover:bg-[#fffbeb]"
                                  style={{ color: '#92400e' }}
                                >
                                  +{days} dias
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cancel */}
                          {sub && sub.status !== 'cancelled' && (
                            <div className="border-t p-2" style={{ borderColor: '#f0f4ff' }}>
                              <button
                                onClick={() => onCancel(d)}
                                className="w-full px-3 py-2 text-xs text-left hover:bg-red-50 rounded"
                                style={{ color: '#dc2626' }}
                              >
                                Cancelar assinatura
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {dealerships?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center" style={{ color: '#45464d' }}>
                    Nenhuma revenda cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
