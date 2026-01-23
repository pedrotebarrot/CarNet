'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      // 1. Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create dealership
      const dealershipRef = await addDoc(collection(firestore, 'dealerships'), {
        name: dealershipName,
        createdAt: new Date(),
      });
      const dealershipId = dealershipRef.id;
      
      // Update dealership doc with its own ID
      await setDoc(doc(firestore, 'dealerships', dealershipId), { id: dealershipId, name: dealershipName }, { merge: true });

      // 3. Create user profile doc
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        dealershipId: dealershipId,
        role: 'admin',
      });

      // 4. Redirect
      router.push('/dashboard');

    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Ocorreu um erro.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Link href="/" aria-label="Home">
              <Logo className="h-10 w-10 text-primary" />
            </Link>
          </div>
          <CardTitle className="text-2xl font-headline">Criar sua conta</CardTitle>
          <CardDescription>Comece a gerenciar sua revenda hoje mesmo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dealershipName">Nome da Revenda</Label>
                <Input id="dealershipName" type="text" placeholder="Minha Revenda de Sucesso" required value={dealershipName} onChange={(e) => setDealershipName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Seu E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Sua Senha</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Conta'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link href="/login" className="underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
