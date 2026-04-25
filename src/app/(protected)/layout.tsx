'use client';

import { useAuth, useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    User
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, router]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-6 w-6" />
                    <span className="">Revenda Digital</span>
                </Link>
                <nav className="ml-10 flex items-center gap-6">
                    <Link
                        href="/dashboard"
                        className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/settings"
                        className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        Configurações
                    </Link>
                </nav>
                <div className="ml-auto flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <User className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings">Configurações</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="container py-6">
                {children}
            </main>
        </div>
    );
}
