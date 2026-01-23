import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Calendar, Gauge, DollarSign, Tag, FileText } from "lucide-react";
import { vehicles, type Vehicle } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { GenerateContentCard } from "@/components/dashboard/generate-content-card";


const getVehicle = (id: string): Vehicle | undefined => {
  return vehicles.find((v) => v.id === id);
}

const statusText = {
  available: 'Disponível',
  sold: 'Vendido',
  unavailable: 'Indisponível',
};

const VehicleStat = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex items-center gap-3 rounded-lg border bg-background p-4">
        <div className="text-primary">{icon}</div>
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
        </div>
    </div>
)

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = getVehicle(params.id);

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
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {vehicle.make} {vehicle.model}
        </h1>
        <Badge variant="outline" className="ml-auto sm:ml-0">
          {statusText[vehicle.status]}
        </Badge>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm">
            Descartar
          </Button>
          <Button size="sm">Salvar</Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardContent className="p-4">
                    <Carousel className="w-full">
                        <CarouselContent>
                            {vehicle.images.map((img, index) => (
                            <CarouselItem key={index}>
                                <Image
                                    src={img}
                                    alt={`${vehicle.make} ${vehicle.model} - Foto ${index + 1}`}
                                    width={800}
                                    height={600}
                                    className="aspect-video w-full rounded-lg object-cover"
                                    data-ai-hint="car"
                                />
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-4" />
                        <CarouselNext className="right-4"/>
                    </Carousel>
                </CardContent>
            </Card>
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{vehicle.description}</p>
                </CardContent>
            </Card>
        </div>
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Detalhes do Veículo</CardTitle>
                    <CardDescription>Informações principais e valores.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <VehicleStat icon={<DollarSign size={24}/>} label="Preço" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vehicle.price)} />
                    <VehicleStat icon={<Gauge size={24}/>} label="Quilometragem" value={`${new Intl.NumberFormat('pt-BR').format(vehicle.mileage)} km`} />
                    <VehicleStat icon={<Calendar size={24}/>} label="Ano" value={vehicle.year} />
                    <VehicleStat icon={<Tag size={24}/>} label="Marca / Modelo" value={`${vehicle.make} ${vehicle.model}`} />
                </CardContent>
            </Card>

            <GenerateContentCard vehicle={vehicle} />

        </div>
      </div>
    </div>
  );
}
