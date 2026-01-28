import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Calendar, Gauge, DollarSign, Tag, FileText, Fingerprint, Wrench, Cog } from "lucide-react";
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
    <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
        <div className="text-primary">{icon}</div>
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-md font-semibold">{value}</div>
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
        <div className="flex-1 shrink-0 whitespace-nowrap sm:grow-0">
            <h1 className="text-xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-sm text-muted-foreground">{vehicle.version}</p>
        </div>
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
                <CardContent className="grid gap-3">
                    <VehicleStat icon={<DollarSign size={20}/>} label="Preço" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vehicle.price)} />
                    <VehicleStat icon={<Gauge size={20}/>} label="Quilometragem" value={`${new Intl.NumberFormat('pt-BR').format(vehicle.mileage)} km`} />
                    <VehicleStat icon={<Calendar size={20}/>} label="Ano Fabricação / Modelo" value={`${vehicle.year} / ${vehicle.modelYear}`} />
                    <VehicleStat icon={<Tag size={20}/>} label="Marca / Modelo" value={`${vehicle.make} ${vehicle.model}`} />
                    <VehicleStat icon={<Cog size={20}/>} label="Versão" value={vehicle.version} />
                    <VehicleStat icon={<Wrench size={20}/>} label="Motor" value={vehicle.engine} />
                    <VehicleStat icon={<Fingerprint size={20}/>} label="Placa" value={vehicle.plate} />
                </CardContent>
            </Card>

            <GenerateContentCard vehicle={vehicle} />

        </div>
      </div>
    </div>
  );
}
