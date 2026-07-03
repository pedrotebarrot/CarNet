'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { disconnectML } from '@/actions/mercadolivre';
import { disconnectOLX } from '@/actions/olx';

interface IntegrationsCardProps {
  dealershipId:   string;
  dealershipSlug: string;
  mlConnected:    boolean;
  mlUserId?:      string;
  mlHasRefreshToken?: boolean;
  mlExpiresAt?:   string | Date | null;
  olxConnected:   boolean;
  olxAccountEmail?: string | null;
  olxExpiresAt?:  any;
}

function tsToDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v?.toDate)          return v.toDate();
  if (v?.seconds  != null) return new Date(v.seconds  * 1000);
  if (v?._seconds != null) return new Date(v._seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function IntegrationsCard({
  dealershipId,
  dealershipSlug,
  mlConnected,
  mlUserId,
  mlHasRefreshToken,
  mlExpiresAt,
  olxConnected: olxConnectedProp,
  olxAccountEmail,
  olxExpiresAt,
}: IntegrationsCardProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [mlConn,  setMlConn]  = useState(mlConnected);
  const [olxConn, setOlxConn] = useState(olxConnectedProp);
  const [mlDisconnecting,  setMlDisconnecting]  = useState(false);
  const [olxDisconnecting, setOlxDisconnecting] = useState(false);

  const mlConfigured  = process.env.NEXT_PUBLIC_ML_CONFIGURED  === 'true';
  const olxConfigured = process.env.NEXT_PUBLIC_OLX_CONFIGURED === 'true';

  // ── Handle OAuth redirects ────────────────────────────────────────────────
  useEffect(() => {
    // ML
    if (searchParams.get('ml_connected') === '1') {
      setMlConn(true);
      toast({ title: '✅ Mercado Livre conectado!', description: 'Seus próximos veículos serão publicados automaticamente.' });
      window.history.replaceState({}, '', '/dashboard/settings');
    }
    const mlError = searchParams.get('ml_error');
    if (mlError) {
      const msgs: Record<string, string> = {
        not_configured: 'As credenciais do Mercado Livre ainda não foram configuradas.',
        acesso_negado:  'Autorização negada. Tente novamente.',
        token_failed:   'Falha ao obter token. Verifique as credenciais.',
        oauth_failed:   'Erro no processo de autorização.',
      };
      const detail = searchParams.get('ml_detail');
      toast({
        title: 'Erro ao conectar Mercado Livre',
        description: (msgs[mlError] ?? 'Ocorreu um erro.') + (detail ? ` — ${decodeURIComponent(detail)}` : ''),
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/dashboard/settings');
    }

    // OLX
    if (searchParams.get('olx_connected') === '1') {
      setOlxConn(true);
      toast({ title: '✅ OLX conectado!', description: 'Seu estoque será sincronizado automaticamente com a OLX.' });
      window.history.replaceState({}, '', '/dashboard/settings');
    }
    const olxError = searchParams.get('olx_error');
    if (olxError) {
      const msgs: Record<string, string> = {
        not_configured: 'As credenciais da OLX ainda não foram configuradas.',
        acesso_negado:  'Autorização negada. Tente novamente.',
        token_failed:   'Falha ao obter token da OLX.',
        oauth_failed:   'Erro no processo de autorização OLX.',
      };
      const detail = searchParams.get('olx_detail');
      toast({
        title: 'Erro ao conectar OLX',
        description: (msgs[olxError] ?? 'Ocorreu um erro.') + (detail ? ` — ${decodeURIComponent(detail)}` : ''),
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams, toast]);

  // ── Disconnect handlers ───────────────────────────────────────────────────
  const handleDisconnectML = async () => {
    setMlDisconnecting(true);
    try {
      await disconnectML(dealershipId);
      setMlConn(false);
      toast({ title: 'Mercado Livre desconectado.' });
    } catch {
      toast({ title: 'Erro ao desconectar', variant: 'destructive' });
    } finally {
      setMlDisconnecting(false);
    }
  };

  const handleDisconnectOLX = async () => {
    setOlxDisconnecting(true);
    try {
      await disconnectOLX(dealershipId);
      setOlxConn(false);
      toast({ title: 'OLX desconectado.' });
    } catch {
      toast({ title: 'Erro ao desconectar OLX', variant: 'destructive' });
    } finally {
      setOlxDisconnecting(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── OLX ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-white p-5" style={{ borderColor: '#e5eeff' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-white text-sm" style={{ backgroundColor: '#FF6B00' }}>
              OLX
            </div>
            <div>
              <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>OLX</p>
              <p className="text-xs mt-0.5" style={{ color: '#45464d' }}>OAuth — publicação automática ao cadastrar veículo</p>
            </div>
          </div>
          {olxConn ? (
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
          {olxConn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#045d30' }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: '#006d2f' }} />
                <span>
                  Conta OLX conectada{olxAccountEmail ? ` (${olxAccountEmail})` : ''}. Novos veículos serão publicados automaticamente.
                </span>
              </div>

              {/* Session-expiry hint — OLX issues short-lived tokens with no
                  refresh mechanism, so a stale session needs a manual reconnect. */}
              {(() => {
                const exp = tsToDate(olxExpiresAt);
                const expired = exp ? exp.getTime() < Date.now() : false;
                if (!expired) return null;
                return (
                  <div className="flex items-start gap-2 rounded border p-3 text-xs" style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}>
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                    <div style={{ color: '#92400e' }} className="flex-1">
                      <p className="font-semibold mb-1">Sessão com a OLX pode ter expirado</p>
                      <p className="mb-2">
                        Se uma publicação falhar por autorização, reconecte a conta — leva 10 segundos e não afeta seus anúncios já publicados.
                      </p>
                      <a
                        href={`/api/olx/connect?dealershipId=${dealershipId}`}
                        className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#FF6B00' }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Reconectar agora
                      </a>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={handleDisconnectOLX}
                disabled={olxDisconnecting}
                className="inline-flex items-center gap-2 rounded border px-4 py-2 text-xs font-medium transition-colors hover:bg-red-50"
                style={{ borderColor: '#fca5a5', color: '#dc2626' }}
              >
                {olxDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Desconectar conta OLX
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <a
                href={`/api/olx/connect?dealershipId=${dealershipId}`}
                className="inline-flex items-center gap-2 rounded px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#FF6B00', color: '#ffffff' }}
              >
                <ExternalLink className="h-4 w-4" />
                Conectar conta da OLX
              </a>

              {!olxConfigured && (
                <div className="flex items-start gap-2 rounded border p-3 text-xs" style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                  <div style={{ color: '#92400e' }}>
                    <p className="font-semibold mb-1">Credenciais OLX ainda não configuradas no servidor.</p>
                    <p>Adicione <code className="bg-amber-100 px-1 rounded">OLX_CLIENT_ID</code> e <code className="bg-amber-100 px-1 rounded">OLX_CLIENT_SECRET</code> nas variáveis de ambiente do Vercel e faça um novo deploy.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mercado Livre ────────────────────────────────────────── */}
      <div className="rounded-lg border bg-white p-5" style={{ borderColor: '#e5eeff' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-[10px]" style={{ backgroundColor: '#FFE600', color: '#333' }}>
              ML
            </div>
            <div>
              <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>Mercado Livre</p>
              <p className="text-xs mt-0.5" style={{ color: '#45464d' }}>OAuth — publicação automática ao cadastrar veículo</p>
            </div>
          </div>
          {mlConn ? (
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
          {mlConn ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#045d30' }}>
                <CheckCircle2 className="h-4 w-4" style={{ color: '#006d2f' }} />
                <span>Conta conectada{mlUserId ? ` (ID: ${mlUserId})` : ''}. Novos veículos serão publicados automaticamente.</span>
              </div>

              {/* Warning when refresh_token is missing — without it, the dealer
                  will need to manually reconnect every 6h when the access_token expires. */}
              {!mlHasRefreshToken && (
                <div className="flex items-start gap-2 rounded border p-3 text-xs" style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                  <div style={{ color: '#92400e' }}>
                    <p className="font-semibold mb-1">⚠️ Renovação automática desabilitada</p>
                    <p className="mb-2">
                      Esta conexão não envia <code className="bg-amber-100 px-1 rounded">refresh_token</code>, então o token expira em 6h e a integração para de funcionar até reconectar manualmente.
                    </p>
                    <p className="font-semibold mb-1">Para corrigir:</p>
                    <ol className="space-y-0.5 list-decimal list-inside">
                      <li>Acesse <a href="https://developers.mercadolibre.com.br/devcenter" target="_blank" rel="noopener noreferrer" className="underline">developers.mercadolibre.com.br/devcenter</a></li>
                      <li>Abra o app AutosDigital → <strong>Fluxos OAuth</strong></li>
                      <li>Marque <strong>"Refresh Token"</strong> e salve</li>
                      <li>Volte aqui, desconecte e reconecte UMA vez</li>
                    </ol>
                  </div>
                </div>
              )}

              <button
                onClick={handleDisconnectML}
                disabled={mlDisconnecting}
                className="inline-flex items-center gap-2 rounded border px-4 py-2 text-xs font-medium transition-colors hover:bg-red-50"
                style={{ borderColor: '#fca5a5', color: '#dc2626' }}
              >
                {mlDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
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

              {!mlConfigured && (
                <div className="flex items-start gap-2 rounded border p-3 text-xs" style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                  <div style={{ color: '#92400e' }}>
                    <p className="font-semibold mb-1">Configuração necessária antes de conectar:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Crie um app em <a href="https://developers.mercadolibre.com.br" target="_blank" rel="noopener noreferrer" className="underline">developers.mercadolibre.com.br</a></li>
                      <li>Configure o redirect URI: <code className="bg-amber-100 px-1 rounded">autosdigital.vercel.app/api/mercadolivre/callback</code></li>
                      <li>Adicione <code className="bg-amber-100 px-1 rounded">ML_APP_ID</code> e <code className="bg-amber-100 px-1 rounded">ML_SECRET_KEY</code> nas variáveis de ambiente</li>
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
