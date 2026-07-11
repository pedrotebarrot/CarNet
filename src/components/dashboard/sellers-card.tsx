'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Seller } from '@/components/storefront/whatsapp-contact';

interface SellersCardProps {
  dealershipId: string;
  savedSellers?: Seller[];
}

export function SellersCard({ dealershipId, savedSellers }: SellersCardProps) {
  const { toast }  = useToast();
  const firestore  = useFirestore();
  const [sellers, setSellers] = useState<Seller[]>(savedSellers?.length ? savedSellers : [{ name: '', phone: '' }]);
  const [isSaving, setIsSaving] = useState(false);

  const updateSeller = (i: number, field: keyof Seller, value: string) => {
    setSellers(prev => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSeller    = () => setSellers(prev => [...prev, { name: '', phone: '' }]);
  const removeSeller = (i: number) => setSellers(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const valid = sellers
      .map(s => ({ name: s.name.trim(), phone: s.phone.trim() }))
      .filter(s => s.name && s.phone);

    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, 'dealerships', dealershipId), { sellers: valid });
      toast({ title: '✅ Vendedores salvos!', description: 'Os clientes já podem escolher com quem falar no WhatsApp.' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 space-y-5" style={{ borderColor: '#e5eeff' }}>
      <div>
        <h4 className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>Vendedores</h4>
        <p className="text-xs mt-0.5" style={{ color: '#45464d' }}>
          Cadastre os vendedores da loja para o cliente escolher com quem falar no WhatsApp. Se ninguém for cadastrado, o site usa só o telefone principal da loja.
        </p>
      </div>

      <div className="space-y-3">
        {sellers.map((seller, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nome do vendedor"
              value={seller.name}
              onChange={e => updateSeller(i, 'name', e.target.value)}
              className="flex-1 rounded border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ borderColor: '#e5eeff' }}
            />
            <input
              type="text"
              placeholder="(11) 99999-9999"
              value={seller.phone}
              onChange={e => updateSeller(i, 'phone', e.target.value)}
              className="w-44 shrink-0 rounded border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{ borderColor: '#e5eeff' }}
            />
            <button
              onClick={() => removeSeller(i)}
              className="shrink-0 rounded p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Remover vendedor"
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addSeller}
        type="button"
        className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#f8f9ff]"
        style={{ borderColor: '#e5eeff', color: '#3980f4' }}
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar vendedor
      </button>

      <div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          type="button"
          className="flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#3980f4' }}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar vendedores
        </button>
      </div>
    </div>
  );
}
