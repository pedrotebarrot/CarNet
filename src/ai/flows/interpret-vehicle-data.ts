'use server';

/**
 * @fileOverview AI-powered vehicle data interpreter using Google Generative AI SDK directly.
 * Extracts doors, fuel type, and transmission from raw API data.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface InterpretVehicleDataInput {
    rawModel: string;
    rawVersion: string;
    extraModel: string;
    fipeDescriptions: string;
    combustivel: string;
    cilindradas: string;
    origem: string;
    especie: string;
    subSegmento: string;
    caixaCambio: string;
    quantidadePassageiro: string;
}

export interface InterpretVehicleDataOutput {
    transmission: string | null;
    doors: number | null;
    fuel: string | null;
}

const TRANSMISSIONS = ['Automático', 'Manual', 'CVT', 'Automatizado'];

export async function interpretVehicleData(input: InterpretVehicleDataInput): Promise<InterpretVehicleDataOutput> {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
        throw new Error('GOOGLE_GENAI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    transmission: { type: SchemaType.STRING, nullable: true, description: 'Transmission type.' },
                    doors: { type: SchemaType.INTEGER, nullable: true, description: 'Number of doors (e.g. 2, 4, 5)' },
                    fuel: { type: SchemaType.STRING, nullable: true, description: 'The main fuel type (e.g. Flex, Gasolina, Diesel)' },
                },
                required: ['transmission', 'doors', 'fuel'],
            },
        },
    });

    const prompt = `Você é um especialista em veículos brasileiros. Analise os dados brutos de um veículo retornados por uma API de consulta de placas e extraia apenas os 3 campos técnicos finais.

## Dados do Veículo

- Modelo (raw): ${input.rawModel}
- Versão (raw): ${input.rawVersion}
- Modelo Extra: ${input.extraModel}
- Descrições FIPE: ${input.fipeDescriptions}
- Combustível (raw): ${input.combustivel}
- Caixa de Câmbio: ${input.caixaCambio}
- Sub-segmento: ${input.subSegmento}

## Instruções

### 1. Câmbio (transmission)
Valores possíveis: ${TRANSMISSIONS.join(', ')}.
- Verifique o campo "Caixa de Câmbio" ou as descrições FIPE ("Aut.", "Mec.", "CVT").
- Se não souber, retorne null.

### 2. Portas (doors)
- Baseado no sub-segmento, FIPE ou conhecimento geral, identifique quantas portas o carro tem.
- Se a FIPE disser "5p", são 5 portas. "4p", são 4.
- Hatchs geralmente tem 4 ou 5. Sedans 4.

### 3. Combustível (fuel)
- Analise o campo "Combustível (raw)".
- Se disser "Alcool / Gasolina", o resultado limpo deve ser OBRIGATORIAMENTE "Flex".
- Se disser "Gasolina", "Diesel", retorne o termo limpo, apenas a primeira letra maiúscula.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        const parsed = JSON.parse(text);
        return {
            transmission: parsed.transmission || null,
            doors: parsed.doors || null,
            fuel: parsed.fuel || null,
        };
    } catch {
        throw new Error('Failed to parse AI response: ' + text);
    }
}

