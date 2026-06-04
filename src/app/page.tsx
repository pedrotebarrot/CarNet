import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Zap, Globe, Instagram,
  LayoutGrid, RefreshCw, Share2, TrendingUp, ShieldCheck, Sparkles,
  Clock, AlertTriangle, XCircle,
} from 'lucide-react';
import { Logo } from '@/components/logo';

// ── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: '+500',  label: 'Revendas ativas' },
  { value: '+12k',  label: 'Veículos cadastrados' },
  { value: '98%',   label: 'Satisfação dos clientes' },
  { value: '3 min', label: 'Para publicar em tudo' },
];

const pains = [
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Horas perdidas em cada venda',
    description:
      'Cadastrar o mesmo carro no OLX, Mercado Livre e no WhatsApp manualmente consome tempo que poderia ser gasto vendendo.',
  },
  {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: 'Carro vendido ainda sendo anunciado',
    description:
      'Quando o carro sai do pátio, você ainda precisa lembrar de tirar de cada plataforma uma por uma — e enquanto isso, continua recebendo contatos de graça.',
  },
  {
    icon: <XCircle className="h-6 w-6" />,
    title: 'Sem presença digital de verdade',
    description:
      'Seu estoque vive em grupos de WhatsApp e planilhas. Clientes que pesquisam na internet simplesmente não te encontram.',
  },
];

const features = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Publique em todos os marketplaces de uma vez',
    description:
      'Cadastrou o carro uma vez? Ele vai automaticamente para OLX, Mercado Livre e para o seu site. Em minutos, não em horas.',
    tag: 'Marketplaces',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Vendeu? Some de tudo em 1 clique',
    description:
      'Marque o carro como "Vendido" e em segundos ele sai de todos os canais. Sem anúncios fantasmas, sem contatos frustrados.',
    tag: 'Controle',
  },
  {
    icon: <LayoutGrid className="h-6 w-6" />,
    title: 'Site profissional com seu estoque ao vivo',
    description:
      'Cada revenda ganha uma página pública com identidade visual própria. Seu catálogo, na internet, atualizado em tempo real.',
    tag: 'Presença Digital',
  },
  {
    icon: <Instagram className="h-6 w-6" />,
    title: 'Posts para o Instagram gerados por IA',
    description:
      'Sem agência, sem copywriter. A IA cria a legenda e o post completo do veículo para você publicar no Instagram com um toque.',
    tag: 'IA',
  },
  {
    icon: <Share2 className="h-6 w-6" />,
    title: 'Catálogo sempre atualizado para compartilhar',
    description:
      'Mande o link do seu catálogo no WhatsApp. O cliente vê todos os carros disponíveis em tempo real, sem precisar de PDF ou planilha.',
    tag: 'Catálogo',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Controle total do seu estoque',
    description:
      'Filtre por modelo, preço, combustível e mais. Saiba exatamente o que você tem, o que está publicado e o que já vendeu.',
    tag: 'Gestão',
  },
];

const steps = [
  {
    number: '01',
    title: 'Cadastre o veículo uma vez',
    description:
      'Preencha os dados do carro — marca, modelo, ano, fotos, preço. A IA já gera a descrição para você.',
  },
  {
    number: '02',
    title: 'Publique em tudo automaticamente',
    description:
      'Com um clique, seu carro aparece no OLX, Mercado Livre, no site da sua revenda e vira post para o Instagram.',
  },
  {
    number: '03',
    title: 'Vendeu? Retire de tudo em segundos',
    description:
      'Marque como vendido e o carro desaparece de todos os canais instantaneamente. Sem estresse, sem trabalho manual.',
  },
];

