'use server';

/**
 * @fileOverview AI agent to generate engaging Instagram captions for car dealerships.
 * Uses Google Generative AI SDK directly.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface GenerateInstagramCaptionInput {
  make: string;
  model: string;
  year: number;
  modelYear: number;
  fuel: string;
  color: string;
  doors: number;
  transmission: string;
  plateEnding: string;
  mileage: number;
  price: number;
  description: string;
}

export interface GenerateInstagramCaptionOutput {
  caption: string;
}

export async function generateInstagramCaption(input: GenerateInstagramCaptionInput): Promise<GenerateInstagramCaptionOutput> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENAI_API_KEY not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          caption: { type: SchemaType.STRING, description: 'An engaging Instagram caption for the vehicle.' },
        },
        required: ['caption'],
      },
    },
  });

  const prompt = `Você é um especialista em marketing de redes sociais para lojas de veículos no Brasil. Gere uma legenda engajadora para Instagram para o seguinte carro em estoque, incluindo um call to action forte convidando o cliente a visitar a loja.

**Ficha Técnica do Veículo:**
Marca: ${input.make}
Modelo FIPE: ${input.model}
Ano: ${input.year}/${input.modelYear}
Detalhes: ${input.color}, ${input.doors} Portas, Câmbio ${input.transmission}, Combustível ${input.fuel}
Placa Final: ${input.plateEnding}
Quilometragem: ${input.mileage} km
Preço: R$ ${(input.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Informações do Lojista: ${input.description}

A legenda deve:
- Ser em português brasileiro
- Usar emojis de forma estratégica
- Destacar os pontos fortes do veículo
- Ter hashtags relevantes no final
- Incluir call to action`;

  const generateWithRetry = async (attempts = 2): Promise<string> => {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      // If quota exceeded and we have retries left, wait and retry once
      if (err?.status === 429 && attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return generateWithRetry(attempts - 1);
      }
      throw err;
    }
  };

  const text = await generateWithRetry();

  try {
    return JSON.parse(text);
  } catch {
    return { caption: text };
  }
}
