'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { vehicleMakes, vehicleModels, getYears, VehicleMake, vehicleTransmissions } from '@/lib/vehicle-data';
import { getVehicleInfoFromPlate } from '@/ai/flows/get-vehicle-info-from-plate';
import { generateInstagramCaption } from '@/ai/flows/generate-instagram-caption';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useUser, useFirestore, useStorage, useDoc } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const vehicleSchema = z.object({
  plate: z.string().min(7, { message: 'A placa deve ter 7 caracteres.' }).max(7, { message: 'A placa deve ter 7 caracteres.' }),
  plateEnding: z.string().min(1, { message: 'Final da placa obrigatório' }),
  make: z.string().min(1, { message: 'Selecione uma marca.' }),
  model: z.string().min(1, { message: 'Digite o modelo.' }),
  year: z.string().min(4, { message: 'Selecione o ano de fabricação.' }),
  modelYear: z.string().min(4, { message: 'Selecione o ano do modelo.' }),
  color: z.string().min(1, { message: 'Digite a cor do veículo.' }),
  doors: z.coerce.number().min(2, { message: 'Mínimo de 2 portas.' }),
  fuel: z.string().min(1, { message: 'Digite o combustível.' }),
  transmission: z.string().min(1, { message: 'Selecione o câmbio.' }),
  mileage: z.coerce.number().min(0, { message: 'A quilometragem deve ser um número positivo.' }),
  price: z.coerce.number().min(1, { message: 'O preço deve ser maior que zero.' }),
  description: z.string().optional(),
  status: z.enum(['available', 'sold', 'unavailable']),
  images: z.any().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function AddVehicleForm() {
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();

  const userDocRef = useMemo(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );

  const { data: userData } = useDoc(userDocRef);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      status: 'available',
      mileage: 0,
      price: 0,
      plate: '',
      plateEnding: '',
      make: '',
      model: '',
      year: '',
      modelYear: '',
      color: '',
      doors: 4,
      fuel: '',
      transmission: '',
      description: '',
    },
  });

  const selectedMake = form.watch('make') as VehicleMake;
  const plateValue = form.watch('plate');

  const handlePlateLookup = async () => {
    if (plateValue.length < 7 || isPlateLoading) return;

    setIsPlateLoading(true);
    form.clearErrors('plate');
    try {
      const result = await getVehicleInfoFromPlate({ plate: plateValue });
      if (result) {
        form.setValue('make', result.make, { shouldValidate: true });
        form.setValue('model', result.model, { shouldValidate: true });
        form.setValue('year', result.year.toString(), { shouldValidate: true });
        form.setValue('modelYear', result.modelYear.toString(), { shouldValidate: true });
        form.setValue('color', result.color, { shouldValidate: true });
        form.setValue('fuel', result.fuel, { shouldValidate: true });
        form.setValue('doors', result.doors, { shouldValidate: true });
        form.setValue('transmission', result.transmission, { shouldValidate: true });
        form.setValue('plateEnding', result.plateEnding, { shouldValidate: true });
        toast({ title: "Veículo encontrado!", description: "Dados técnicos preenchidos." });
      } else {
        toast({ title: "Placa não encontrada", description: "Preencha os dados manualmente.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Plate lookup failed", error);
      toast({ title: "Erro na consulta", description: "Não foi possível consultar a placa. Tente novamente.", variant: "destructive" });
    } finally {
      setIsPlateLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    const values = form.getValues();
    if (!values.make || !values.model) {
      toast({ title: "Atenção", description: "Busque a placa ou preencha a marca/modelo antes de gerar a descrição.", variant: "default" });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const aiResult = await generateInstagramCaption({
        make: values.make,
        model: values.model,
        year: parseInt(values.year) || 0,
        modelYear: parseInt(values.modelYear) || 0,
        fuel: values.fuel,
        doors: values.doors,
        color: values.color,
        transmission: values.transmission,
        plateEnding: values.plateEnding,
        mileage: values.mileage,
        price: values.price,
        description: values.description || '',
      });
      form.setValue('description', aiResult.caption, { shouldValidate: true });
      toast({ title: "Descrição gerada!", description: "O texto foi criado com base nos dados do veículo." });
    } catch (error) {
      console.error('AI description generation failed:', error);
      toast({ title: "Erro na IA", description: "Não foi possível gerar a descrição. Tente novamente.", variant: "destructive" });
    } finally {
      setIsGeneratingDescription(false);
    }
  };


  async function onSubmit(data: VehicleFormValues) {
    if (!userData?.dealershipId) {
      toast({ title: "Erro", description: "Revenda não identificada.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload images
      const imageUrls = [];
      if (data.images && data.images.length > 0) {
        for (let i = 0; i < data.images.length; i++) {
          const file = data.images[i];
          const storageRef = ref(storage, `vehicles/${userData.dealershipId}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      await addDoc(collection(firestore, 'vehicles'), {
        ...data,
        price: Number(data.price),
        mileage: Number(data.mileage),
        doors: Number(data.doors),
        images: imageUrls,
        dealershipId: userData.dealershipId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({ title: "Sucesso!", description: "Veículo cadastrado com sucesso." });
      form.reset();

    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const years = getYears();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-6">
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa do Veículo</FormLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FormControl>
                      <Input
                        placeholder="ABC1D23"
                        {...field}
                        onBlur={handlePlateLookup}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          field.onChange(val);
                          if(val) form.setValue('plateEnding', val.slice(-1));
                        }}
                      />
                    </FormControl>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePlateLookup}
                    disabled={isPlateLoading}
                    title="Buscar dados da placa"
                  >
                    {isPlateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plateEnding"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Final da Placa</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 3" {...field} readOnly className="bg-muted cursor-not-allowed" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                      <SelectValue placeholder="Selecione" />
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
                <FormLabel>Modelo Completo (FIPE)</FormLabel>
                <FormControl>
                   <Input placeholder="Ex: ONIX HATCH LT 1.0 8V FlexPower 5p Mec." {...field} />
                </FormControl>
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
                <FormLabel>Ano Fabricação</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
            name="modelYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano Modelo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
        </div>

        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <FormControl>
                   <Input placeholder="Ex: Branco, Prata, Preto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="doors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portas</FormLabel>
                <FormControl>
                   <Input type="number" placeholder="4" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="fuel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Combustível</FormLabel>
                <FormControl>
                   <Input placeholder="Ex: Flex, Gasolina, Diesel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Câmbio</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicleTransmissions.map((transmission) => (
                      <SelectItem key={transmission} value={transmission}>
                        {transmission}
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
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quilometragem</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 15.000"
                    value={
                      field.value > 0
                        ? new Intl.NumberFormat('pt-BR').format(field.value)
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
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(field.value / 100)
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Descrição / Legenda para Instagram
                </FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-2 text-xs"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription || !form.watch('make') || !form.watch('model')}
                >
                  {isGeneratingDescription ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Gerar descrição com IA
                </Button>
              </div>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="Clique no botão acima para gerar uma legenda comercial otimizada..."
                    className="min-h-[140px]"
                    disabled={isGeneratingDescription}
                    {...field}
                  />
                  {isGeneratingDescription && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Gerando descrição com IA...</span>
                      </div>
                    </div>
                  )}
                </div>
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
              <FormLabel>Fotos Principais</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => onChange(e.target.files)}
                  {...rest}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || !userData}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Veículo'
          )}
        </Button>
      </form>
    </Form>
  );
}