const valuePros = [
  'Site com domínio e identidade visual da sua loja',
  'Publicação simultânea no OLX e Mercado Livre',
  'Remoção instantânea ao marcar como vendido',
  'Posts para Instagram criados por inteligência artificial',
  'Catálogo digital para compartilhar no WhatsApp',
  'Painel de controle com filtros e busca avançada',
  'Integração de cores da sua logo automaticamente',
  'Acesse de qualquer lugar, pelo celular ou computador',
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#f8f9ff', color: '#0b1c30' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ backgroundColor: '#131b2e' }} className="sticky top-0 z-50 shadow-lg">
        <div className="mx-auto max-w-[1280px] px-4 md:px-16 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <Logo className="h-6 w-6 text-white" />
            <span className="font-headline font-semibold text-base">AutosDigital</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <a href="#solucoes" className="hover:text-white transition-colors">Soluções</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#marketplaces" className="hover:text-white transition-colors">Integrações</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#006d2f' }}
            >
              Testar grátis
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden py-24 md:py-36"
          style={{
            background: 'linear-gradient(135deg, #0b1220 0%, #131b2e 50%, #0f2040 100%)',
          }}
        >
          {/* Background grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="grid items-center gap-12 md:grid-cols-2">

              {/* Left: copy */}
              <div>
                <span
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
                  style={{ backgroundColor: 'rgba(57,128,244,0.15)', color: '#6fa3f7', border: '1px solid rgba(57,128,244,0.25)' }}
                >
                  <Zap className="h-3 w-3" />
                  Para revendas de veículos
                </span>

                <h1 className="font-headline font-bold text-4xl md:text-[52px] leading-[1.08] tracking-tight text-white mb-6">
                  Publique seu estoque em todo lugar.{' '}
                  <span style={{ color: '#6fa3f7' }}>Em minutos.</span>
                </h1>

                <p className="text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Cadastre o carro uma vez e ele vai automaticamente para o OLX, Mercado Livre e para o site da sua revenda.
                  Quando vender, some de tudo em 1 clique.
                </p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                    style={{ backgroundColor: '#006d2f', boxShadow: '0 4px 24px rgba(0,109,47,0.35)' }}
                  >
                    Quero testar grátis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#como-funciona"
                    className="inline-flex items-center gap-2 rounded-lg border px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/10"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
                  >
                    Ver como funciona
                  </a>
                </div>

                <div className="flex flex-wrap gap-5">
                  {['Sem contrato', 'Grátis para começar', 'Suporte incluso'].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#4ade80' }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: dashboard mockup */}
              <div className="hidden md:block">
                <div
                  className="rounded-xl overflow-hidden shadow-2xl border"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
                >
                  {/* Mock header */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#0b1220' }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                      </div>
                    </div>
                    <div className="font-mono text-[10px] px-4 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                      autosdigital.com.br/ivaipora-motors
                    </div>
                    <div className="w-10" />
                  </div>

                  {/* Mock content */}
                  <div className="p-4" style={{ backgroundColor: '#0f1829' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-semibold text-sm">Estoque — 8 veículos</p>
                      <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>
                        ● Ao vivo
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { make: 'Honda Civic EXL', year: '2023/24', price: 'R$ 148.000', platforms: 3, status: 'available' },
                        { make: 'Toyota Corolla XEI', year: '2022/23', price: 'R$ 135.000', platforms: 3, status: 'available' },
                        { make: 'VW Polo Highline', year: '2024/24', price: 'R$ 92.000', platforms: 0, status: 'sold' },
                        { make: 'Jeep Compass', year: '2023/23', price: 'R$ 189.000', platforms: 3, status: 'available' },
                      ].map((car) => (
                        <div
                          key={car.make}
                          className="flex items-center justify-between rounded-lg p-3"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">{car.make}</p>
                            <p className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{car.year}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {car.status === 'available' ? (
                              <div className="flex gap-1">
                                {['OLX', 'ML', 'Site'].map((p) => (
                                  <span key={p} className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(57,128,244,0.2)', color: '#6fa3f7' }}>{p}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Vendido</span>
                            )}
                            <p className="font-bold text-sm text-white">{car.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#131b2e', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mx-auto max-w-[1280px] px-4 md:px-16 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {stats.map((stat, i) => (
              <div key={i} className={`text-center ${i < stats.length - 1 ? 'md:border-r' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="font-headline font-bold text-2xl md:text-3xl text-white">{stat.value}</p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pain points ──────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28" style={{ backgroundColor: '#f8f9ff' }}>
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded mb-4" style={{ backgroundColor: '#fff3cd', color: '#92400e' }}>
                Você se identifica?
              </span>
              <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight" style={{ color: '#0b1c30' }}>
                A rotina de quem vende carro é mais difícil do que deveria ser
              </h2>
              <p className="mt-4 text-base" style={{ color: '#45464d' }}>
                Essas são as dores que ouvimos todo dia de quem trabalha com revenda.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {pains.map((pain, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-6"
                  style={{ borderColor: '#fde8e8', backgroundColor: '#fff8f8' }}
                >
                  <div className="mb-4 inline-flex rounded-lg p-2.5" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                    {pain.icon}
                  </div>
                  <h3 className="font-headline font-semibold text-lg mb-2" style={{ color: '#0b1c30' }}>
                    {pain.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#45464d' }}>
                    {pain.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-base font-semibold" style={{ color: '#0b1c30' }}>
                A AutosDigital resolve tudo isso — em um só lugar.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section id="solucoes" style={{ backgroundColor: '#0b1220' }} className="py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded mb-4" style={{ backgroundColor: 'rgba(57,128,244,0.15)', color: '#6fa3f7', border: '1px solid rgba(57,128,244,0.2)' }}>
                Soluções
              </span>
              <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight text-white">
                Tudo que sua revenda precisa para decolar no digital
              </h2>
              <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Foco no que importa: vender carros. Deixe a tecnologia conosco.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="rounded-xl p-6 transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="inline-flex rounded-lg p-2.5" style={{ backgroundColor: 'rgba(57,128,244,0.15)', color: '#6fa3f7' }}>
                      {feature.icon}
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="font-headline font-semibold text-base mb-2 text-white leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section id="como-funciona" className="py-20 md:py-28" style={{ backgroundColor: '#f8f9ff' }}>
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded mb-4" style={{ backgroundColor: '#eff4ff', color: '#3980f4' }}>
                Como funciona
              </span>
              <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight" style={{ color: '#0b1c30' }}>
                Do cadastro à venda em 3 passos simples
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px" style={{ backgroundColor: '#e5eeff' }} />

              {steps.map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl font-headline font-bold text-xl text-white mb-6 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #3980f4, #1d5fd4)',
                      boxShadow: '0 8px 24px rgba(57,128,244,0.3)',
                    }}
                  >
                    {step.number}
                  </div>
                  <h3 className="font-headline font-semibold text-lg mb-3" style={{ color: '#0b1c30' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#45464d' }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Marketplace integration ───────────────────────────────────────── */}
        <section id="marketplaces" style={{ backgroundColor: '#131b2e' }} className="py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="grid items-center gap-12 md:grid-cols-2">

              {/* Left: mock */}
              <div className="order-2 md:order-1">
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0b1220' }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="font-headline font-semibold text-white text-sm">Honda Civic EXL 2023/24</p>
                    <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>Publicado</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { name: 'Site da Loja', icon: '🌐', status: 'Ao vivo',  color: '#4ade80' },
                      { name: 'OLX',           icon: '🟠', status: 'Ao vivo',  color: '#4ade80' },
                      { name: 'Mercado Livre', icon: '🟡', status: 'Ao vivo',  color: '#4ade80' },
                      { name: 'Instagram',     icon: '📸', status: 'Post gerado', color: '#c084fc' },
                    ].map((ch) => (
                      <div key={ch.name} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{ch.icon}</span>
                          <span className="text-sm font-medium text-white">{ch.name}</span>
                        </div>
                        <span className="font-mono text-[10px]" style={{ color: ch.color }}>● {ch.status}</span>
                      </div>
                    ))}
                    <div className="pt-2">
                      <button
                        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#dc2626' }}
                      >
                        Marcar como Vendido → Some de tudo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: copy */}
              <div className="order-1 md:order-2">
                <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded mb-4" style={{ backgroundColor: 'rgba(57,128,244,0.15)', color: '#6fa3f7', border: '1px solid rgba(57,128,244,0.2)' }}>
                  Integrações
                </span>
                <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight text-white mb-4">
                  Um cadastro, todos os canais
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Seu carro publicado simultaneamente no site da sua loja, no OLX, no Mercado Livre — e ainda com post gerado pela IA para o Instagram.
                  Sem repetição de trabalho.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Publicação simultânea em todos os canais',
                    'Atualização automática de preço e fotos',
                    'Remoção instantânea ao vender',
                    'Histórico de onde cada carro foi publicado',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#4ade80' }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#006d2f' }}
                >
                  Conectar minha revenda
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Instagram AI ─────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28" style={{ backgroundColor: '#f8f9ff' }}>
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="grid items-center gap-12 md:grid-cols-2">

              {/* Left: copy */}
              <div>
                <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded mb-4" style={{ backgroundColor: '#fdf4ff', color: '#9333ea', border: '1px solid #f3e8ff' }}>
                  Inteligência Artificial
                </span>
                <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight mb-4" style={{ color: '#0b1c30' }}>
                  Posts para o Instagram prontos em segundos
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#45464d' }}>
                  Você não precisa de agência nem de copywriter. A IA da AutosDigital cria a legenda completa com todas as informações do carro, chamada para ação e hashtags relevantes.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Legenda criada com os dados do veículo automaticamente',
                    'Tom de voz adaptado para o seu público',
                    'Hashtags relevantes incluídas',
                    'Edite antes de publicar ou publique direto',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm" style={{ color: '#45464d' }}>
                      <Sparkles className="h-4 w-4 shrink-0" style={{ color: '#9333ea' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: mock Instagram post */}
              <div>
                <div className="rounded-xl overflow-hidden border shadow-xl max-w-sm mx-auto" style={{ borderColor: '#e5eeff' }}>
                  {/* IG header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border-b" style={{ borderColor: '#f0f0f0' }}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                      IV
                    </div>
                    <div>
                      <p className="font-semibold text-xs" style={{ color: '#0b1c30' }}>ivaipora_motors</p>
                      <p className="text-[10px]" style={{ color: '#45464d' }}>Ivaiporã, Paraná</p>
                    </div>
                  </div>
                  {/* Car image placeholder */}
                  <div className="aspect-square flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a2744, #0f1829)', position: 'relative' }}>
                    <div className="text-center">
                      <p className="font-headline font-bold text-white text-2xl">Honda Civic</p>
                      <p className="font-mono text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>EXL 2023/24</p>
                      <p className="font-headline font-bold text-3xl mt-3" style={{ color: '#6fa3f7' }}>R$ 148.000</p>
                    </div>
                    {/* IA badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded px-2 py-1" style={{ backgroundColor: 'rgba(147,51,234,0.85)', backdropFilter: 'blur(4px)' }}>
                      <Sparkles className="h-3 w-3 text-white" />
                      <span className="font-mono text-[10px] text-white">Gerado por IA</span>
                    </div>
                  </div>
                  {/* Caption */}
                  <div className="p-4 bg-white">
                    <p className="text-xs leading-relaxed" style={{ color: '#0b1c30' }}>
                      <strong>🚗 Honda Civic EXL 2023/24 — R$ 148.000</strong>
                      <br /><br />
                      Oportunidade única! Civic em perfeito estado, apenas 12.000 km rodados, único dono. Câmbio automático, multimídia com CarPlay, couro e muito mais.
                      <br /><br />
                      <span style={{ color: '#3980f4' }}>💬 Chame no WhatsApp e agende seu test drive!</span>
                      <br /><br />
                      <span style={{ color: '#45464d' }}>#Honda #Civic #CarrosUsados #Ivaipora #Parana</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Everything included ───────────────────────────────────────────── */}
        <section style={{ backgroundColor: '#eff4ff' }} className="py-20 md:py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded mb-4" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                  Tudo incluso
                </span>
                <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight mb-4" style={{ color: '#0b1c30' }}>
                  Uma ferramenta completa para sua revenda crescer
                </h2>
                <p className="text-base leading-relaxed mb-8" style={{ color: '#45464d' }}>
                  Sem precisar contratar agência, designer ou programador. A AutosDigital entrega tudo que você precisa para ter uma presença digital profissional do dia 1.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#131b2e' }}
                >
                  Criar minha conta grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {valuePros.map((pro) => (
                  <div
                    key={pro}
                    className="flex items-start gap-3 rounded-lg p-4 bg-white border"
                    style={{ borderColor: '#e5eeff' }}
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#006d2f' }} />
                    <span className="text-sm leading-snug" style={{ color: '#0b1c30' }}>{pro}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28" style={{ backgroundColor: '#f8f9ff' }}>
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded mb-4" style={{ backgroundColor: '#eff4ff', color: '#3980f4' }}>
                Planos
              </span>
              <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight" style={{ color: '#0b1c30' }}>
                Simples e sem surpresas
              </h2>
              <p className="mt-4 text-base" style={{ color: '#45464d' }}>
                Um plano com tudo incluído. Sem taxas escondidas, sem contrato de fidelidade.
              </p>
            </div>

            <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">

              {/* ── Monthly ── */}
              <div
                className="rounded-2xl border bg-white p-8 flex flex-col"
                style={{ borderColor: '#e5eeff' }}
              >
                <div className="mb-6">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#45464d' }}>Mensal</p>
                  <div className="flex items-end gap-1.5">
                    <span className="font-headline font-bold text-4xl" style={{ color: '#0b1c30' }}>R$ 420</span>
                    <span className="text-base mb-1" style={{ color: '#45464d' }}>/mês</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#45464d' }}>Cobrado mensalmente · cancele quando quiser</p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {[
                    'Todas as funcionalidades inclusas',
                    'Site com URL exclusiva da loja',
                    'Estoque ilimitado de veículos',
                    'OLX + Mercado Livre + Instagram IA',
                    'Suporte via WhatsApp',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: '#0b1c30' }}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#006d2f' }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-semibold transition-colors hover:bg-[#eff4ff]"
                  style={{ border: '1.5px solid #3980f4', color: '#3980f4' }}
                >
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* ── Annual (highlighted) ── */}
              <div
                className="rounded-2xl border p-8 flex flex-col relative overflow-hidden"
                style={{ borderColor: '#3980f4', backgroundColor: '#fff', boxShadow: '0 8px 40px rgba(57,128,244,0.14)' }}
              >
                {/* Best value badge */}
                <div
                  className="absolute top-0 right-8 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-b"
                  style={{ backgroundColor: '#006d2f', color: '#fff' }}
                >
                  Melhor valor
                </div>

                <div className="mb-6">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#3980f4' }}>Anual</p>
                  <div className="flex items-end gap-1.5">
                    <span className="font-headline font-bold text-4xl" style={{ color: '#0b1c30' }}>R$ 350</span>
                    <span className="text-base mb-1" style={{ color: '#45464d' }}>/mês</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: '#45464d' }}>
                    R$ 4.200 cobrado anualmente ·{' '}
                    <span style={{ color: '#006d2f', fontWeight: 600 }}>economize R$ 840/ano</span>
                  </p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {[
                    'Tudo do plano mensal',
                    '2 meses grátis no ano',
                    'Prioridade no suporte',
                    'Acesso antecipado a novidades',
                    'Desconto garantido por 12 meses',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: '#0b1c30' }}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#006d2f' }} />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#006d2f' }}
                >
                  Assinar plano anual
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* ROI note */}
            <div
              className="mx-auto mt-8 max-w-xl rounded-lg border px-5 py-4 text-center"
              style={{ borderColor: '#e5eeff', backgroundColor: '#f0f7ff' }}
            >
              <p className="text-sm" style={{ color: '#0b1c30' }}>
                💡 <strong>Conta rápida:</strong> se o site trouxer <strong>1 venda a mais por mês</strong>, o plano já se paga — e sobra muito.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────────────────── */}
        <section
          className="py-24 md:py-32 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0b1220 0%, #131b2e 60%, #0f2040 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative mx-auto max-w-[1280px] px-4 md:px-16 text-center">
            <span className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(57,128,244,0.15)', color: '#6fa3f7', border: '1px solid rgba(57,128,244,0.25)' }}>
              Comece hoje mesmo
            </span>
            <h2 className="font-headline font-bold text-4xl md:text-5xl text-white tracking-tight max-w-2xl mx-auto mb-4">
              Sua revenda no digital em menos de 10 minutos
            </h2>
            <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Crie sua conta gratuitamente, cadastre seu primeiro carro e veja ele publicado em todo lugar antes do almoço.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg px-10 py-4 text-base font-bold text-white transition-all hover:scale-[1.02] hover:shadow-2xl"
              style={{ backgroundColor: '#006d2f', boxShadow: '0 4px 28px rgba(0,109,47,0.4)' }}
            >
              Começar agora — é grátis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sem cartão de crédito · Sem contrato · Suporte humano incluso
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t py-8" style={{ backgroundColor: '#0b1220', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-[1280px] px-4 md:px-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-white mb-2">
                <Logo className="h-5 w-5 text-white" />
                <span className="font-headline font-semibold text-sm">AutosDigital</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                A plataforma de gestão e marketing para revendas de veículos.
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Criar conta</Link>
              <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
              <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
              <span className="hidden md:block">·</span>
              <p>© {new Date().getFullYear()} AutosDigital. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
