'use server';

/**
 * @fileOverview Generates a professional vehicle description for listings.
 * Used in the dealership website, vehicle detail page and marketplace ads.
 * Tone: direct, masculine, no emojis in running text.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface GenerateVehicleDescriptionInput {
  make: string;
  model: string;
  year: number;
  modelYear: number;
  fuel: string;
  color: string;
  doors: number;
  transmission: string;
  mileage: number;
  price: number;
  existingNotes?: string; // any notes the seller already typed
}

export interface GenerateVehicleDescriptionOutput {
  description?: string;
  error?: string;
}

export async function generateVehicleDescription(
  input: GenerateVehicleDescriptionInput,
): Promise<GenerateVehicleDescriptionOutput> {
  try {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return { error: 'GOOGLE_GENAI_API_KEY not configured' };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          description: {
            type: SchemaType.STRING,
            description: 'Professional vehicle listing description in Portuguese.',
          },
        },
        required: ['description'],
      },
    },
  });

  const km = input.mileage.toLocaleString('pt-BR');
  const price = (input.price / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

  const prompt = `Você é um redator especializado em anúncios de veículos para o mercado brasileiro.

Escreva uma descrição profissional de anúncio para o veículo abaixo. O texto será exibido no site da revenda e em marketplaces (OLX, Mercado Livre).

## Dados do Veículo
- Marca/Modelo: ${input.make} ${input.model}
- Ano fabricação/modelo: ${input.year}/${input.modelYear}
- Cor: ${input.color}
- Portas: ${input.doors}
- Câmbio: ${input.transmission}
- Combustível: ${input.fuel}
- Quilometragem: ${km} km
- Preço: ${price}
${input.existingNotes ? `- Observações do vendedor: ${input.existingNotes}` : ''}

## Regras obrigatórias

1. **Tom**: profissional, direto e confiante. Público-alvo são homens adultos que pesquisam carros com critério.
2. **Emojis**: PROIBIDO usar emojis no texto corrido. Nenhum emoji.
3. **Comprimento**: entre 3 e 5 frases. Não ultrapasse isso.
4. **Estrutura**: texto corrido em parágrafo único (sem listas, sem bullet points, sem tópicos).
5. **Conteúdo**: destaque o estado de conservação, os diferenciais do modelo e o custo-benefício. Se a quilometragem for baixa para o ano, mencione isso. Se for câmbio automático, destaque.
6. **Finalização**: encerre com uma frase convidando para contato ou visita, mas sem exagero.
7. **Idioma**: português brasileiro. Sem gírias, sem palavras em inglês.
8. **Proibido**: não invente informações que não estão nos dados acima. Não mencione garantias se não foram informadas.`;

  const generateWithRetry = async (attempts = 2): Promise<string> => {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      if (err?.status === 429 && attempts > 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return generateWithRetry(attempts - 1);
      }
      throw err;
    }
  };

  const text = await generateWithRetry();

  try {
    return JSON.parse(text);
  } catch {
    return { description: text };
  }
  } catch (err: any) {
    return { error: String(err?.message ?? err) };
  }
}
