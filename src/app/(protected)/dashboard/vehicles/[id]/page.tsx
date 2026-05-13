'use client';

import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditVehicleForm } from "@/components/dashboard/edit-vehicle-form";
import { GenerateContentCard } from "@/components/dashboard/generate-content-card";
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';

const statusText = {
  available: 'Disponível',
  sold: 'Vendido',
  unavailable: 'Indisponível',
};

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const vehicleRef = useMemoFirebase(() => doc(firestore, 'vehicles', id), [firestore, id]);
  const { data: vehicle, isLoading } = useDoc(vehicleRef);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Veículo não encontrado.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Voltar ao Estoque</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div className="flex-1 shrink-0 whitespace-nowrap sm:grow-0">
          <h1 className="text-xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-sm text-muted-foreground">{vehicle.plate} • {vehicle.color}</p>
        </div>
        <Badge variant="outline" className="ml-auto sm:ml-0 uppercase text-[10px] font-bold">
          {statusText[vehicle.status as keyof typeof statusText]}
        </Badge>
      </div>

      <EditVehicleForm vehicle={vehicle} />
      <GenerateContentCard vehicle={vehicle} />
    </div>
  );
}
