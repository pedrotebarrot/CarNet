'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';


export default function LoginPage() {
  const [email, setEmail] = useState('pedrotebarrot08@gmail.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
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
      // The useEffect will handle the redirect
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' && email === 'pedrotebarrot08@gmail.com') {
         // As per requirement, create the user if it doesn't exist.
        try {
            if (password.length < 6) {
                toast({ title: 'Senha muito curta', description: 'A senha de teste deve ter pelo menos 6 caracteres.', variant: 'destructive' });
                setIsLoading(false);
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            const dealershipRef = await addDoc(collection(firestore, 'dealerships'), {
                name: 'Tebarrot Veículos',
                createdAt: new Date(),
            });
            const dealershipId = dealershipRef.id;
            
            await setDoc(doc(firestore, 'dealerships', dealershipId), { id: dealershipId, name: 'Tebarrot Veículos' }, { merge: true });

            await setDoc(doc(firestore, 'users', newUser.uid), {
                id: newUser.uid,
                email: newUser.email,
                dealershipId: dealershipId,
                role: 'admin',
            });
            // Let the useEffect handle redirect
        } catch (signupError: any) {
            toast({ title: 'Erro ao criar usuário de teste', description: signupError.message, variant: 'destructive' });
        }
      } else {
        toast({
            title: 'Erro de Autenticação',
            description: error.message || 'Verifique seu e-mail e senha.',
            variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading || (!isUserLoading && user)) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-secondary">
              <p>Carregando...</p>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Link href="/" aria-label="Home">
              <Logo className="h-10 w-10 text-primary" />
            </Link>
          </div>
          <CardTitle className="text-2xl font-headline">Bem-vindo de volta</CardTitle>
          <CardDescription>Entre com seu e-mail e senha para acessar o painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="#" className="ml-auto inline-block text-sm underline">
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/signup" className="underline">
              Crie agora
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
