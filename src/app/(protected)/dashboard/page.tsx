'use client';

import { useState } from 'react';
import { PlusCircle, File, Loader2, ExternalLink, Copy, Check, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleTable } from '@/components/dashboard/vehicle-table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AddVehicleForm } from '@/components/dashboard/add-vehicle-form';
import { BulkImportForm } from '@/components/dashboard/bulk-import-form';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';

// ── Store link banner ─────────────────────────────────────────────────────────

function StoreLinkBanner({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${slug}`
    : `https://autosdigital.vercel.app/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-lg border px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      style={{ backgroundColor: '#f0f7ff', borderColor: '#c7deff' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: '#3980f4' }}
        >
          <Store className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: '#45464d' }}>Site da sua loja</p>
          <p
            className="font-mono text-sm font-semibold truncate"
            style={{ color: '#1d4ed8' }}
          >
            {storeUrl}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white"
          style={{ borderColor: '#c7deff', color: '#1d4ed8' }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir
        </a>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white transition-all"
          style={{ backgroundColor: copied ? '#006d2f' : '#3980f4' }}
        >
          {copied
            ? <><Check className="h-3.5 w-3.5" /> Copiado!</>
            : <><Copy className="h-3.5 w-3.5" /> Copiar link</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const dealershipRef = useMemoFirebase(() =>
    userData?.dealershipId ? doc(firestore, 'dealerships', userData.dealershipId) : null,
    [userData?.dealershipId, firestore]
  );
  const { data: dealership } = useDoc(dealershipRef);

  const vehiclesQuery = useMemoFirebase(() => {
    if (!userData?.dealershipId) return null;
    return query(
      collection(firestore, 'vehicles'),
      where('dealershipId', '==', userData.dealershipId)
    );
  }, [userData?.dealershipId, firestore]);

  const { data: vehicles, isLoading: isVehiclesLoading } = useCollection(vehiclesQuery);

  const vehicleList = vehicles || [];
  const availableVehicles   = vehicleList.filter((v: any) => v.status === 'available');
  const soldVehicles        = vehicleList.filter((v: any) => v.status === 'sold');
  const unavailableVehicles = vehicleList.filter((v: any) => v.status === 'unavailable');

  if (isUserLoading || (userData?.dealershipId && isVehiclesLoading)) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* ── Store link banner ───────────────────────────────────── */}
      {dealership?.slug && (
        <StoreLinkBanner slug={dealership.slug} />
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Estoque de Veículos</h1>
        <div className="ml-auto flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Importar CSV</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-2xl w-[90vw] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Importar Veículos</SheetTitle>
                <SheetDescription>
                  Faça o upload de uma planilha CSV para cadastrar vários veículos de uma vez.
                </SheetDescription>
              </SheetHeader>
              <BulkImportForm />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Adicionar Veículo</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl w-[80vw] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Adicionar Novo Veículo</SheetTitle>
                <SheetDescription>
                  Preencha os detalhes do veículo para adicioná-lo ao seu estoque.
                </SheetDescription>
              </SheetHeader>
              <AddVehicleForm />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="available">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="available">Disponíveis ({availableVehicles.length})</TabsTrigger>
            <TabsTrigger value="sold">Vendidos ({soldVehicles.length})</TabsTrigger>
            <TabsTrigger value="unavailable">Indisponíveis ({unavailableVehicles.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Veículos Disponíveis</CardTitle>
              <CardDescription>Gerencie os veículos que estão atualmente à venda.</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleTable vehicles={availableVehicles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sold">
          <Card>
            <CardHeader>
              <CardTitle>Veículos Vendidos</CardTitle>
              <CardDescription>Histórico de veículos que já foram vendidos.</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleTable vehicles={soldVehicles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unavailable">
          <Card>
            <CardHeader>
              <CardTitle>Veículos Indisponíveis</CardTitle>
              <CardDescription>Veículos que estão temporariamente fora de venda.</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleTable vehicles={unavailableVehicles} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
