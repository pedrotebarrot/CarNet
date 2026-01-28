'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { vehicleMakes, vehicleModels, getYears, VehicleMake } from '@/lib/vehicle-data';
import { getVehicleInfoFromPlate } from '@/ai/flows/get-vehicle-info-from-plate';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const vehicleSchema = z.object({
  plate: z.string().min(7, { message: 'A placa deve ter 7 caracteres.' }).max(7, { message: 'A placa deve ter 7 caracteres.' }),
  make: z.string().min(1, { message: 'Selecione uma marca.' }),
  model: z.string().min(1, { message: 'Selecione um modelo.' }),
  year: z.string().min(4, { message: 'Selecione um ano.' }),
  mileage: z.coerce.number().min(0, { message: 'A quilometragem deve ser um número positivo.' }),
  price: z.coerce.number().min(1, { message: 'O preço deve ser maior que zero.' }),
  description: z.string().optional(),
  status: z.enum(['available', 'sold', 'unavailable']),
  images: z.any().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function AddVehicleForm() {
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      status: 'available',
      mileage: 0,
      price: 0,
      plate: '',
    },
  });

  const selectedMake = form.watch('make') as VehicleMake;
  const plateValue = form.watch('plate');

  useEffect(() => {
    form.resetField('model');
  }, [selectedMake, form]);

  const handlePlateLookup = async () => {
    if (plateValue.length < 7) {
        form.setError('plate', { message: 'A placa deve ter 7 caracteres.' });
        return;
    }
    setIsPlateLoading(true);
    try {
        const result = await getVehicleInfoFromPlate({ plate: plateValue });
        if (result) {
            form.setValue('make', result.make);
            // We need to trigger a re-render or wait for the models to be available
            // A slight delay allows the UI to update with the new make
            setTimeout(() => {
                form.setValue('model', result.model);
            }, 100);
            form.setValue('year', result.year.toString());
            toast({ title: "Veículo encontrado!", description: "Os dados foram preenchidos." });
        } else {
            toast({ title: "Placa não encontrada", description: "Nenhum veículo encontrado para esta placa. Preencha os dados manualmente.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Plate lookup failed", error);
        toast({ title: "Erro na consulta", description: "Não foi possível consultar a placa.", variant: "destructive" });
    } finally {
        setIsPlateLoading(false);
    }
  };


  function onSubmit(data: VehicleFormValues) {
    console.log(data);
    // TODO: Implement submission to Firebase
  }

  const years = getYears();
  const modelsForSelectedMake = selectedMake ? vehicleModels[selectedMake] : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-6">
        <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Placa do Veículo</FormLabel>
                    <div className="flex gap-2">
                        <FormControl>
                            <Input placeholder="ABC1234" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        <Button type="button" variant="secondary" onClick={handlePlateLookup} disabled={isPlateLoading || plateValue.length < 7}>
                            {isPlateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="sr-only">Buscar Placa</span>
                        </Button>
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleMakes.map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedMake}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {modelsForSelectedMake.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quilometragem</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: 15.000 km"
                    value={
                      field.value > 0
                        ? `${new Intl.NumberFormat('pt-BR').format(field.value)} km`
                        : ''
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      field.onChange(rawValue ? parseInt(rawValue, 10) : 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço (R$)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite apenas os números"
                  value={
                    field.value > 0
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(field.value)
                      : ''
                  }
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    field.onChange(rawValue ? parseInt(rawValue, 10) : 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva os principais pontos do veículo..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="sold">Vendido</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="images"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Fotos</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  multiple 
                  onChange={(e) => onChange(e.target.files)}
                  {...rest}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Salvar Veículo</Button>
      </form>
    </Form>
  );
}
