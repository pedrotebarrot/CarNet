'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

/**
 * Floating "Falar com suporte" button — fixed bottom-right of the dashboard.
 *
 * Click expands into a small card with a personalized message preview
 * + WhatsApp deep link. Closes itself if the user clicks outside.
 *
 * Reuses Pedro's personal WhatsApp until we hire support staff.
 */

const SUPPORT_WA = '5511967329111';

interface Props {
  dealershipName?: string;
}

export function SupportWhatsAppButton({ dealershipName }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-support-widget]')) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const greeting = dealershipName
    ? `Olá! Sou da ${dealershipName} e estou usando o AutosDigital — preciso de ajuda com `
    : 'Olá! Estou usando o AutosDigital — preciso de ajuda com ';

  const waUrl = `https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(greeting)}`;

  return (
    <div data-support-widget className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="rounded-2xl border bg-white shadow-2xl p-4 w-80 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ borderColor: '#e5eeff' }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-white font-bold text-sm"
                style={{ backgroundColor: '#25d366' }}
              >
                P
              </div>
              <div>
                <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>Pedro · Suporte</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#16a34a' }}>● Online geralmente em &lt; 5 min</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-gray-100"
              style={{ color: '#45464d' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm mb-3" style={{ color: '#45464d' }}>
            Travou em algo? Sem stress — chama no WhatsApp que a gente te ajuda na hora.
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25d366' }}
          >
            <MessageCircle className="h-4 w-4" />
            Abrir conversa no WhatsApp
          </a>

          <p className="mt-2 text-center text-[10px]" style={{ color: '#45464d' }}>
            Atendimento humano · seg-sex 9h-19h
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Falar com suporte"
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{
          backgroundColor: '#25d366',
          boxShadow:       '0 8px 24px rgba(37,211,102,0.4)',
        }}
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
}
