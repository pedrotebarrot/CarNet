'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Car, Menu, Settings, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userData } = useDoc(userDocRef);

  const dealershipDocRef = useMemoFirebase(() =>
    userData?.dealershipId ? doc(firestore, 'dealerships', userData.dealershipId) : null,
    [userData?.dealershipId, firestore]
  );
  const { data: dealershipData } = useDoc(dealershipDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ backgroundColor: '#f8f9ff' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#3980f4' }} />
      </div>
    );
  }

  const sidebarNav = (
    <>
      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.85)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Car className="h-4 w-4 shrink-0" />
        Estoque de Veículos
      </Link>
      <Link
        href="/dashboard/settings"
        className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.7)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Settings className="h-4 w-4 shrink-0" />
        Configurações
      </Link>
    </>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col" style={{ backgroundColor: '#131b2e' }}>
        <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <Logo className="h-6 w-6 text-white" />
            <span className="font-headline text-base">AutosDigital</span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-1 px-2 py-4 lg:px-4">
          <nav className="flex flex-col gap-1">
            {sidebarNav}
          </nav>

          {dealershipData?.slug && (
            <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Meu Site
              </p>
              <a
                href={`/${dealershipData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: '#3980f4' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(57,128,244,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                Visualizar Site
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex flex-col">
        <header
          className="flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6"
          style={{ backgroundColor: '#131b2e', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden text-white hover:bg-white/10 hover:text-white">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0" style={{ backgroundColor: '#131b2e', border: 'none' }}>
              <div className="flex h-14 items-center px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Link href="/" className="flex items-center gap-2 font-semibold text-white">
                  <Logo className="h-6 w-6 text-white" />
                  <span className="font-headline text-base">AutosDigital</span>
                </Link>
              </div>
              <nav className="flex flex-col gap-1 px-3 py-4">
                {sidebarNav}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt="Avatar" />
                  <AvatarFallback style={{ backgroundColor: '#3980f4', color: '#fff' }}>
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6" style={{ backgroundColor: '#f8f9ff' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
