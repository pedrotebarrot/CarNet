import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Users, Sparkles, Car } from 'lucide-react';
import { Logo } from '@/components/logo';

const features = [
  {
    icon: <LayoutGrid className="h-8 w-8 text-primary" />,
    title: 'Organização de Estoque',
    description: 'Gerencie seu inventário de veículos de forma simples e intuitiva. Mantenha tudo atualizado com poucos cliques.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Presença Digital Automática',
    description: 'Seu estoque é transformado em um site profissional para sua revenda, atualizado em tempo real e sem esforço.',
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'Conteúdo para Redes Sociais',
    description: 'Gere legendas e posts para o Instagram com inteligência artificial, aumentando seu engajamento e vendas.',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold">Revenda Digital</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium"></nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Começar agora</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container text-center">
            <div
              className="mx-auto mb-6 inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium"
            >
              A solução completa para sua revenda
            </div>
            <h1 className="text-4xl font-headline font-bold tracking-tight md:text-6xl">
              Organize seu estoque e venda mais
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              A Revenda Digital é a plataforma que simplifica a gestão de veículos, cria seu site automaticamente e gera conteúdo para suas redes sociais.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/login">Quero testar</Link>
              </Button>
              <Button size="lg" variant="outline">
                Saber mais
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-32 bg-secondary">
          <div className="container">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <h2 className="text-3xl font-headline font-bold tracking-tight md:text-4xl">
                Tudo que sua revenda precisa para decolar no digital
              </h2>
              <p className="mt-4 text-muted-foreground">
                Foco no que importa: vender carros. Deixe a tecnologia conosco.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32">
          <div className="container grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-tight md:text-4xl">
                Transforme cada carro do seu pátio em uma oportunidade online
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Com a Revenda Digital, cada veículo cadastrado se torna um ativo de marketing. Gere um site profissional e posts para redes sociais com um único clique.
              </p>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <Car className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span><strong>Site Personalizado:</strong> Um endereço online para sua revenda, com sua logo e cores.</span>
                </li>
                <li className="flex items-start">
                  <Sparkles className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span><strong>Marketing Inteligente:</strong> Crie posts que atraem clientes sem precisar de uma agência.</span>
                </li>
                <li className="flex items-start">
                  <LayoutGrid className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span><strong>Gestão Simplificada:</strong> Dê adeus às planilhas. Controle seu estoque de forma centralizada e eficiente.</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
                <img
                    data-ai-hint="dashboard screenshot"
                    src="https://picsum.photos/seed/dashboard-ui/600/450"
                    alt="Dashboard da Revenda Digital"
                    className="rounded-lg shadow-2xl"
                />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <p className="text-sm font-medium">Revenda Digital</p>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Revenda Digital. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
