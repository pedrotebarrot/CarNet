'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;
    let exists = true;
    while (exists) {
      const q = query(collection(firestore, 'dealerships'), where('slug', '==', slug));
      const qs = await getDocs(q);
      if (qs.empty) { exists = false; } else { slug = `${baseSlug}-${counter++}`; }
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const baseSlug = generateSlug(dealershipName);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      const storageRef = ref(storage, `logos/${uniqueSlug}/${logoFile.name}`);
      await uploadBytes(storageRef, logoFile);
      const logoUrl = await getDownloadURL(storageRef);

      const dealershipRef = doc(collection(firestore, 'dealerships'));
      const dealershipId = dealershipRef.id;

      await setDoc(dealershipRef, {
        id: dealershipId, name: dealershipName, slug: uniqueSlug,
        phone, address, logoUrl, ownerId: user.uid, createdAt: new Date(),
      });
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid, email: user.email, dealershipId, role: 'admin',
      });

      toast({ title: 'Conta criada com sucesso!', description: `Seu site está pronto em: autosdigital.com/${uniqueSlug}` });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro ao criar conta', description: error.message || 'Ocorreu um erro.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="flex flex-1 items-start justify-center p-4 py-10">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm" style={{ borderColor: '#e5eeff' }}>

          <div className="mb-6 text-center">
            <h1 className="font-headline font-bold text-2xl" style={{ color: '#0b1c30' }}>Criar sua conta</h1>
            <p className="mt-1 text-sm" style={{ color: '#45464d' }}>Comece a gerenciar sua revenda hoje mesmo.</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dealershipName" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Nome da Revenda</Label>
              <Input id="dealershipName" type="text" placeholder="Minha Revenda de Sucesso" required value={dealershipName} onChange={(e) => setDealershipName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="logo" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded overflow-hidden border border-dashed"
                  style={{ borderColor: '#e5eeff', backgroundColor: '#eff4ff' }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain" />
                  ) : (
                    <Upload className="h-5 w-5" style={{ color: '#45464d' }} />
                  )}
                </div>
                <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="cursor-pointer" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Celular / WhatsApp</Label>
              <Input id="phone" type="tel" placeholder="(11) 99999-9999" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Endereço Completo</Label>
              <Input id="address" type="text" placeholder="Rua Exemplo, 123 - Centro, Cidade - UF" required value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Seu E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Sua Senha</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#006d2f' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando sua conta...
                </>
              ) : 'Criar Conta e Gerar Site'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: '#45464d' }}>
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#3980f4' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
