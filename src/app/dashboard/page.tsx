import { PlusCircle, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleTable } from '@/components/dashboard/vehicle-table';
import { vehicles } from '@/lib/data';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AddVehicleForm } from '@/components/dashboard/add-vehicle-form';

export default function Dashboard() {
  const availableVehicles = vehicles.filter((v) => v.status === 'available');
  const soldVehicles = vehicles.filter((v) => v.status === 'sold');
  const unavailableVehicles = vehicles.filter((v) => v.status === 'unavailable');

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Estoque de Veículos</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Adicionar Veículo
                </span>
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

      <Tabs defaultValue="available">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="available">Disponíveis</TabsTrigger>
            <TabsTrigger value="sold">Vendidos</TabsTrigger>
            <TabsTrigger value="unavailable">Indisponíveis</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Veículos Disponíveis</CardTitle>
              <CardDescription>
                Gerencie os veículos que estão atualmente à venda.
              </CardDescription>
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
              <CardDescription>
                Histórico de veículos que já foram vendidos.
              </CardDescription>
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
              <CardDescription>
                Veículos que estão temporariamente fora de venda.
              </CardDescription>
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
