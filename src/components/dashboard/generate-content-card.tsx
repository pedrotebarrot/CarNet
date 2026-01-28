'use client';

import { useState } from 'react';
import { Sparkles, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { Vehicle } from '@/lib/data';
import { generateInstagramCaption, type GenerateInstagramCaptionInput } from '@/ai/flows/generate-instagram-caption';
import { PostPreview } from './post-preview';
import { useToast } from '@/hooks/use-toast';

export function GenerateContentCard({ vehicle }: { vehicle: Vehicle }) {
  const [isLoading, setIsLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const { toast } = useToast();

  const handleGenerateCaption = async () => {
    setIsLoading(true);
    setCaption('');
    try {
      const input: GenerateInstagramCaptionInput = {
        make: vehicle.make,
        model: vehicle.model,
        version: vehicle.version,
        year: vehicle.year,
        modelYear: vehicle.modelYear,
        engine: vehicle.engine,
        mileage: vehicle.mileage,
        price: vehicle.price,
        description: vehicle.description,
      };
      const result = await generateInstagramCaption(input);
      setCaption(result.caption);
    } catch (error) {
      console.error('Failed to generate caption:', error);
      toast({
        title: "Erro ao gerar legenda",
        description: "Não foi possível conectar com o serviço de IA. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    toast({
        title: "Copiado!",
        description: "A legenda foi copiada para sua área de transferência.",
    });
  }

  return (
    <Card id="generate-content">
      <CardHeader>
        <CardTitle>Conteúdo para Instagram</CardTitle>
        <CardDescription>Gere posts e legendas com IA para suas redes sociais.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button onClick={handleGenerateCaption} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Gerando...' : 'Gerar Legenda com IA'}
        </Button>
        {(isLoading || caption) && (
          <div className="relative">
            <Textarea
              value={caption}
              readOnly
              placeholder={isLoading ? 'Aguarde, a mágica está acontecendo...' : ''}
              className="min-h-[200px] pr-12"
            />
            {caption && (
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                </Button>
            )}
          </div>
        )}
        
        <div className="space-y-2">
            <h4 className="text-sm font-medium">Pré-visualização do Post</h4>
            <PostPreview vehicle={vehicle} />
        </div>
      </CardContent>
    </Card>
  );
}
