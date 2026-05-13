'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let description = 'Verifique seu e-mail e senha.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'Muitas tentativas. Tente novamente mais tarde.';
      }
      toast({ title: 'Erro de Autenticação', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#f8f9ff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#3980f4' }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#f8f9ff' }}>

      {/* Header */}
      <header style={{ backgroundColor: '#131b2e' }} className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2 text-white">
          <Logo className="h-6 w-6 text-white" />
          <span className="font-headline font-semibold text-base">AutosDigital</span>
        </Link>
      </header>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm" style={{ borderColor: '#e5eeff' }}>

          <div className="mb-6 text-center">
            <h1 className="font-headline font-bold text-2xl" style={{ color: '#0b1c30' }}>Bem-vindo de volta</h1>
            <p className="mt-1 text-sm" style={{ color: '#45464d' }}>Entre com seu e-mail e senha para acessar o painel.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#0b1c30' }}>E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Senha</Label>
                <Link href="#" className="text-xs" style={{ color: '#3980f4' }}>
                  Esqueceu sua senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#131b2e' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : 'Entrar'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: '#45464d' }}>
            Não tem uma conta?{' '}
            <Link href="/signup" className="font-semibold" style={{ color: '#3980f4' }}>
              Crie agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
