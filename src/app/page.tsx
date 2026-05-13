import Link from 'next/link';
import { LayoutGrid, Sparkles, Car, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';

const features = [
  {
    icon: <LayoutGrid className="h-6 w-6" style={{ color: '#3980f4' }} />,
    title: 'Organização de Estoque',
    description: 'Gerencie seu inventário de veículos de forma simples. Mantenha tudo atualizado com poucos cliques.',
  },
  {
    icon: <Car className="h-6 w-6" style={{ color: '#3980f4' }} />,
    title: 'Site Profissional Automático',
    description: 'Seu estoque vira um site profissional para sua revenda, atualizado em tempo real e sem esforço.',
  },
  {
    icon: <Sparkles className="h-6 w-6" style={{ color: '#3980f4' }} />,
    title: 'Conteúdo com IA',
    description: 'Gere legendas e posts para o Instagram com inteligência artificial, aumentando seu engajamento.',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#f8f9ff', color: '#0b1c30' }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <header style={{ backgroundColor: '#131b2e' }} className="sticky top-0 z-50 shadow-lg">
        <div className="mx-auto max-w-[1280px] px-4 md:px-16 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <Logo className="h-6 w-6 text-white" />
            <span className="font-headline font-semibold text-base">AutosDigital</span>
          </Link>
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
              Começar agora
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="py-24 md:py-36">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16 text-center">
            <span
              className="inline-block font-mono text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded mb-6"
              style={{ backgroundColor: '#eff4ff', color: '#3980f4' }}
            >
              A solução completa para sua revenda
            </span>
            <h1 className="font-headline font-bold text-4xl md:text-[56px] leading-[1.1] tracking-tight max-w-3xl mx-auto" style={{ color: '#0b1c30' }}>
              Organize seu estoque e venda mais
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: '#45464d' }}>
              A AutosDigital simplifica a gestão de veículos, cria seu site automaticamente e gera conteúdo para suas redes sociais.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#006d2f' }}
              >
                Quero testar grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded border px-6 py-3 text-sm font-semibold transition-colors hover:bg-white"
                style={{ borderColor: '#e5eeff', color: '#0b1c30' }}
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section style={{ backgroundColor: '#eff4ff' }} className="py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight" style={{ color: '#0b1c30' }}>
                Tudo que sua revenda precisa para decolar
              </h2>
              <p className="mt-4 text-base" style={{ color: '#45464d' }}>
                Foco no que importa: vender carros. Deixe a tecnologia conosco.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-white p-6"
                  style={{ borderColor: '#e5eeff' }}
                >
                  <div className="mb-4 inline-flex rounded p-2.5" style={{ backgroundColor: '#eff4ff' }}>
                    {feature.icon}
                  </div>
                  <h3 className="font-headline font-semibold text-lg mb-2" style={{ color: '#0b1c30' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#45464d' }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Value prop ────────────────────────────────────────── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16 grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight" style={{ color: '#0b1c30' }}>
                Transforme cada carro do seu pátio em uma oportunidade online
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: '#45464d' }}>
                Com a AutosDigital, cada veículo cadastrado se torna um ativo de marketing. Gere um site profissional e posts para redes sociais em segundos.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { label: 'Site Personalizado', desc: 'Um endereço online para sua revenda, com sua logo e domínio.' },
                  { label: 'Marketing Inteligente', desc: 'Crie posts que atraem clientes sem precisar de uma agência.' },
                  { label: 'Gestão Simplificada', desc: 'Controle seu estoque de forma centralizada e eficiente.' },
                ].map(({ label, desc }) => (
                  <li key={label} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#006d2f' }} />
                    <span className="text-sm leading-relaxed" style={{ color: '#45464d' }}>
                      <strong style={{ color: '#0b1c30' }}>{label}:</strong> {desc}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#131b2e' }}
                >
                  Criar minha conta
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm rounded-lg border overflow-hidden shadow-sm" style={{ borderColor: '#e5eeff' }}>
                <div className="p-4" style={{ backgroundColor: '#131b2e' }}>
                  <div className="flex items-center gap-2">
                    <Logo className="h-5 w-5 text-white" />
                    <span className="font-headline font-semibold text-white text-sm">AutosDigital</span>
                  </div>
                </div>
                <div className="p-4 bg-white space-y-3">
                  {[
                    { make: 'Honda Civic', year: '2023/2024', price: 'R$ 148.000', status: 'Disponível' },
                    { make: 'Toyota Corolla', year: '2022/2023', price: 'R$ 135.000', status: 'Disponível' },
                    { make: 'VW Polo', year: '2024/2024', price: 'R$ 92.000', status: 'Reservado' },
                  ].map((car) => (
                    <div key={car.make} className="flex items-center justify-between rounded border p-3" style={{ borderColor: '#e5eeff' }}>
                      <div>
                        <p className="font-headline font-semibold text-sm" style={{ color: '#0b1c30' }}>{car.make}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: '#45464d' }}>{car.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-bold text-sm" style={{ color: '#0b1c30' }}>{car.price}</p>
                        <span
                          className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                          style={{
                            backgroundColor: car.status === 'Disponível' ? '#eff4ff' : '#fff3cd',
                            color: car.status === 'Disponível' ? '#3980f4' : '#856404',
                          }}
                        >
                          {car.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────── */}
        <section style={{ backgroundColor: '#131b2e' }} className="py-20">
          <div className="mx-auto max-w-[1280px] px-4 md:px-16 text-center">
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-white tracking-tight">
              Pronto para modernizar sua revenda?
            </h2>
            <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Crie sua conta gratuitamente e tenha seu site no ar em minutos.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#006d2f' }}
            >
              Começar agora — é grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t py-6" style={{ backgroundColor: '#131b2e', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto max-w-[1280px] px-4 md:px-16 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Logo className="h-5 w-5 text-white" />
            <span className="font-headline font-semibold text-sm">AutosDigital</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} AutosDigital. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
