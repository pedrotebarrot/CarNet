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
  year: z.number().describe('The year of the vehicle.'),
});
export type GetVehicleInfoFromPlateOutput = z.infer<typeof GetVehicleInfoFromPlateOutputSchema>;

// This is a mock database. In a real application, you would query a database
// or an external API to get this information.
const MOCK_PLATE_DB: Record<string, Omit<GetVehicleInfoFromPlateOutput, 'plate'>> = {
    'BRA2E19': { make: 'Volkswagen', model: 'Golf', year: 2021 },
    'ABC1234': { make: 'Chevrolet', model: 'Onix', year: 2022 },
    'XYZ5678': { make: 'Ford', model: 'Mustang', year: 2020 },
    'JKL4321': { make: 'Honda', model: 'Civic', year: 2019 },
    'GDV2F53': { make: 'Hyundai', model: 'Creta', year: 2023 },
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
