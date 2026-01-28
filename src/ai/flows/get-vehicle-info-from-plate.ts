'use server';

/**
 * @fileOverview AI agent to get vehicle information from a license plate.
 *
 * - getVehicleInfoFromPlate - A function that returns vehicle details based on a license plate.
 * - GetVehicleInfoFromPlateInput - The input type for the getVehicleInfoFromPlate function.
 * - GetVehicleInfoFromPlateOutput - The return type for the getVehicleInfoFromPlate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetVehicleInfoFromPlateInputSchema = z.object({
  plate: z.string().describe('The vehicle license plate.'),
});
export type GetVehicleInfoFromPlateInput = z.infer<typeof GetVehicleInfoFromPlateInputSchema>;

const GetVehicleInfoFromPlateOutputSchema = z.object({
  make: z.string().describe('The make of the vehicle.'),
  model: z.string().describe('The model of the vehicle.'),
  year: z.number().describe('The manufacturing year of the vehicle.'),
  modelYear: z.number().describe('The model year of the vehicle.'),
  engine: z.string().describe('The engine specification of the vehicle.'),
  version: z.string().describe('The version or trim of the vehicle.'),
});
export type GetVehicleInfoFromPlateOutput = z.infer<typeof GetVehicleInfoFromPlateOutputSchema>;

// This is a mock database. In a real application, you would query a database
// or an external API to get this information.
const MOCK_PLATE_DB: Record<string, Omit<GetVehicleInfoFromPlateOutput, 'plate'>> = {
    'BRA2E19': { make: 'Volkswagen', model: 'Golf', year: 2021, modelYear: 2021, engine: '1.4 TSI', version: 'Highline' },
    'ABC1234': { make: 'Chevrolet', model: 'Onix', year: 2022, modelYear: 2022, engine: '1.0 Turbo', version: 'LTZ' },
    'XYZ5678': { make: 'Ford', model: 'Mustang', year: 2020, modelYear: 2020, engine: '5.0 V8', version: 'GT Premium' },
    'JKL4321': { make: 'Honda', model: 'Civic', year: 2019, modelYear: 2019, engine: '1.5 Turbo', version: 'Touring' },
    'GDV2F53': { make: 'Hyundai', model: 'Creta', year: 2023, modelYear: 2023, engine: '1.0 Turbo', version: 'Platinum' },
};


export async function getVehicleInfoFromPlate(input: GetVehicleInfoFromPlateInput): Promise<GetVehicleInfoFromPlateOutput | null> {
    return getVehicleInfoFromPlateFlow(input);
}


const getVehicleInfoFromPlateFlow = ai.defineFlow(
  {
    name: 'getVehicleInfoFromPlateFlow',
    inputSchema: GetVehicleInfoFromPlateInputSchema,
    outputSchema: z.nullable(GetVehicleInfoFromPlateOutputSchema),
  },
  async ({ plate }) => {
    // In a real application, you would use a tool to call an external API.
    // For this example, we'll use a mock database.
    const vehicleInfo = MOCK_PLATE_DB[plate.toUpperCase()];

    if (vehicleInfo) {
      return vehicleInfo;
    }
    
    return null;
  }
);
