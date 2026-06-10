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
import { Loader2, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import { PLANS } from '@/lib/billing/plans';

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
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const baseSlug = generateSlug(dealershipName);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      let logoUrl: string | null = null;
      if (logoFile) {
        const storageRef = ref(storage, `logos/${uniqueSlug}/${logoFile.name}`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      const dealershipRef = doc(collection(firestore, 'dealerships'));
      const dealershipId = dealershipRef.id;
      const appUrl = window.location.origin;

      // Trial subscription — 14 days starting now. Without this the dealer
      // would land on the dashboard and immediately hit the SubscriptionGuard
      // expired screen because there'd be no subscription record at all.
      const trialDays = PLANS.trial.durationDays;
      const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

      await setDoc(dealershipRef, {
        id: dealershipId, name: dealershipName, slug: uniqueSlug,
        phone, address, logoUrl, ownerId: user.uid, createdAt: new Date(),
        subscription: {
          planId:      'trial',
          status:      'trial',
          startedAt:   new Date(),
          paidUntil:   trialEndsAt,
          trialEndsAt: trialEndsAt,
        },
      });
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid, email: user.email, dealershipId, role: 'admin',
      });

      toast({
        title: '🎉 Conta criada! Seu trial de 14 dias começou.',
        description: `Cadastre seu primeiro carro pra ver ele publicado em ${appUrl}/${uniqueSlug}`,
      });
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
            <p className="mt-1 text-sm" style={{ color: '#45464d' }}>Sua loja na internet em menos de 10 minutos.</p>
          </div>

          {/* Trial benefits banner — sets expectations clearly */}
          <div
            className="mb-6 rounded-lg border p-4"
            style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" style={{ color: '#006d2f' }} />
              <p className="font-headline font-semibold text-sm" style={{ color: '#065f46' }}>
                14 dias grátis pra testar
              </p>
            </div>
            <ul className="space-y-1 text-xs" style={{ color: '#065f46' }}>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Sem cartão de crédito · Sem cobrança automática</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Cadastre carros, publique no OLX e Mercado Livre</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Se gostar, ativa a assinatura via Pix</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dealershipName" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Nome da Revenda</Label>
              <Input id="dealershipName" type="text" placeholder="Minha Revenda de Sucesso" required value={dealershipName} onChange={(e) => setDealershipName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="logo" className="text-sm font-medium" style={{ color: '#0b1c30' }}>Logo da Empresa</Label>
                <span className="text-xs" style={{ color: '#45464d' }}>Opcional — pode adicionar depois</span>
              </div>
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

          <p className="mt-4 text-center text-xs" style={{ color: '#45464d' }}>
            Ao criar sua conta você concorda com os{' '}
            <Link href="/termos" target="_blank" className="underline" style={{ color: '#3980f4' }}>Termos de Uso</Link>
            {' '}e a{' '}
            <Link href="/privacidade" target="_blank" className="underline" style={{ color: '#3980f4' }}>Política de Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
