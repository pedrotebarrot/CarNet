'use client';

import { useState, useMemo } from 'react';
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
import { generateVehicleDescription } from '@/ai/flows/generate-vehicle-description';
import { compressImage, MAX_IMAGE_SIZE_BYTES, IMAGE_ACCEPT } from '@/lib/utils/compress-image';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { SortablePhotoGrid, PhotoItem } from '@/components/dashboard/sortable-photo-grid';

import { useUser, useFirestore, useStorage, useDoc } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { publishVehicleToML } from '@/actions/mercadolivre';
import { publishVehicleToOlx } from '@/actions/olx';

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
  version: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['available', 'sold', 'unavailable']),
  images: z.any().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function AddVehicleForm() {
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [publishToML,  setPublishToML]  = useState(false);
  const [publishToOLX, setPublishToOLX] = useState(false);
  const [previewItems, setPreviewItems] = useState<PhotoItem[]>([]);
  const [fileMap] = useState<Map<string, File>>(new Map());
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();

  const userDocRef = useMemo(() =>
    user ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );

  const { data: userData } = useDoc(userDocRef);

  const dealershipDocRef = useMemo(() =>
    userData?.dealershipId ? doc(firestore, 'dealerships', userData.dealershipId) : null,
    [userData, firestore]
  );
  const { data: dealershipData } = useDoc(dealershipDocRef);
  const mlConnected  = dealershipData?.integrations?.mercadolivre?.connected === true;
  const olxConnected = dealershipData?.integrations?.olx?.connected === true;

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
      version: '',
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
        if (result.version) form.setValue('version', result.version, { shouldValidate: true });
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
      const aiResult = await generateVehicleDescription({
        make: values.make,
        model: values.model,
        year: parseInt(values.year) || 0,
        modelYear: parseInt(values.modelYear) || 0,
        fuel: values.fuel,
        doors: values.doors,
        color: values.color,
        transmission: values.transmission,
        mileage: values.mileage,
        price: values.price,
        existingNotes: values.description || '',
      });
      if (aiResult.error) {
        toast({ title: "Erro na IA", description: aiResult.error, variant: "destructive" });
        return;
      }
      form.setValue('description', aiResult.description ?? '', { shouldValidate: true });
      toast({ title: "Descrição gerada!", description: "O texto foi criado com base nos dados do veículo." });
    } catch (error: any) {
      console.error('AI description generation failed:', error);
      toast({ title: "Erro na IA", description: String(error?.message ?? error), variant: "destructive" });
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
      // Upload images in the order the user arranged them
      const imageUrls = [];
      const orderedFiles = previewItems.map(item => fileMap.get(item.id)).filter(Boolean) as File[];
      for (let i = 0; i < orderedFiles.length; i++) {
        const compressed = await compressImage(orderedFiles[i]);
        const storageRef = ref(storage, `vehicles/${userData.dealershipId}/${Date.now()}_${compressed.name}`);
        await uploadBytes(storageRef, compressed);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      const vehicleDoc = await addDoc(collection(firestore, 'vehicles'), {
        ...data,
        price: Number(data.price),
        mileage: Number(data.mileage),
        doors: Number(data.doors),
        images: imageUrls,
        featuredImage: imageUrls[0] ?? null,
        dealershipId: userData.dealershipId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({ title: "Sucesso!", description: "Veículo cadastrado com sucesso." });

      // Publicar no Mercado Livre se o toggle estiver ativo
      if (publishToML && mlConnected) {
        const mlResult = await publishVehicleToML({
          id:           vehicleDoc.id,
          make:         data.make,
          model:        data.model,
          year:         Number(data.year),
          modelYear:    Number(data.modelYear),
          price:        Number(data.price),
          mileage:      Number(data.mileage),
          fuel:         data.fuel,
          transmission: data.transmission,
          color:        data.color,
          doors:        Number(data.doors),
          plate:        data.plate,
          plateEnding:  data.plateEnding,
          version:      data.version,
          description:  data.description,
          images:       imageUrls,
          dealershipId: userData.dealershipId,
        });

        if (mlResult.success && mlResult.mlId) {
          toast({ title: "Publicado no Mercado Livre!", description: "Anúncio criado com sucesso na sua conta." });
        } else {
          toast({ title: "Veículo salvo, mas erro no ML", description: mlResult.error, variant: "destructive" });
        }
      }

      // Publicar na OLX se o toggle estiver ativo
      if (publishToOLX && olxConnected) {
        const olxResult = await publishVehicleToOlx({
          dealershipId: userData.dealershipId,
          vehicleId:    vehicleDoc.id,
          make:         data.make,
          model:        data.model,
          year:         Number(data.year),
          modelYear:    Number(data.modelYear),
          price:        Number(data.price),
          mileage:      Number(data.mileage),
          fuel:         data.fuel,
          transmission: data.transmission,
          color:        data.color,
          doors:        Number(data.doors),
          plate:        data.plate,
          plateEnding:  data.plateEnding,
          description:  data.description,
          images:       imageUrls,
        });
        if (olxResult.success) {
          toast({ title: "Publicado na OLX!", description: "Anúncio criado com sucesso." });
        } else {
          toast({ title: "Veículo salvo, mas erro na OLX", description: olxResult.error, variant: "destructive" });
        }
      }

      form.reset();
      setPreviewItems([]);
      fileMap.clear();
      setPublishToML(false);
      setPublishToOLX(false);

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
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                   <Input placeholder="Ex: Onix, HB20, Corolla" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Versão <span className="text-muted-foreground font-normal">(opcional, mas recomendado para o ML)</span></FormLabel>
              <FormControl>
                <Input placeholder="Ex: LT 1.0 Turbo Flex, Sport 2.0 AT" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="space-y-2">
          <Label>Fotos Principais</Label>
          {previewItems.length === 0 ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
              <Sparkles className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">Clique para selecionar fotos</span>
              <span className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP, HEIC · Máx. 20 MB cada</span>
              <input
                type="file"
                multiple
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  if (!e.target.files?.length) return;
                  const newItems: PhotoItem[] = [];
                  Array.from(e.target.files).forEach(file => {
                    if (file.size > MAX_IMAGE_SIZE_BYTES) {
                      toast({ title: `"${file.name}" ignorada`, description: 'Arquivo acima de 20 MB.', variant: 'destructive' });
                      return;
                    }
                    const id = `${Date.now()}-${Math.random()}`;
                    fileMap.set(id, file);
                    newItems.push({ id, src: URL.createObjectURL(file) });
                  });
                  setPreviewItems(prev => [...prev, ...newItems]);
                }}
              />
            </label>
          ) : (
            <SortablePhotoGrid
              items={previewItems}
              onChange={setPreviewItems}
              onAddMore={(files) => {
                const newItems: PhotoItem[] = [];
                Array.from(files).forEach(file => {
                  if (file.size > MAX_IMAGE_SIZE_BYTES) {
                    toast({ title: `"${file.name}" ignorada`, description: 'Arquivo acima de 20 MB.', variant: 'destructive' });
                    return;
                  }
                  const id = `${Date.now()}-${Math.random()}`;
                  fileMap.set(id, file);
                  newItems.push({ id, src: URL.createObjectURL(file) });
                });
                setPreviewItems(prev => [...prev, ...newItems]);
              }}
              accept={IMAGE_ACCEPT}
            />
          )}
        </div>

        {mlConnected && (
          <div
            className="flex items-center justify-between rounded-lg border p-4"
            style={{ borderColor: publishToML ? '#ffd000' : '#e5eeff', backgroundColor: publishToML ? '#fffbe6' : '#f8f9ff' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md font-bold text-sm" style={{ backgroundColor: '#ffd000' }}>
                ML
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>Publicar no Mercado Livre</p>
                <p className="text-xs" style={{ color: '#45464d' }}>O anúncio será criado automaticamente ao salvar</p>
              </div>
            </div>
            <Switch checked={publishToML} onCheckedChange={setPublishToML} />
          </div>
        )}

        {olxConnected && (
          <div
            className="flex items-center justify-between rounded-lg border p-4"
            style={{ borderColor: publishToOLX ? '#FF6B00' : '#e5eeff', backgroundColor: publishToOLX ? '#fff4ee' : '#f8f9ff' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md font-bold text-white text-[10px]" style={{ backgroundColor: '#FF6B00' }}>
                OLX
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>Publicar na OLX</p>
                <p className="text-xs" style={{ color: '#45464d' }}>O anúncio será criado automaticamente ao salvar</p>
              </div>
            </div>
            <Switch checked={publishToOLX} onCheckedChange={setPublishToOLX} />
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || !userData}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {publishToML || publishToOLX ? 'Salvando e publicando...' : 'Salvando...'}
            </>
          ) : (
            publishToML && publishToOLX ? 'Salvar, publicar no ML e OLX'
            : publishToML               ? 'Salvar e Publicar no ML'
            : publishToOLX              ? 'Salvar e Publicar na OLX'
            :                             'Salvar Veículo'
          )}
        </Button>
      </form>
    </Form>
  );
}
