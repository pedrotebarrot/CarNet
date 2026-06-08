'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Search, Sparkles, ExternalLink } from 'lucide-react';
import { SortablePhotoGrid, PhotoItem } from '@/components/dashboard/sortable-photo-grid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { vehicleMakes, getYears } from '@/lib/vehicle-data';
import { getVehicleInfoFromPlate } from '@/ai/flows/get-vehicle-info-from-plate';
import { generateVehicleDescription } from '@/ai/flows/generate-vehicle-description';
import { compressImage, MAX_IMAGE_SIZE_BYTES, IMAGE_ACCEPT } from '@/lib/utils/compress-image';
import { useToast } from '@/hooks/use-toast';

import { useFirestore, useStorage } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { publishVehicleToML, unpublishVehicleFromML } from '@/actions/mercadolivre';
import { publishVehicleToOlx } from '@/actions/olx';

const vehicleSchema = z.object({
  plate: z.string().min(7).max(7),
  plateEnding: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.string().min(4),
  modelYear: z.string().min(4),
  color: z.string().min(1),
  doors: z.coerce.number().min(2),
  fuel: z.string().min(1),
  transmission: z.string().min(1),
  mileage: z.coerce.number().min(0),
  price: z.coerce.number().min(1),
  version: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['available', 'sold', 'unavailable']),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function EditVehicleForm({ vehicle }: { vehicle: any }) {
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress,    setUploadProgress]    = useState('');
  const [currentImages, setCurrentImages] = useState<string[]>(vehicle.images || []);
  const [mlData,  setMlData]  = useState<any>(vehicle.marketplace?.mercadolivre ?? null);
  const [isMLLoading,  setIsMLLoading]  = useState(false);
  const [olxData, setOlxData] = useState<any>(vehicle.publishedTo?.olx ?? null);
  const [isOLXLoading, setIsOLXLoading] = useState(false);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plate: vehicle.plate || '',
      plateEnding: vehicle.plateEnding || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      modelYear: vehicle.modelYear?.toString() || '',
      color: vehicle.color || '',
      doors: vehicle.doors || 4,
      fuel: vehicle.fuel || '',
      transmission: vehicle.transmission || '',
      mileage: vehicle.mileage || 0,
      price: vehicle.price || 0,
      version: vehicle.version || '',
      description: vehicle.description || '',
      status: vehicle.status || 'available',
    },
  });

  const handlePlateLookup = async () => {
    const plateValue = form.getValues('plate');
    if (plateValue.length < 7 || isPlateLoading) return;

    setIsPlateLoading(true);
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
        toast({ title: "Dados atualizados!", description: "Informações técnicas recuperadas pela placa." });
      }
    } catch (error) {
      toast({ title: "Erro na consulta", variant: "destructive" });
    } finally {
      setIsPlateLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    const values = form.getValues();
    setIsGeneratingDescription(true);
    try {
      const aiResult = await generateVehicleDescription({
        make: values.make,
        model: values.model,
        year: parseInt(values.year),
        modelYear: parseInt(values.modelYear),
        fuel: values.fuel,
        doors: values.doors,
        color: values.color,
        transmission: values.transmission,
        mileage: values.mileage,
        price: values.price,
        existingNotes: values.description || '',
      });
      form.setValue('description', aiResult.description, { shouldValidate: true });
      toast({ title: "Descrição gerada!" });
    } catch (error) {
      toast({ title: "Erro na IA", variant: "destructive" });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleImageUpload = async (fileList: FileList) => {
    if (!fileList?.length) return;

    const files = Array.from(fileList);

    // Validate sizes first
    const oversized = files.filter(f => f.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized.length) {
      toast({
        title: 'Arquivo muito grande',
        description: `${oversized.map(f => f.name).join(', ')} ultrapassam 20 MB. Reduza o tamanho e tente novamente.`,
        variant: 'destructive',
      });
      // Keep valid files only
      const valid = files.filter(f => f.size <= MAX_IMAGE_SIZE_BYTES);
      if (!valid.length) return;
    }

    const validFiles = files.filter(f => f.size <= MAX_IMAGE_SIZE_BYTES);
    setIsUploadingImages(true);
    const newUrls = [...currentImages];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

        // Compress
        setUploadProgress(`Comprimindo foto ${i + 1} de ${validFiles.length}...`);
        const compressed = await compressImage(file);

        // Upload
        setUploadProgress(`Enviando foto ${i + 1} de ${validFiles.length}...`);
        const storageRef = ref(storage, `vehicles/${vehicle.dealershipId}/${Date.now()}_${compressed.name}`);
        await uploadBytes(storageRef, compressed);
        const url = await getDownloadURL(storageRef);
        newUrls.push(url);
      }

      setCurrentImages(newUrls);
      const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
      await updateDoc(vehicleRef, {
        images: newUrls,
        featuredImage: newUrls[0] ?? null,
        updatedAt: new Date(),
      });
      toast({ title: '✅ Fotos enviadas!', description: `${validFiles.length} foto${validFiles.length > 1 ? 's' : ''} adicionada${validFiles.length > 1 ? 's' : ''}.` });
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message ?? 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsUploadingImages(false);
      setUploadProgress('');
    }
  };

  const handlePhotosChange = async (items: PhotoItem[]) => {
    const newImages = items.map(i => i.src);
    setCurrentImages(newImages);
    try {
      const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
      await updateDoc(vehicleRef, {
        images: newImages,
        featuredImage: newImages[0] ?? null,
        updatedAt: new Date(),
      });
    } catch {
      toast({ title: "Erro ao atualizar fotos", variant: "destructive" });
    }
  };

  const handlePublishML = async () => {
    const values = form.getValues();
    setIsMLLoading(true);
    try {
      const result = await publishVehicleToML({
        id:           vehicle.id,
        make:         values.make,
        model:        values.model,
        version:      values.version,
        year:         Number(values.year),
        modelYear:    Number(values.modelYear),
        price:        Number(values.price),
        mileage:      Number(values.mileage),
        fuel:         values.fuel,
        transmission: values.transmission,
        color:        values.color,
        doors:        Number(values.doors),
        plate:        values.plate,
        plateEnding:  values.plateEnding,
        description:  values.description,
        images:       currentImages,
        dealershipId: vehicle.dealershipId,
      });
      if (result.success) {
        setMlData({ id: result.mlId, permalink: result.permalink, status: 'active' });
        toast({ title: "Publicado no Mercado Livre!", description: "Anúncio criado com sucesso." });
      } else {
        toast({ title: "Erro ao publicar", description: result.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao publicar", description: err.message, variant: "destructive" });
    } finally {
      setIsMLLoading(false);
    }
  };

  const handleUnpublishML = async () => {
    setIsMLLoading(true);
    try {
      await unpublishVehicleFromML(vehicle.id, vehicle.dealershipId);
      setMlData((prev: any) => ({ ...prev, status: 'closed' }));
      toast({ title: "Anúncio encerrado no Mercado Livre." });
    } catch (err: any) {
      toast({ title: "Erro ao encerrar", description: err.message, variant: "destructive" });
    } finally {
      setIsMLLoading(false);
    }
  };

  const handlePublishOLX = async () => {
    const values = form.getValues();
    setIsOLXLoading(true);
    try {
      const result = await publishVehicleToOlx({
        dealershipId: vehicle.dealershipId,
        vehicleId:    vehicle.id,
        make:         values.make,
        model:        values.model,
        year:         Number(values.year),
        modelYear:    Number(values.modelYear),
        price:        Number(values.price),
        mileage:      Number(values.mileage),
        fuel:         values.fuel,
        transmission: values.transmission,
        color:        values.color,
        doors:        Number(values.doors),
        plate:        values.plate,
        plateEnding:  values.plateEnding,
        description:  values.description,
        images:       currentImages,
      });
      if (result.success) {
        setOlxData({ adId: result.adId, publishedAt: new Date() });
        toast({ title: "Publicado na OLX!", description: "Anúncio criado com sucesso." });
      } else {
        toast({ title: "Erro ao publicar na OLX", description: result.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao publicar na OLX", description: err.message, variant: "destructive" });
    } finally {
      setIsOLXLoading(false);
    }
  };

  async function onSubmit(data: VehicleFormValues) {
    setIsSubmitting(true);
    try {
      const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
      await updateDoc(vehicleRef, {
        ...data,
        price: Number(data.price),
        mileage: Number(data.mileage),
        doors: Number(data.doors),
        updatedAt: new Date(),
      });
      toast({ title: "Sucesso!", description: "Dados do veículo atualizados." });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const years = getYears();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Galeria de Fotos</CardTitle>
            <CardDescription>Gerencie as imagens do veículo.</CardDescription>
          </CardHeader>
          <CardContent>
            <SortablePhotoGrid
              items={currentImages.map((url, i) => ({ id: `${url}-${i}`, src: url }))}
              onChange={handlePhotosChange}
              onAddMore={handleImageUpload}
              isUploading={isUploadingImages}
              uploadProgress={uploadProgress}
              accept={IMAGE_ACCEPT}
            />
            <p className="text-xs mt-3" style={{ color: '#45464d' }}>
              Formatos aceitos: JPEG, PNG, WebP e HEIC (fotos de iPhone) · Máx. 20 MB por foto · Compressão automática aplicada antes do envio
            </p>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Dados do Veículo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa</FormLabel>
                        <div className="flex gap-2">
                          <FormControl><Input {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                          <Button type="button" variant="outline" size="icon" onClick={handlePlateLookup} disabled={isPlateLoading}>
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
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
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="available">Disponível</SelectItem>
                            <SelectItem value="sold">Vendido</SelectItem>
                            <SelectItem value="unavailable">Indisponível</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="make" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{vehicleMakes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="version" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão <span className="text-muted-foreground font-normal text-xs">(recomendado para ML)</span></FormLabel>
                    <FormControl><Input placeholder="Ex: LT 1.0 Turbo Flex, Sport 2.0 AT" {...field} /></FormControl>
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem><FormLabel>Ano Fab.</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></FormItem>
                  )} />
                   <FormField control={form.control} name="modelYear" render={({ field }) => (
                    <FormItem><FormLabel>Ano Mod.</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="mileage" render={({ field }) => (
                    <FormItem><FormLabel>Quilometragem</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                   <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(field.value / 100)} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            field.onChange(val ? parseInt(val) : 0);
                          }} 
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Descrição</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGeneratingDescription}>
                    <Sparkles className="h-3 w-3 mr-2" /> IA
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormControl><Textarea {...field} className="min-h-[150px]" /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </Form>
      </div>

      <div className="space-y-6">

        {/* ── Mercado Livre ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded font-bold text-[10px]" style={{ backgroundColor: '#FFE600', color: '#333' }}>ML</div>
              <CardTitle className="text-base">Mercado Livre</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mlData?.id && mlData?.status !== 'closed' ? (
              <>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#065f46' }}>
                  <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  Anúncio ativo
                </div>
                {mlData.permalink && (
                  <a
                    href={mlData.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs underline"
                    style={{ color: '#3980f4' }}
                  >
                    Ver anúncio <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  style={{ borderColor: '#fca5a5', color: '#dc2626' }}
                  onClick={handleUnpublishML}
                  disabled={isMLLoading}
                >
                  {isMLLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Encerrar anúncio
                </Button>
              </>
            ) : (
              <>
                {mlData?.status === 'closed' && (
                  <p className="text-xs" style={{ color: '#92400e' }}>Anúncio encerrado.</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  style={{ backgroundColor: '#FFE600', color: '#333' }}
                  onClick={handlePublishML}
                  disabled={isMLLoading}
                >
                  {isMLLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Publicar no Mercado Livre
                </Button>
                <p className="text-xs" style={{ color: '#45464d' }}>
                  A conta do ML precisa estar conectada em Configurações.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── OLX ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded font-bold text-white text-[10px]" style={{ backgroundColor: '#FF6B00' }}>OLX</div>
              <CardTitle className="text-base">OLX</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {olxData?.adId ? (
              <>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#065f46' }}>
                  <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  Anúncio publicado
                </div>
                <p className="text-xs font-mono" style={{ color: '#45464d' }}>ID: {olxData.adId}</p>
                <a
                  href="https://www.olx.com.br/minha-conta/meus-anuncios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs underline"
                  style={{ color: '#3980f4' }}
                >
                  Ver na OLX <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  style={{ backgroundColor: '#FF6B00', color: '#fff' }}
                  onClick={handlePublishOLX}
                  disabled={isOLXLoading}
                >
                  {isOLXLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Publicar na OLX
                </Button>
                <p className="text-xs" style={{ color: '#45464d' }}>
                  A conta da OLX precisa estar conectada em Configurações.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Prévia do Site</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="aspect-video bg-muted rounded-md overflow-hidden">
                <img src={currentImages[0] || '/placeholder.png'} className="w-full h-full object-cover" alt="Preview" />
             </div>
             <div className="space-y-1">
                <h3 className="font-bold">{form.watch('make')} {form.watch('model')}</h3>
                <p className="text-sm text-muted-foreground">{form.watch('year')}/{form.watch('modelYear')}</p>
                <p className="text-xl font-bold text-primary">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(form.watch('price') / 100)}
                </p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
