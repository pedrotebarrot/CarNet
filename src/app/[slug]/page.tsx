import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { notFound } from 'next/navigation';
import { VehicleGrid } from '@/components/storefront/vehicle-grid';
import { buildBrandPalette, DEFAULT_PALETTE } from '@/lib/utils/colors';

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
                                <p className="text-white/60 text-sm mt-0.5">{dealership.address}</p>
                            )}
                        </div>
                    </div>

                    {whatsappBase && (
                        <a
                            href={whatsappBase}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-white text-sm transition-opacity hover:opacity-90"
                            style={{ backgroundColor: '#006d2f' }}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Falar no WhatsApp
                        </a>
                    )}
                </div>
            </header>

            {/* ── Vehicles Grid ───────────────────────────────────────── */}
            <main className="mx-auto max-w-[1280px] px-4 md:px-16 py-12">
                <VehicleGrid
                    vehicles={vehicles}
                    dealershipSlug={dealership.slug}
                    whatsappBase={whatsappBase}
                    palette={palette}
                />
            </main>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <footer style={{ backgroundColor: palette.header }} className="mt-16 py-8">
                <div className="mx-auto max-w-[1280px] px-4 md:px-16 flex flex-col md:flex-row items-center justify-between gap-2">
                    <p className="text-white/60 text-sm">&copy; {new Date().getFullYear()} {dealership.name}. Todos os direitos reservados.</p>
                    <p className="text-white/40 text-xs">Powered by AutosDigital</p>
                </div>
            </footer>
        </div>
    );
}
