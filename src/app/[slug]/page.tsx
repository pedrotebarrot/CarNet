import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CarFront, Calendar, Fuel, Gauge } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 300; // Revalidate every 5 minutes

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

    if (!dealership) {
        notFound();
    }

    // Busca os veículos em paralelo para não bloquear o render
    const [vehicles] = await Promise.all([
        getVehicles(dealership.id),
    ]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header / Hero */}
            <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {dealership.logoUrl ? (
                                <div className="h-16 w-16 relative rounded-lg overflow-hidden border">
                                    <img src={dealership.logoUrl} alt={dealership.name} className="object-contain w-full h-full" />
                                </div>
                            ) : (
                                <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl">
                                    {dealership.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{dealership.name}</h1>
                                {dealership.address && <p className="text-sm text-slate-500">{dealership.address}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {dealership.phone && (
                            <Button asChild variant="default">
                                <Link href={`https://wa.me/55${dealership.phone.replace(/\D/g, '')}`} target="_blank">
                                    Falar no WhatsApp
                                </Link>
                            </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-slate-800">Veículos em Destaque</h2>
                    <p className="text-slate-500">Confira nosso estoque atualizado.</p>
                </div>

                {vehicles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg border shadow-sm">
                        <CarFront className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Nenhum veículo encontrado</h3>
                        <p className="text-slate-500">Nosso estoque está sendo atualizado. Volte em breve!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {vehicles.map((vehicle) => (
                            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all flex flex-col group">
                                <Link href={`/${dealership.slug}/${vehicle.id}`} className="flex flex-col flex-1">
                                    <div className="aspect-video relative bg-slate-100 overflow-hidden">
                                        {vehicle.images && vehicle.images.length > 0 ? (
                                            <img
                                                src={vehicle.images[0]}
                                                alt={`${vehicle.make} ${vehicle.model}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400">
                                            <CarFront className="h-12 w-12" />
                                        </div>
                                    )}
                                    <Badge variant="secondary" className="absolute top-2 right-2 backdrop-blur-md bg-white/90">
                                        {vehicle.year}/{vehicle.modelYear}
                                    </Badge>
                                </div>

                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{vehicle.make} {vehicle.model}</CardTitle>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-primary mt-2">
                                        R$ {(vehicle.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </h3>
                                </CardHeader>

                                <CardContent className="p-4 pt-0">
                                    <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Ano</span>
                                            <span className="font-medium">{vehicle.year}/{vehicle.modelYear}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Km</span>
                                            <span className="font-medium">{vehicle.mileage.toLocaleString()} km</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Câmbio</span>
                                            <span className="font-medium">{vehicle.transmission}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Combustível</span>
                                            <span className="font-medium">{vehicle.fuel}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Cor</span>
                                            <span className="font-medium">{vehicle.color}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400">Portas</span>
                                            <span className="font-medium">{vehicle.doors}</span>
                                        </div>
                                        <div className="flex flex-col col-span-2">
                                            <span className="text-xs text-slate-400">Final da Placa</span>
                                            <span className="font-medium">{vehicle.plateEnding}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                </Link>

                                <CardFooter className="p-4 pt-2 border-t bg-slate-50 mt-auto relative z-10">
                                    <Button className="w-full" asChild variant="outline">
                                        <Link
                                            href={`https://wa.me/55${dealership.phone.replace(/\D/g, '')}?text=Olá! Vi o anuncio do ${vehicle.make} ${vehicle.model} no site e gostaria de mais informações.`}
                                            target="_blank"
                                        >
                                            Tenho Interesse
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <p>&copy; {new Date().getFullYear()} {dealership.name}. Todos os direitos reservados.</p>
                    <p className="text-sm mt-2">Powered by AutoDigital</p>
                </div>
            </footer>
        </div>
    );
}
