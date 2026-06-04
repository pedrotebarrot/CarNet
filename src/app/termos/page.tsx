import Link from 'next/link';
import { Logo } from '@/components/logo';

export const metadata = {
  title: 'Termos de Uso — AutosDigital',
  description: 'Termos e condições de uso da plataforma AutosDigital.',
};

export default function TermosPage() {
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
          Termos de Uso
        </h1>
        <p className="text-sm mb-10" style={{ color: '#45464d' }}>
          Última atualização: {updated}
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#0b1c30' }}>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta e utilizar a plataforma AutosDigital, você concorda com estes Termos de Uso.
              Se não concordar com qualquer parte destes termos, não utilize a plataforma.
              Estes termos se aplicam a todos os usuários, incluindo revendas, lojistas e seus representantes.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">2. Descrição do Serviço</h2>
            <p className="mb-3">
              A AutosDigital é uma plataforma SaaS (Software como Serviço) voltada para revendas de veículos.
              O serviço oferece:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2" style={{ color: '#45464d' }}>
              <li>Site profissional automático com catálogo de veículos</li>
              <li>Gerenciamento de estoque e veículos</li>
              <li>Integração com marketplaces (OLX e Mercado Livre)</li>
              <li>Geração de conteúdo para redes sociais via inteligência artificial</li>
              <li>Ferramentas de personalização visual da loja</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">3. Cadastro e Responsabilidades</h2>
            <p className="mb-3">
              Para utilizar a AutosDigital você deve criar uma conta com informações verídicas.
              Você é responsável por:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2" style={{ color: '#45464d' }}>
              <li>Manter a confidencialidade da sua senha e acesso</li>
              <li>Toda a atividade que ocorrer em sua conta</li>
              <li>A veracidade das informações dos veículos cadastrados</li>
              <li>Garantir que os anúncios publicados estejam de acordo com as legislações vigentes</li>
              <li>Possuir autorização para utilizar imagens e logotipos enviados</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">4. Planos, Pagamento e Cancelamento</h2>
            <p className="mb-3">
              A AutosDigital oferece planos de assinatura mensal e anual. Os valores vigentes estão disponíveis
              na página inicial do site.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2" style={{ color: '#45464d' }}>
              <li>O pagamento é cobrado antecipadamente no início de cada período</li>
              <li>O cancelamento pode ser feito a qualquer momento, encerrando o acesso ao fim do período pago</li>
              <li>Não há reembolso proporcional para cancelamentos no meio do período</li>
              <li>A AutosDigital reserva o direito de alterar os preços com aviso prévio de 30 dias</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">5. Uso Aceitável</h2>
            <p className="mb-3">É proibido utilizar a plataforma para:</p>
            <ul className="list-disc list-inside space-y-1 pl-2" style={{ color: '#45464d' }}>
              <li>Publicar anúncios de veículos fraudulentos, roubados ou com documentação irregular</li>
              <li>Compartilhar conteúdo ilegal, ofensivo ou que viole direitos de terceiros</li>
              <li>Tentar acessar dados de outras contas ou realizar atividades de hacking</li>
              <li>Utilizar a plataforma para fins que não sejam a gestão legítima de estoque de veículos</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">6. Propriedade Intelectual</h2>
            <p>
              Todo o código, design, marcas e conteúdo da plataforma AutosDigital são propriedade exclusiva
              da AutosDigital. O usuário retém a propriedade do conteúdo que envia (fotos, textos, logotipos),
              mas concede à AutosDigital licença para exibi-lo na plataforma. A AutosDigital não reivindica
              propriedade sobre o conteúdo dos usuários.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">7. Limitação de Responsabilidade</h2>
            <p>
              A AutosDigital não se responsabiliza por negociações entre vendedor e comprador realizadas
              fora da plataforma, por informações incorretas fornecidas pelo usuário nos anúncios,
              por indisponibilidade temporária de serviços de terceiros (OLX, Mercado Livre, Google),
              nem por perdas de dados decorrentes de uso inadequado da plataforma.
              O serviço é fornecido "como está", sem garantias de resultados específicos de vendas.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">8. Suspensão e Encerramento</h2>
            <p>
              A AutosDigital pode suspender ou encerrar contas que violem estes Termos de Uso,
              com ou sem aviso prévio, dependendo da gravidade da infração. Em caso de encerramento
              por iniciativa do usuário, os dados serão mantidos por 30 dias e então excluídos.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">9. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes Termos de Uso periodicamente. Notificaremos os usuários
              sobre mudanças relevantes por e-mail ou por aviso na plataforma. O uso continuado
              após a notificação constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-semibold text-lg mb-3">10. Contato</h2>
            <p>
              Dúvidas sobre estes Termos de Uso podem ser enviadas para:{' '}
              <a
                href="mailto:contato@autosdigital.com.br"
                className="underline"
                style={{ color: '#3980f4' }}
              >
                contato@autosdigital.com.br
              </a>
            </p>
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
