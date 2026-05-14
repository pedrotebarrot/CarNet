'use client';

import { useState } from 'react';
import { Loader2, Wand2, RotateCcw } from 'lucide-react';
import { extractDominantColor, buildBrandPalette, DEFAULT_PALETTE } from '@/lib/utils/colors';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface BrandColorsCardProps {
  dealershipId:  string;
  logoUrl?:      string;
  savedColor?:   string;
}

export function BrandColorsCard({ dealershipId, logoUrl, savedColor }: BrandColorsCardProps) {
  const { toast }   = useToast();
  const firestore   = useFirestore();
  const [color,     setColor]     = useState(savedColor || DEFAULT_PALETTE.primary);
  const [isSaving,  setIsSaving]  = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const palette = buildBrandPalette(color);

  const handleExtract = async () => {
    if (!logoUrl) {
      toast({ title: 'Nenhuma logo encontrada', description: 'Envie uma logo primeiro.', variant: 'destructive' });
      return;
    }
    setIsExtracting(true);
    try {
      const extracted = await extractDominantColor(logoUrl);
      setColor(extracted);
      toast({ title: 'Cor extraída!', description: 'Confirme e salve para aplicar no site.' });
    } catch {
      toast({ title: 'Não foi possível extrair a cor', variant: 'destructive' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    setColor(DEFAULT_PALETTE.primary);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, 'dealerships', dealershipId), {
        'brandColors.primary': color,
      });
      toast({ title: '✅ Cores salvas!', description: 'O site da loja já está com as novas cores.' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 space-y-5" style={{ borderColor: '#e5eeff' }}>

      <div>
        <h4 className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>Cor principal da marca</h4>
        <p className="text-xs mt-0.5" style={{ color: '#45464d' }}>
          Usada no cabeçalho, ícones e botões do site da loja.
        </p>
      </div>

      {/* ── Color picker row ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Native color input */}
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            className="h-10 w-10 rounded border-2 border-white shadow-sm ring-1 ring-black/10 overflow-hidden cursor-pointer"
            style={{ backgroundColor: color }}
          >
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="opacity-0 w-full h-full cursor-pointer"
            />
          </div>
          <span className="font-mono text-sm" style={{ color: '#0b1c30' }}>{color.toUpperCase()}</span>
        </label>

        {/* Extract from logo button */}
        <button
          onClick={handleExtract}
          disabled={isExtracting || !logoUrl}
          className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#eff4ff] disabled:opacity-50"
          style={{ borderColor: '#e5eeff', color: '#3980f4' }}
        >
          {isExtracting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Wand2 className="h-3.5 w-3.5" />
          }
          Extrair da logo
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#f8f9ff] disabled:opacity-50"
          style={{ borderColor: '#e5eeff', color: '#45464d' }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Padrão
        </button>
      </div>

      {/* ── Live preview ──────────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: '#45464d' }}>Pré-visualização:</p>
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#e5eeff' }}>
          {/* Mini header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: palette.header }}>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded" style={{ backgroundColor: palette.primary, opacity: 0.9 }} />
              <span className="text-white text-xs font-semibold font-headline">Nome da Loja</span>
            </div>
            <div className="rounded px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#006d2f' }}>
              WhatsApp
            </div>
          </div>
          {/* Mini card */}
          <div className="p-3" style={{ backgroundColor: '#f8f9ff' }}>
            <div className="rounded border bg-white p-3 flex items-center justify-between" style={{ borderColor: palette.border }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#0b1c30' }}>Honda Civic 2024</p>
                <p className="font-mono text-[10px] mt-0.5 flex items-center gap-1" style={{ color: '#45464d' }}>
                  <span style={{ color: palette.primary }}>●</span> 12.000 km
                </p>
              </div>
              <div className="rounded px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: palette.primary }}>
                R$ 148.000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Palette chips ────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {[
          { label: 'Cabeçalho', color: palette.header },
          { label: 'Destaque',  color: palette.primary },
          { label: 'Fundo',     color: palette.light },
          { label: 'Borda',     color: palette.border },
        ].map(({ label, color: c }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded border border-black/10 shadow-sm" style={{ backgroundColor: c }} />
            <span className="font-mono text-[9px]" style={{ color: '#45464d' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Save ─────────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: palette.primary }}
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar cores
      </button>
    </div>
  );
}
