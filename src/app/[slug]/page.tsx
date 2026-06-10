import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { notFound } from 'next/navigation';
import { VehicleGrid } from '@/components/storefront/vehicle-grid';
import { buildBrandPalette, DEFAULT_PALETTE } from '@/lib/utils/colors';
import { MapPin, Phone, Clock, ShieldCheck, Car, Sparkles } from 'lucide-react';

export const revalidate = 300;

async function getDealership(slug: string) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const q = query(collection(firestore, 'dealerships'), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
}

async function getVehicles(dealershipId: string) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const q = query(
        collection(firestore, 'vehicles'),
        where('dealershipId', '==', dealershipId),
        where('status', '==', 'available')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
}

function formatPhoneBR(phone?: string): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return phone;
}

export default async function DealershipPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const dealership = await getDealership(slug);
    if (!dealership) notFound();

    const vehicles = await getVehicles(dealership.id);
    const whatsappBase = dealership.phone
        ? `https://wa.me/55${dealership.phone.replace(/\D/g, '')}`
        : null;

    const palette = dealership.brandColors?.primary
        ? buildBrandPalette(dealership.brandColors.primary)
        : DEFAULT_PALETTE;

    // ── Compute display stats from real inventory ──────────────────────
    const totalCars = vehicles.length;
    const brands    = Array.from(new Set(vehicles.map(v => v.make).filter(Boolean)));
    const minYear   = vehicles.length ? Math.min(...vehicles.map(v => v.modelYear ?? v.year ?? 9999)) : null;
    const maxYear   = vehicles.length ? Math.max(...vehicles.map(v => v.modelYear ?? v.year ?? 0))    : null;

    const phoneFmt = formatPhoneBR(dealership.phone);

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f8f9ff', color: '#0b1c30' }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <header style={{ backgroundColor: palette.header }} className="sticky top-0 z-50 shadow-lg">
                <div className="mx-auto max-w-[1280px] px-4 md:px-16 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        {dealership.logoUrl ? (
                            <div className="h-12 w-12 rounded-lg overflow-hidden border border-white/20 shrink-0">
                                <img src={dealership.logoUrl} alt={dealership.name} className="w-full h-full object-contain bg-white/10" />
                            </div>
                        ) : (
                            <div className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: palette.primary }}>
                                {dealership.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="font-headline font-bold text-white text-xl leading-tight">{dealership.name}</h1>
                            {dealership.address && (
                                <p className="text-white/60 text-sm mt-0.5 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {dealership.city || dealership.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {whatsappBase && (
                        <a
                            href={whatsappBase}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#25d366' }}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Falar no WhatsApp
                        </a>
                    )}
                </div>
            </header>

            {/* ── Hero ───────────────────────────────────────────────── */}
            <section
                className="relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${palette.header} 0%, ${palette.primary}30 100%)`,
                }}
            >
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="relative mx-auto max-w-[1280px] px-4 md:px-16 py-14 md:py-20">
                    <div className="max-w-2xl">
                        <span
                            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
                            style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            <Sparkles className="h-3 w-3" />
                            Estoque atualizado em tempo real
                        </span>

                        <h2 className="font-headline font-bold text-white text-3xl md:text-5xl leading-tight tracking-tight mb-4">
                            {totalCars > 0
                                ? <>Encontre seu próximo carro</>
                                : <>Em breve, novos carros</>}
                        </h2>
                        <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-xl">
                            {totalCars > 0
                                ? <>
                                    <strong>{totalCars}</strong> {totalCars === 1 ? 'veículo disponível' : 'veículos disponíveis'} agora
                                    {brands.length > 0 && <> · {brands.length} {brands.length === 1 ? 'marca' : 'marcas'}</>}
                                    {minYear && maxYear && <> · de {minYear} a {maxYear}</>}.
                                </>
                                : <>Estamos preparando o melhor estoque pra você. Volte em breve ou fale com a gente no WhatsApp.</>}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Trust strip ────────────────────────────────────────── */}
            {totalCars > 0 && (
                <div className="border-y bg-white" style={{ borderColor: '#e5eeff' }}>
                    <div className="mx-auto max-w-[1280px] px-4 md:px-16 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: <Car className="h-4 w-4" />,         label: 'Estoque próprio' },
                            { icon: <ShieldCheck className="h-4 w-4" />,  label: 'Procedência garantida' },
                            { icon: <Phone className="h-4 w-4" />,        label: 'Atendimento humano' },
                            { icon: <MapPin className="h-4 w-4" />,       label: 'Test drive na loja' },
                        ].map(t => (
                            <div key={t.label} className="flex items-center gap-2 text-sm" style={{ color: '#0b1c30' }}>
                                <span style={{ color: palette.primary }}>{t.icon}</span>
                                <span className="font-medium">{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Vehicles Grid ───────────────────────────────────────── */}
            <main className="mx-auto max-w-[1280px] px-4 md:px-16 py-12">
                <VehicleGrid
                    vehicles={vehicles}
                    dealershipSlug={dealership.slug}
                    whatsappBase={whatsappBase}
                    palette={palette}
                />
            </main>

            {/* ── Contact section ─────────────────────────────────────── */}
            <section className="border-t" style={{ borderColor: '#e5eeff', backgroundColor: '#fff' }}>
                <div className="mx-auto max-w-[1280px] px-4 md:px-16 py-10 md:py-14">
                    <div className="grid md:grid-cols-2 gap-10 items-start">
                        <div>
                            <h3 className="font-headline font-bold text-2xl md:text-3xl mb-3" style={{ color: '#0b1c30' }}>
                                Venha conhecer a {dealership.name}
                            </h3>
                            <p className="text-base leading-relaxed mb-6" style={{ color: '#45464d' }}>
                                Estamos prontos pra te receber. Vem fazer um test drive, tirar dúvidas, ou simplesmente conversar sobre o seu próximo carro.
                            </p>
                            {whatsappBase && (
                                <a
                                    href={whatsappBase}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: '#25d366' }}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Falar no WhatsApp
                                </a>
                            )}
                        </div>

                        <div className="space-y-4">
                            {dealership.address && (
                                <div className="flex items-start gap-3 rounded-lg border p-4" style={{ borderColor: '#e5eeff' }}>
                                    <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: palette.primary }} />
                                    <div>
                                        <p className="text-xs font-mono uppercase tracking-wider mb-0.5" style={{ color: '#45464d' }}>Endereço</p>
                                        <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>{dealership.address}</p>
                                    </div>
                                </div>
                            )}

                            {phoneFmt && (
                                <a
                                    href={whatsappBase ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-[#f0fdf4]"
                                    style={{ borderColor: '#e5eeff' }}
                                >
                                    <Phone className="h-5 w-5 mt-0.5 shrink-0" style={{ color: palette.primary }} />
                                    <div>
                                        <p className="text-xs font-mono uppercase tracking-wider mb-0.5" style={{ color: '#45464d' }}>Telefone / WhatsApp</p>
                                        <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>{phoneFmt}</p>
                                    </div>
                                </a>
                            )}

                            <div className="flex items-start gap-3 rounded-lg border p-4" style={{ borderColor: '#e5eeff' }}>
                                <Clock className="h-5 w-5 mt-0.5 shrink-0" style={{ color: palette.primary }} />
                                <div>
                                    <p className="text-xs font-mono uppercase tracking-wider mb-0.5" style={{ color: '#45464d' }}>Atendimento</p>
                                    <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>Segunda a sábado · 8h às 18h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <footer style={{ backgroundColor: palette.header }} className="py-8">
                <div className="mx-auto max-w-[1280px] px-4 md:px-16 flex flex-col md:flex-row items-center justify-between gap-2">
                    <p className="text-white/60 text-sm">© {new Date().getFullYear()} {dealership.name}. Todos os direitos reservados.</p>
                    <a href="/" className="text-white/40 text-xs hover:text-white/60 transition-colors">
                        Powered by AutosDigital
                    </a>
                </div>
            </footer>
        </div>
    );
}
