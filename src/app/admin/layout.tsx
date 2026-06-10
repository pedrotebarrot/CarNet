'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? 'pedrotebarrot08@gmail.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth   = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    const email = (user.email ?? '').toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ backgroundColor: '#f8f9ff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#3980f4' }} />
      </div>
    );
  }

  const email = (user.email ?? '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return null; // router already redirecting
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9ff' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: '#0b1220', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white">
              <Logo className="h-5 w-5" />
              <span className="font-headline font-semibold text-sm">AutosDigital</span>
            </Link>
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded"
              style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <ShieldCheck className="h-3 w-3" />
              Admin
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Link href="/admin/dealerships" className="hover:text-white transition-colors">Revendas</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Voltar ao dashboard</Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email}</span>
            <button
              onClick={async () => { await auth.signOut(); router.push('/login'); }}
              className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 md:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
