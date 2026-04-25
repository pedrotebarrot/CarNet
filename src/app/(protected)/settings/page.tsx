'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useStorage, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const dealershipSchema = z.object({
    name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
    phone: z.string().min(10, { message: 'Informe um telefone válido com DDD.' }),
    address: z.string().min(5, { message: 'Informe o endereço completo.' }),
    logo: z.any().optional(),
});

type DealershipFormValues = z.infer<typeof dealershipSchema>;

export default function SettingsPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
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

    const { data: dealershipData, isLoading: isDealershipLoading } = useDoc(dealershipDocRef);

    const form = useForm<DealershipFormValues>({
        resolver: zodResolver(dealershipSchema),
        defaultValues: {
            name: '',
            phone: '',
            address: '',
        },
    });

    // Load initial data
    useEffect(() => {
        if (dealershipData) {
            form.reset({
                name: dealershipData.name || '',
                phone: dealershipData.phone || '',
                address: dealershipData.address || '',
            });
            if (dealershipData.logoUrl) {
                setLogoPreview(dealershipData.logoUrl);
            }
        }
    }, [dealershipData, form]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    async function onSubmit(data: DealershipFormValues) {
        if (!dealershipDocRef) return;

        setIsSubmitting(true);
        try {
            let logoUrl = dealershipData?.logoUrl;

            // Upload new logo if selected (and it's a file list from input)
            if (data.logo && data.logo.length > 0) {
                const file = data.logo[0];
                const storageRef = ref(storage, `logos/${dealershipData?.slug || 'default'}/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                logoUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(dealershipDocRef, {
                name: data.name,
                phone: data.phone,
                address: data.address,
                logoUrl: logoUrl,
                updatedAt: new Date(),
            });

            toast({ title: "Sucesso!", description: "Informações atualizadas com sucesso." });
        } catch (error: any) {
            console.error("Error updating dealership:", error);
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isDealershipLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Configurações da Revenda</h3>
                <p className="text-sm text-muted-foreground">
                    Gerencie as informações públicas da sua loja.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Dados da Loja</CardTitle>
                    <CardDescription>
                        Essas informações serão exibidas na sua página pública.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Logo Upload */}
                            <div className="flex flex-col gap-4">
                                <FormLabel>Logo da Revenda</FormLabel>
                                <div className="flex items-center gap-6">
                                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
                                        {logoPreview ? (
                                            <Image
                                                src={logoPreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                <Upload className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="logo"
                                        render={({ field: { onChange, value, ...rest } }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            handleLogoChange(e);
                                                            onChange(e.target.files);
                                                        }}
                                                        {...rest}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome da Revenda</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Top Cars" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>WhatsApp / Telefone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(11) 99999-9999" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Endereço Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Rua das Flores, 123 - Centro, São Paulo - SP" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {dealershipData?.slug && (
                                <div className="rounded-md bg-muted p-4">
                                    <p className="text-sm font-medium">Link da Loja:</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {`${window.location.origin}/${dealershipData.slug}`}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar Alterações'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
