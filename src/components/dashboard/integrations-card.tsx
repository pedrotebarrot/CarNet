'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Copy, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { disconnectML } from '@/actions/mercadolivre';

interface IntegrationsCardProps {
  dealershipId: string;
  dealershipSlug: string;
  mlConnected: boolean;
  mlUserId?: string;
}

export function IntegrationsCard({
  dealershipId,
  dealershipSlug,
  mlConnected,
  mlUserId,
}: IntegrationsCardProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connected, setConnected] = useState(mlConnected);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autosdigital.vercel.app';
  const feedUrl = `${appUrl}/api/feed/${dealershipSlug}`;
  const mlConfigured = Boolean(process.env.NEXT_PUBLIC_ML_CONFIGURED === 'true');

  // Handle redirect params from OAuth callback
  useEffect(() => {
    if (searchParams.get('ml_connected') === '1') {
      setConnected(true);
      toast({ title: '✅ Mercado Livre conectado!', description: 'Seus próximos veículos serão publicados automaticamente.' });
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
    const mlError = searchParams.get('ml_error');
    if (mlError) {
      const messages: Record<string, string> = {
        not_configured: 'As credenciais do Mercado Livre ainda não foram configuradas.',
        acesso_negado:  'Autorização negada. Tente novamente.',
        token_failed:   'Falha ao obter token. Verifique as credenciais.',
        oauth_failed:   'Erro no processo de autorização.',
      };
      toast({
        title: 'Erro ao conectar',
        description: messages[mlError] ?? 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams, toast]);

  const copyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl);
    toast({ title: 'Link copiado!', description: 'Cole no painel do OLX para ativar a importação.' });
  };

  const handleDisconnectML = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectML(dealershipId);
      setConnected(false);
      toast({ title: 'Mercado Livre desconectado.' });
    } catch {
      toast({ title: 'Erro ao desconectar', variant: 'destructive' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── OLX ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-white p-5" style={{ borderColor: '#e5eeff' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* OLX Logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-white text-sm" style={{ backgroundColor: '#FF6B00' }}>
              OLX
            </div>
            <div>
              <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>OLX</p>
              <p className="text-xs mt-0.5" style={{ color: '#45464d' }}>Feed XML — sincronização automática a cada 6h</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            Pendente configuração
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {/* Feed URL */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: '#45464d' }}>Seu link de feed:</p>
            <div className="flex items-center gap-2 rounded border px-3 py-2" style={{ borderColor: '#e5eeff', backgroundColor: '#f8f9ff' }}>
              <span className="flex-1 font-mono text-xs truncate" style={{ color: '#0b1c30' }}>{feedUrl}</span>
              <button
                onClick={copyFeedUrl}
                className="shrink-0 rounded p-1 transition-colors hover:bg-[#e5eeff]"
                title="Copiar"
              >
                <Copy className="h-3.5 w-3.5" style={{ color: '#3980f4' }} />
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded border p-3 space-y-1.5 text-xs" style={{ borderColor: '#e5eeff', backgroundColor: '#eff4ff' }}>
            <p className="font-semibold" style={{ color: '#0b1c30' }}>Como ativar no OLX:</p>
            <ol className="space-y-1 list-decimal list-inside" style={{ color: '#45464d' }}>
              <li>Acesse <strong>olx.com.br</strong> → Minha Conta → Importar Anúncios</li>
              <li>Cole o link acima no campo de feed</li>
              <li>Pronto — o OLX sincronizará seu estoque automaticamente</li>
            </ol>
            <a
              href="https://www.olx.com.br/autos-e-pecas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium"
              style={{ color: '#3980f4' }}
            >
              Ir para o OLX <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Mercado Livre ────────────────────────────────────────── */}
      <div className="rounded-lg border bg-white p-5" style={{ borderColor: '#e5eeff' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* ML Logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-white text-[10px]" style={{ backgroundColor: '#FFE600', color: '#333' }}>
              ML
            </div>
            <div>
              <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>Mercado Livre</p>
              <p className="text-xs mt-0.5" style={{ color: '#45464d' }}>OAuth — publicação automática ao cadastrar veículo</p>
            </div>
          </div>
          {connected ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
              <CheckCircle2 className="h-3 w-3" /> Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
              <XCircle className="h-3 w-3" /> Desconectado
            </span>
          )}
        </div>

        <div className="mt-4">
          {connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#045d30' }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: '#006d2f' }} />
                <span>Conta conectada{mlUserId ? ` (ID: ${mlUserId})` : ''}. Novos veículos serão publicados automaticamente.</span>
              </div>
              <button
                onClick={handleDisconnectML}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-2 rounded border px-4 py-2 text-xs font-medium transition-colors hover:bg-red-50"
                style={{ borderColor: '#fca5a5', color: '#dc2626' }}
              >
                {isDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Desconectar conta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <a
                href={`/api/mercadolivre/connect?dealershipId=${dealershipId}`}
                className="inline-flex items-center gap-2 rounded px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#FFE600', color: '#333333' }}
              >
                <ExternalLink className="h-4 w-4" />
                Conectar conta do Mercado Livre
              </a>

              {/* Aviso só aparece se as credenciais ainda não foram configuradas */}
              {!mlConfigured && (
                <div className="flex items-start gap-2 rounded border p-3 text-xs" style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                  <div style={{ color: '#92400e' }}>
                    <p className="font-semibold mb-1">Configuração necessária antes de conectar:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Crie um app em <a href="https://developers.mercadolibre.com.br" target="_blank" rel="noopener noreferrer" className="underline">developers.mercadolibre.com.br</a></li>
                      <li>Configure o redirect URI: <code className="bg-amber-100 px-1 rounded">autosdigital.vercel.app/api/mercadolivre/callback</code></li>
                      <li>Adicione <code className="bg-amber-100 px-1 rounded">ML_APP_ID</code> e <code className="bg-amber-100 px-1 rounded">ML_SECRET_KEY</code> nas variáveis de ambiente do Vercel</li>
                      <li>Faça um novo deploy e volte aqui</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
