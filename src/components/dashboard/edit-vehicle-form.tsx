'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Search, Sparkles, Trash2, Upload, X, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { vehicleMakes, getYears, VehicleMake, vehicleTransmissions } from '@/lib/vehicle-data';
import { getVehicleInfoFromPlate } from '@/ai/flows/get-vehicle-info-from-plate';
import { generateInstagramCaption } from '@/ai/flows/generate-instagram-caption';
import { useToast } from '@/hooks/use-toast';

import { useFirestore, useStorage } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  description: z.string().optional(),
  status: z.enum(['available', 'sold', 'unavailable']),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function EditVehicleForm({ vehicle }: { vehicle: any }) {
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>(vehicle.images || []);
  
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
      const aiResult = await generateInstagramCaption({
        ...values,
        year: parseInt(values.year),
        modelYear: parseInt(values.modelYear),
        description: values.description || '',
      });
      form.setValue('description', aiResult.caption, { shouldValidate: true });
      toast({ title: "Descrição gerada!" });
    } catch (error) {
      toast({ title: "Erro na IA", variant: "destructive" });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsUploadingImages(true);
    const files = Array.from(e.target.files);
    const newUrls = [...currentImages];

    try {
      for (const file of files) {
        const storageRef = ref(storage, `vehicles/${vehicle.dealershipId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newUrls.push(url);
      }
      setCurrentImages(newUrls);
      
      const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
      await updateDoc(vehicleRef, { images: newUrls, updatedAt: new Date() });
      
      toast({ title: "Fotos enviadas!", description: `${files.length} novas fotos adicionadas.` });
    } catch (error) {
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = async (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(newImages);
    try {
      const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
      await updateDoc(vehicleRef, { images: newImages, updatedAt: new Date() });
      toast({ title: "Foto removida" });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {currentImages.map((url, index) => (
                <div key={index} className="relative aspect-square group rounded-lg overflow-hidden border bg-muted">
                  <img src={url} alt="Veículo" className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-white text-[8px] font-bold rounded">
                      CAPA
                    </div>
                  )}
                </div>
              ))}
              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                {isUploadingImages ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Adicionar</span>
                  </>
                )}
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImages} />
              </label>
            </div>
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
