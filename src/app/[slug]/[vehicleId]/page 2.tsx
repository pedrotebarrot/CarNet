import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { notFound } from 'next/navigation';
import { ArrowLeft, Gauge, Fuel, Settings2, CalendarDays, Palette, DoorOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export const revalidate = 60;

async function getDealership(slug: string) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const q = query(collection(firestore, 'dealerships'), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
}

async function getVehicle(vehicleId: string) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const docRef = doc(firestore, 'vehicles', vehicleId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as any;
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cents / 100);
}

function formatMileage(km: number) {
    return new Intl.NumberFormat('pt-BR').format(km);
}

const specs = (vehicle: any) => [
    { icon: CalendarDays, label: 'Ano', value: `${vehicle.year}/${vehicle.modelYear}` },
    { icon: Gauge,        label: 'Quilometragem', value: `${formatMileage(vehicle.mileage)} km` },
    { icon: Settings2,    label: 'Câmbio', value: vehicle.transmission },
    { icon: Fuel,         label: 'Combustível', value: vehicle.fuel },
    { icon: Palette,      label: 'Cor', value: vehicle.color },
    { icon: DoorOpen,     label: 'Portas', value: `${vehicle.doors}` },
];

export default async function VehicleDetailsPage({ params }: { params: Promise<{ slug: string; vehicleId: string }> }) {
    const { slug, vehicleId } = await params;
    const dealership = await getDealership(slug);
    if (!dealership) notFound();

    const vehicle = await getVehicle(vehicleId);
    if (!vehicle || vehicle.dealershipId !== dealership.id) notFound();

    const whatsappText = `Olá! Vi o anúncio do ${vehicle.make} ${vehicle.model} (Placa final ${vehicle.plateEnding}) no site e gostaria de mais informações.`;
    const whatsappLink = dealership.phone
        ? `https://wa.me/55${dealership.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`
        : null;

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f8f9ff', color: '#0b1c30' }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <header style={{ backgroundColor: '#131b2e' }} className="sticky top-0 z-50 shadow-lg">
                <div className="mx-auto max-w-[1280px] px-4 md:px-16 py-4 flex items-center gap-4">
                    <Link
                        href={`/${dealership.slug}`}
                        className="flex items-center justify-center w-9 h-9 rounded border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>

                    {dealership.logoUrl ? (
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/20 shrink-0">
                            <img src={dealership.logoUrl} alt={dealership.name} className="w-full h-full object-contain bg-white/10" />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: '#3980f4' }}>
                            {dealership.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <p className="font-headline font-semibold text-white truncate">{dealership.name}</p>
                        {dealership.phone && (
                            <p className="text-white/50 text-xs">{dealership.phone}</p>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1280px] px-4 md:px-16 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* ── Left: Gallery + Description ────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Gallery */}
                        <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: '#e5eeff' }}>
                            {vehicle.images?.length > 0 ? (
                                <Carousel className="w-full">
                                    <CarouselContent>
                                        {vehicle.images.map((img: string, i: number) => (
                                            <CarouselItem key={i}>
                                                <div className="aspect-[4/3] md:aspect-video bg-[#e5eeff]">
                                                    <img
                                                        src={img}
                                                        alt={`${vehicle.make} ${vehicle.model} — foto ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {vehicle.images.length > 1 && (
                                        <>
                                            <CarouselPrevious className="left-3" />
                                            <CarouselNext className="right-3" />
                                        </>
                                    )}
                                </Carousel>
                            ) : (
                                <div className="aspect-video bg-[#e5eeff] flex items-center justify-center" style={{ color: '#45464d' }}>
                                    <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17l-2-2m0 0l-2-2m2 2l2-2m0 0l2-2M3 9l1-4h16l1 4M3 9h18M5 9v8a2 2 0 002 2h10a2 2 0 002-2V9" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Specs table */}
                        <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e5eeff' }}>
                            <h2 className="font-headline font-semibold text-lg mb-4" style={{ color: '#0b1c30' }}>Especificações</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {specs(vehicle).map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-3">
                                        <div className="mt-0.5 p-2 rounded" style={{ backgroundColor: '#eff4ff' }}>
                                            <Icon className="w-4 h-4" style={{ color: '#3980f4' }} />
                                        </div>
                                        <div>
                                            <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#45464d' }}>{label}</p>
                                            <p className="font-semibold text-sm mt-0.5" style={{ color: '#0b1c30' }}>{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        {vehicle.description && (
                            <div className="bg-white rounded-lg border p-6" style={{ borderColor: '#e5eeff' }}>
                                <h2 className="font-headline font-semibold text-lg mb-3" style={{ color: '#0b1c30' }}>Sobre o veículo</h2>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#45464d' }}>
                                    {vehicle.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Price card (sticky) ──────────────────── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white rounded-lg border p-6 space-y-5" style={{ borderColor: '#e5eeff' }}>
                            <div>
                                <span
                                    className="inline-block font-mono text-[10px] font-medium px-2 py-1 rounded-sm uppercase tracking-wider mb-3"
                                    style={{ backgroundColor: '#eff4ff', color: '#3980f4' }}
                                >
                                    Disponível
                                </span>
                                <h1 className="font-headline font-bold text-2xl leading-tight" style={{ color: '#0b1c30' }}>
                                    {vehicle.make} {vehicle.model}
                                </h1>
                                <p className="font-mono text-xs mt-1 uppercase tracking-wide" style={{ color: '#45464d' }}>
                                    {vehicle.year}/{vehicle.modelYear} · {vehicle.color} · {vehicle.doors}P
                                </p>
                            </div>

                            <div className="py-4 border-y" style={{ borderColor: '#e5eeff' }}>
                                <p className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: '#45464d' }}>Preço</p>
                                <p className="font-headline font-bold text-3xl" style={{ color: '#0b1c30' }}>
                                    {formatPrice(vehicle.price)}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-sm" style={{ color: '#45464d' }}>
                                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#006d2f' }} />
                                <span>Final da placa: <strong style={{ color: '#0b1c30' }}>{vehicle.plateEnding}</strong></span>
                            </div>

                            {whatsappLink ? (
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded font-semibold text-white transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: '#006d2f' }}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Falar no WhatsApp
                                </a>
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-3.5 rounded font-semibold text-white/50 cursor-not-allowed"
                                    style={{ backgroundColor: '#45464d' }}
                                >
                                    WhatsApp não disponível
                                </button>
                            )}

                            <p className="text-center font-mono text-[10px] uppercase tracking-wider" style={{ color: '#45464d' }}>
                                Em {dealership.name}
                            </p>
                        </div>
                    </div>

                </div>
            </main>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <footer style={{ backgroundColor: '#131b2e' }} className="mt-16 py-8">
                <div className="mx-auto max-w-[1280px] px-4 md:px-16 flex flex-col md:flex-row items-center justify-between gap-2">
                    <p className="text-white/60 text-sm">&copy; {new Date().getFullYear()} {dealership.name}. Todos os direitos reservados.</p>
                    <p className="text-white/40 text-xs">Powered by AutosDigital</p>
                </div>
            </footer>
        </div>
    );
}
