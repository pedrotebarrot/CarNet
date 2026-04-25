'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils/slug';
import { Loader2, Upload } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dealershipName, setDealershipName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;
    let exists = true;

    while (exists) {
      const q = query(collection(firestore, 'dealerships'), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        exists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    return slug;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }

    if (!logoFile) {
      toast({ title: 'Logo obrigatória', description: 'Por favor, faça o upload da logo da sua revenda.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Generate Unique Slug
      const baseSlug = generateSlug(dealershipName);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      // 3. Upload Logo
      let logoUrl = '';
      if (logoFile) {
        const storageRef = ref(storage, `logos/${uniqueSlug}/${logoFile.name}`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      // 4. Create dealership
      const dealershipData = {
        name: dealershipName,
        slug: uniqueSlug,
        phone,
        address,
        logoUrl,
        ownerId: user.uid,
        createdAt: new Date(),
      };

      const dealershipRef = await addDoc(collection(firestore, 'dealerships'), dealershipData);
      const dealershipId = dealershipRef.id;

      // Update dealership doc with its own ID
      await setDoc(doc(firestore, 'dealerships', dealershipId), { id: dealershipId }, { merge: true });

      // 5. Create user profile doc
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        dealershipId: dealershipId,
        role: 'admin',
      });

      toast({
        title: 'Conta criada com sucesso!',
        description: `Seu site está pronto em: autosdigital.com/${uniqueSlug}`,
      });

      // 6. Redirect
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
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="mx-auto w-full max-w-md">
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
                <Input
                  id="dealershipName"
                  type="text"
                  placeholder="Minha Revenda de Sucesso"
                  required
                  value={dealershipName}
                  onChange={(e) => setDealershipName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="logo">Logo da Empresa</Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed bg-muted">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain rounded-md" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Celular / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Rua Exemplo, 123 - Centro, Cidade - UF"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Seu E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Sua Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando sua conta...
                  </>
                ) : (
                  'Criar Conta e Gerar Site'
                )}
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
