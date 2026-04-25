import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CarFront, Calendar, Fuel, Gauge, Settings, Palette, CheckCircle2, ArrowLeft } from 'lucide-react';
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
    const q = query(
        collection(firestore, 'dealerships'),
        where('slug', '==', slug),
        limit(1)
    );
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

export default async function VehicleDetailsPage({ params }: { params: Promise<{ slug: string, vehicleId: string }> }) {
    const { slug, vehicleId } = await params;
    const dealership = await getDealership(slug);
    if (!dealership) {
        notFound();
    }

    const vehicle = await getVehicle(vehicleId);
    if (!vehicle || vehicle.dealershipId !== dealership.id) {
        notFound();
    }

    const whatsappText = `Olá! Vi o anúncio do ${vehicle.make} ${vehicle.model} (Placa final ${vehicle.plateEnding}) no site e gostaria de mais informações.`;
    const whatsappLink = `https://wa.me/55${dealership.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header / Hero */}
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full">
                            <Button variant="ghost" size="icon" asChild className="mr-2">
                                <Link href={`/${dealership.slug}`}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            {dealership.logoUrl ? (
                                <div className="h-12 w-12 relative rounded-lg overflow-hidden border">
                                    <img src={dealership.logoUrl} alt={dealership.name} className="object-contain w-full h-full" />
                                </div>
                            ) : (
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-lg">
                                    {dealership.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{dealership.name}</h1>
                                <p className="text-xs text-slate-500">{dealership.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column - Gallery */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border">
                            {vehicle.images && vehicle.images.length > 0 ? (
                                <Carousel className="w-full">
                                    <CarouselContent>
                                        {vehicle.images.map((img: string, index: number) => (
                                            <CarouselItem key={index}>
                                                <div className="aspect-[4/3] md:aspect-video relative rounded-lg overflow-hidden bg-slate-100">
                                                    <img 
                                                        src={img} 
                                                        alt={`${vehicle.make} ${vehicle.model} - Foto ${index + 1}`}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {vehicle.images.length > 1 && (
                                        <>
                                            <CarouselPrevious className="left-4" />
                                            <CarouselNext className="right-4" />
                                        </>
                                    )}
                                </Carousel>
                            ) : (
                                <div className="aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400">
                                    <CarFront className="h-16 w-16 mb-2" />
                                    <p>Sem fotos disponíveis</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {vehicle.description && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h2 className="text-xl font-semibold mb-4">Sobre o Veículo</h2>
                                <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                                    {vehicle.description}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6">
                        <Card className="sticky top-6">
                            <CardContent className="p-6">
                                <div className="mb-2">
                                    <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'} className="mb-2">
                                        {vehicle.status === 'available' ? 'Disponível' : vehicle.status === 'sold' ? 'Vendido' : 'Indisponível'}
                                    </Badge>
                                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                                        {vehicle.make} {vehicle.model}
                                    </h1>
                                </div>
                                
                                <div className="text-3xl font-black text-primary my-6">
                                    R$ {(vehicle.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Ano</p>
                                            <p className="font-semibold">{vehicle.year}/{vehicle.modelYear}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                            <Gauge className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Km</p>
                                            <p className="font-semibold">{vehicle.mileage.toLocaleString()} km</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Câmbio</p>
                                            <p className="font-semibold">{vehicle.transmission}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                            <Fuel className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Combustível</p>
                                            <p className="font-semibold">{vehicle.fuel}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                            <Palette className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Cor</p>
                                            <p className="font-semibold">{vehicle.color}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                            <CarFront className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Portas</p>
                                            <p className="font-semibold">{vehicle.doors}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t">
                                    <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        Final da Placa: <strong className="text-slate-900">{vehicle.plateEnding}</strong>
                                    </p>
                                    <Button 
                                        size="lg" 
                                        className="w-full text-base font-semibold h-14 bg-green-600 hover:bg-green-700" 
                                        asChild
                                    >
                                        <Link href={whatsappLink} target="_blank">
                                            Falar no WhatsApp
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}
