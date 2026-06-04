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

  const km = input.mileage.toLocaleString('pt-BR');
  const price = (input.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const prompt = `Você é um especialista em marketing de redes sociais para revendas de veículos no Brasil.

Escreva uma legenda para Instagram para o veículo abaixo.

## Dados do Veículo
Marca/Modelo: ${input.make} ${input.model}
Ano: ${input.year}/${input.modelYear}
Detalhes: ${input.color}, ${input.doors} Portas, Câmbio ${input.transmission}, Combustível ${input.fuel}
Quilometragem: ${km} km
Preço: ${price}
Placa Final: ${input.plateEnding}
Descrição do vendedor: ${input.description}

## Regras obrigatórias

1. **Emojis**: use com moderação — no máximo 3 emojis em toda a legenda, apenas no início de linhas ou antes de informações-chave. NUNCA no meio de uma frase.
2. **Tom**: direto e confiante. Público-alvo são compradores adultos que pesquisam carros com critério. Sem linguagem juvenil.
3. **Estrutura**: 2 a 3 parágrafos curtos + hashtags no final.
4. **Conteúdo**: primeiro parágrafo apresenta o carro com os destaques. Segundo parágrafo tem o preço e condições. Último parágrafo é o call to action para entrar em contato.
5. **Hashtags**: 5 a 8 hashtags relevantes no final (marca, modelo, estado, carros usados). Separadas por espaço.
6. **Idioma**: português brasileiro. Sem gírias excessivas.`;

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
