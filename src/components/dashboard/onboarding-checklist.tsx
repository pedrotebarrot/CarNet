'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Step {
  id: string;
  label: string;
  description: string;
  done: boolean;
  cta?: { label: string; href?: string; onClick?: () => void };
}

interface OnboardingChecklistProps {
  hasLogo:    boolean;
  hasVehicle: boolean;
  hasColors:  boolean;
  onAddVehicle: () => void;
}

const SESSION_KEY = 'onboarding_collapsed';

export function OnboardingChecklist({
  hasLogo,
  hasVehicle,
  hasColors,
  onAddVehicle,
}: OnboardingChecklistProps) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [dismissed,  setDismissed]  = useState(false);
  const [mounted,    setMounted]    = useState(false);

  // Re-read session on every mount → reappears each new session until all done
  useEffect(() => {
    setMounted(true);
    setCollapsed(sessionStorage.getItem(SESSION_KEY) === 'true');
  }, []);

  const steps: Step[] = [
    {
      id: 'account',
      label: 'Conta criada',
      description: 'Bem-vindo! Sua loja já está no ar.',
      done: true,
    },
    {
      id: 'logo',
      label: 'Adicionar logo da loja',
      description: 'Aparece no topo do site e no template do Instagram.',
      done: hasLogo,
      cta: { label: 'Ir para Configurações', href: '/dashboard/settings' },
    },
    {
      id: 'vehicle',
      label: 'Cadastrar primeiro veículo',
      description: 'Com a placa, a IA preenche tudo automaticamente.',
      done: hasVehicle,
      cta: { label: 'Adicionar veículo', onClick: onAddVehicle },
    },
    {
      id: 'colors',
      label: 'Personalizar cores da marca',
      description: 'Deixe o site com a identidade visual da sua loja.',
      done: hasColors,
      cta: { label: 'Personalizar', href: '/dashboard/settings' },
    },
  ];

  const completed = steps.filter(s => s.done).length;
  const total     = steps.length;
  const allDone   = completed === total;
  const pct       = Math.round((completed / total) * 100);

  const handleCollapse = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setCollapsed(true);
  };

  const handleDismiss = () => setDismissed(true);

  // Don't render until mounted (avoids SSR/sessionStorage mismatch)
  if (!mounted || dismissed) return null;

  // All done → show brief celebration then disappear
  if (allDone) {
    return (
      <div
        className="flex items-center justify-between rounded-lg border px-5 py-3"
        style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 shrink-0" style={{ color: '#16a34a' }} />
          <p className="text-sm font-semibold" style={{ color: '#15803d' }}>
            🎉 Configuração completa! Sua loja está 100% pronta.
          </p>
        </div>
        <button onClick={handleDismiss} className="ml-4 shrink-0" style={{ color: '#16a34a' }}>
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Collapsed state — small banner that invites to reopen
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full flex items-center justify-between rounded-lg border px-5 py-3 text-left transition-colors hover:bg-white"
        style={{ backgroundColor: '#f0f7ff', borderColor: '#c7deff' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {steps.map(s => (
              <div
                key={s.id}
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: s.done ? '#16a34a' : '#cbd5e1' }}
              />
            ))}
          </div>
          <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>
            Configure sua loja — <span style={{ color: '#3980f4' }}>{completed}/{total} concluídos</span>
          </p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0" style={{ color: '#45464d' }} />
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: '#c7deff' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: '#f0f7ff', borderBottom: '1px solid #c7deff' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>
            Configure sua loja — {completed}/{total} concluídos
          </p>
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ backgroundColor: '#dbeafe' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: '#3980f4' }}
              />
            </div>
            <span className="font-mono text-[11px]" style={{ color: '#3980f4' }}>{pct}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCollapse}
            className="p-1.5 rounded hover:bg-white/60 transition-colors"
            title="Minimizar"
          >
            <ChevronUp className="h-4 w-4" style={{ color: '#45464d' }} />
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y" style={{ borderColor: '#f0f7ff' }}>
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-4 px-5 py-3.5"
            style={{ opacity: step.done ? 0.65 : 1 }}
          >
            {step.done
              ? <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#16a34a' }} />
              : <Circle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#cbd5e1' }} />
            }
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium"
                style={{
                  color: '#0b1c30',
                  textDecoration: step.done ? 'line-through' : 'none',
                }}
              >
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs mt-0.5" style={{ color: '#45464d' }}>
                  {step.description}
                </p>
              )}
            </div>
            {!step.done && step.cta && (
              step.cta.href ? (
                <Link
                  href={step.cta.href}
                  className="shrink-0 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#eff4ff]"
                  style={{ borderColor: '#c7deff', color: '#3980f4' }}
                >
                  {step.cta.label}
                </Link>
              ) : (
                <button
                  onClick={step.cta.onClick}
                  className="shrink-0 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#eff4ff]"
                  style={{ borderColor: '#c7deff', color: '#3980f4' }}
                >
                  {step.cta.label}
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
