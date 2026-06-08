'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { collection, doc, query, where, orderBy, limit, updateDoc } from 'firebase/firestore';
import { Loader2, Mail, Phone, ExternalLink, MessageSquare, Car } from 'lucide-react';
import Link from 'next/link';

function fmtDate(d: any): string {
  if (!d) return '';
  const dt = d?.toDate?.() ?? new Date(d._seconds ? d._seconds * 1000 : d);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(dt);
}

function sourceLabel(s: string): { label: string; bg: string; color: string } {
  if (s === 'olx')          return { label: 'OLX',          bg: '#FF6B00', color: '#fff' };
  if (s === 'mercadolivre') return { label: 'Mercado Livre', bg: '#FFE600', color: '#333' };
  return { label: s || 'Outro', bg: '#e5eeff', color: '#0b1c30' };
}

export default function LeadsPage() {
  const { user }  = useUser();
  const firestore = useFirestore();
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted'>('all');

  const userDocRef = useMemo(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userData } = useDoc(userDocRef);

  const leadsQuery = useMemo(() => {
    if (!userData?.dealershipId) return null;
    return query(
      collection(firestore, 'leads'),
      where('dealershipId', '==', userData.dealershipId),
      orderBy('receivedAt', 'desc'),
      limit(100),
    );
  }, [userData?.dealershipId, firestore]);

  const { data: leads, isLoading } = useCollection(leadsQuery);

  const filtered = useMemo(() => {
    if (!leads) return [];
    if (filter === 'all') return leads;
    return leads.filter((l: any) => l.status === filter);
  }, [leads, filter]);

  const newCount = leads?.filter((l: any) => l.status === 'new').length ?? 0;

  const markContacted = async (leadId: string) => {
    await updateDoc(doc(firestore, 'leads', leadId), {
      status:       'contacted',
      contactedAt:  new Date(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#3980f4' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h3 className="font-headline font-semibold text-lg" style={{ color: '#0b1c30' }}>
          Leads recebidos
        </h3>
        <p className="text-sm mt-1" style={{ color: '#45464d' }}>
          Contatos de compradores interessados nos seus veículos, vindos da OLX, Mercado Livre e outros canais.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: '#e5eeff' }}>
        {(['all', 'new', 'contacted'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-4 py-2 text-sm font-medium transition-colors relative"
            style={{
              color: filter === t ? '#3980f4' : '#45464d',
              borderBottom: filter === t ? '2px solid #3980f4' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t === 'all' && `Todos (${leads?.length ?? 0})`}
            {t === 'new' && (
              <>
                Novos
                {newCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-full" style={{ backgroundColor: '#3980f4', color: '#fff' }}>
                    {newCount}
                  </span>
                )}
              </>
            )}
            {t === 'contacted' && 'Já contatados'}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-lg border bg-white p-12 text-center" style={{ borderColor: '#e5eeff' }}>
          <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: '#c7d2fe' }} />
          <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>
            {filter === 'new' ? 'Nenhum lead novo' : filter === 'contacted' ? 'Nenhum lead já contatado' : 'Ainda não recebemos leads'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#45464d' }}>
            Conecte sua conta OLX e Mercado Livre em Configurações para começar a receber contatos automaticamente.
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((lead: any) => {
          const src = sourceLabel(lead.source);
          return (
            <div key={lead.id} className="rounded-lg border bg-white p-4" style={{ borderColor: '#e5eeff' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: src.bg, color: src.color }}>
                      {src.label}
                    </span>
                    {lead.status === 'new' && (
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                        Novo
                      </span>
                    )}
                    <span className="text-xs" style={{ color: '#45464d' }}>
                      {fmtDate(lead.receivedAt)}
                    </span>
                  </div>
                  <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>
                    {lead.name ?? 'Comprador OLX'}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs" style={{ color: '#45464d' }}>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:underline">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`https://wa.me/${String(lead.phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: '#16a34a' }}>
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </a>
                    )}
                    {lead.vehicleId && (
                      <Link href={`/dashboard/vehicles/${lead.vehicleId}`} className="inline-flex items-center gap-1 hover:underline" style={{ color: '#3980f4' }}>
                        <Car className="h-3 w-3" /> Ver veículo
                      </Link>
                    )}
                  </div>
                  {lead.message && (
                    <p className="mt-2 text-sm rounded p-2" style={{ color: '#0b1c30', backgroundColor: '#f8f9ff' }}>
                      "{lead.message}"
                    </p>
                  )}
                </div>
                {lead.status === 'new' && (
                  <button
                    onClick={() => markContacted(lead.id)}
                    className="shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: '#3980f4', color: '#fff' }}
                  >
                    Marcar como contatado
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
