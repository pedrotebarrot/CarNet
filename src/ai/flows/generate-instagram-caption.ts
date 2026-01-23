'use server';

/**
 * @fileOverview AI agent to generate engaging Instagram captions for car dealerships.
 *
 * - generateInstagramCaption - A function that generates an Instagram caption based on vehicle details.
 * - GenerateInstagramCaptionInput - The input type for the generateInstagramCaption function.
 * - GenerateInstagramCaptionOutput - The return type for the generateInstagramCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInstagramCaptionInputSchema = z.object({
  make: z.string().describe('The make of the vehicle.'),
  model: z.string().describe('The model of the vehicle.'),
  year: z.number().describe('The year of the vehicle.'),
  mileage: z.number().describe('The mileage of the vehicle.'),
  price: z.number().describe('The price of the vehicle.'),
  description: z.string().describe('A detailed description of the vehicle.'),
});
export type GenerateInstagramCaptionInput = z.infer<typeof GenerateInstagramCaptionInputSchema>;

const GenerateInstagramCaptionOutputSchema = z.object({
  caption: z.string().describe('An engaging Instagram caption for the vehicle.'),
});
export type GenerateInstagramCaptionOutput = z.infer<typeof GenerateInstagramCaptionOutputSchema>;

export async function generateInstagramCaption(input: GenerateInstagramCaptionInput): Promise<GenerateInstagramCaptionOutput> {
  return generateInstagramCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInstagramCaptionPrompt',
  input: {schema: GenerateInstagramCaptionInputSchema},
  output: {schema: GenerateInstagramCaptionOutputSchema},
  prompt: `You are a social media expert for car dealerships. Generate an engaging Instagram caption for the following vehicle, including a call to action to visit the dealership or contact them for more information.\n\nMake: {{{make}}}\nModel: {{{model}}}\nYear: {{{year}}}\nMileage: {{{mileage}}}\nPrice: {{{price}}}\nDescription: {{{description}}}`,
});

const generateInstagramCaptionFlow = ai.defineFlow(
  {
    name: 'generateInstagramCaptionFlow',
    inputSchema: GenerateInstagramCaptionInputSchema,
    outputSchema: GenerateInstagramCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
