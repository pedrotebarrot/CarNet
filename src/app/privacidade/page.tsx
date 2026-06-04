import Link from 'next/link';
import { Logo } from '@/components/logo';

export const metadata = {
  title: 'Política de Privacidade — AutosDigital',
  description: 'Como a AutosDigital coleta, usa e protege seus dados pessoais.',
};

export default function PrivacidadePage() {
  const updated = '04 de junho de 2025';

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#f8f9ff', color: '#0b1c30' }}>
      <header style={{ backgroundColor: '#131b2e' }} className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-white">
          <Logo className="h-6 w-6 text-white" />
          <span className="font-headline font-semibold text-base">AutosDigital</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="font-headline font-bold text-3xl mb-2" style={{ color: '#0b1c30' }}>
          Política de Privacidade
        </h1>
        <p className="text-sm mb-10" style={{ color: '#45464d' }}>
          Última atualização: {updated}
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#0b1c30' }}>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">1. Quem somos</h2>
            <p>
              A AutosDigital é uma plataforma de gestão e marketing digital para revendas de veículos.
              Esta política descreve como coletamos, utilizamos e protegemos os seus dados pessoais,
              em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">2. Dados que coletamos</h2>
            <p className="mb-3">Coletamos os seguintes dados ao utilizar nossa plataforma:</p>
            <div className="space-y-3">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#eff4ff', border: '1px solid #e5eeff' }}>
                <p className="font-medium mb-1">Dados de cadastro</p>
                <p style={{ color: '#45464d' }}>
                  Nome da revenda, endereço, telefone, e-mail e senha (criptografada).
                  Logotipo e fotos enviadas voluntariamente.
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#eff4ff', border: '1px solid #e5eeff' }}>
                <p className="font-medium mb-1">Dados de uso</p>
                <p style={{ color: '#45464d' }}>
                  Informações sobre veículos cadastrados, histórico de publicações
                  e configurações da conta.
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#eff4ff', border: '1px solid #e5eeff' }}>
                <p className="font-medium mb-1">Dados técnicos</p>
                <p style={{ color: '#45464d' }}>
                  Endereço IP, tipo de navegador, sistema operacional e logs de acesso —
                  coletados automaticamente para segurança e diagnóstico.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">3. Como usamos seus dados</h2>
            <ul className="list-disc list-inside space-y-1 pl-2" style={{ color: '#45464d' }}>
              <li>Fornecer, operar e melhorar a plataforma</li>
              <li>Criar e exibir seu site público de veículos</li>
              <li>Enviar notificações sobre a conta e o serviço</li>
              <li>Processar pagamentos e emitir cobranças</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma</li>
            </ul>
            <p className="mt-3" style={{ color: '#45464d' }}>
              Não utilizamos seus dados para fins publicitários de terceiros nem vendemos dados a terceiros.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">4. Compartilhamento com terceiros</h2>
            <p className="mb-3">
              Compartilhamos dados apenas com prestadores de serviço essenciais para o funcionamento da plataforma:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2" style={{ color: '#45464d' }}>
              <li>
                <strong>Google Firebase</strong> — autenticação de usuários, banco de dados e armazenamento de arquivos
              </li>
              <li>
                <strong>Google Gemini (IA)</strong> — geração de descrições e conteúdo para redes sociais
              </li>
              <li>
                <strong>Vercel</strong> — hospedagem e entrega da plataforma
              </li>
              <li>
                <strong>Mercado Livre / OLX</strong> — publicação de anúncios, mediante autorização explícita do usuário
              </li>
            </ul>
            <p className="mt-3" style={{ color: '#45464d' }}>
              Todos os fornecedores estão sujeitos a contratos de proteção de dados e às legislações aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">5. Armazenamento e segurança</h2>
            <p>
              Os dados são armazenados nos servidores do Google Firebase, localizados nos Estados Unidos,
              com proteção por criptografia em trânsito (TLS) e em repouso. Adotamos medidas técnicas
              e organizacionais para proteger suas informações contra acesso não autorizado.
              No entanto, nenhum sistema é 100% seguro — em caso de incidente, notificaremos os
              usuários afetados conforme exigido pela LGPD.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">6. Retenção de dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento,
              os dados são retidos por 30 dias e então excluídos permanentemente,
              salvo obrigação legal de retenção maior (ex: dados fiscais).
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">7. Seus direitos (LGPD)</h2>
            <p className="mb-3">
              Como titular de dados, você tem direito a:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2" style={{ color: '#45464d' }}>
              <li>Confirmar se tratamos seus dados e acessá-los</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a exclusão dos seus dados pessoais</li>
              <li>Revogar consentimentos dados anteriormente</li>
              <li>Portabilidade dos dados para outro fornecedor</li>
              <li>Apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD)</li>
            </ul>
            <p className="mt-3" style={{ color: '#45464d' }}>
              Para exercer qualquer desses direitos, entre em contato pelo e-mail abaixo.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">8. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para manter sua sessão autenticada na plataforma.
              Não utilizamos cookies de rastreamento ou publicidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">9. Contato e Encarregado de Dados (DPO)</h2>
            <p>
              Para dúvidas, solicitações ou reclamações relacionadas à privacidade, entre em contato:
            </p>
            <div className="mt-3 rounded-lg p-4" style={{ backgroundColor: '#eff4ff', border: '1px solid #e5eeff' }}>
              <p><strong>AutosDigital</strong></p>
              <p style={{ color: '#45464d' }}>
                E-mail:{' '}
                <a href="mailto:privacidade@autosdigital.com.br" className="underline" style={{ color: '#3980f4' }}>
                  privacidade@autosdigital.com.br
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t py-6 mt-8" style={{ backgroundColor: '#131b2e', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto max-w-3xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            ← Voltar ao início
          </Link>
          <div className="flex gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
