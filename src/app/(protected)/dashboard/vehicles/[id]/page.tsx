import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditVehicleForm } from "@/components/dashboard/edit-vehicle-form";

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

async function getVehicleData(id: string) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const docRef = doc(firestore, 'vehicles', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    const serializedData = { ...data };
    
    if (serializedData.createdAt && typeof serializedData.createdAt.toDate === 'function') {
      serializedData.createdAt = serializedData.createdAt.toDate().toISOString();
    }
    if (serializedData.updatedAt && typeof serializedData.updatedAt.toDate === 'function') {
      serializedData.updatedAt = serializedData.updatedAt.toDate().toISOString();
    }

    return { id: docSnap.id, ...serializedData };
}

const statusText = {
  available: 'Disponível',
  sold: 'Vendido',
  unavailable: 'Indisponível',
};

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicleData(id);

  if (!vehicle) {
    notFound();
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
    </div>
  );
}
