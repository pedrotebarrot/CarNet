'use server';

/**
 * @fileOverview Fetches vehicle information from a license plate API and uses AI to interpret the data.
 *
 * - getVehicleInfoFromPlate - A function that returns vehicle details based on a license plate.
 * - GetVehicleInfoFromPlateInput - The input type for the getVehicleInfoFromPlate function.
 * - GetVehicleInfoFromPlateOutput - The return type for the getVehicleInfoFromPlate function.
 */

import { z } from 'zod';
import { findBestModelMatch } from './model-matcher';

const GetVehicleInfoFromPlateInputSchema = z.object({
  plate: z.string().describe('The vehicle license plate.'),
});
export type GetVehicleInfoFromPlateInput = z.infer<typeof GetVehicleInfoFromPlateInputSchema>;

const GetVehicleInfoFromPlateOutputSchema = z.object({
  make: z.string().describe('The make of the vehicle.'),
  model: z.string().describe('The model of the vehicle.'),
  year: z.number().describe('The manufacturing year of the vehicle.'),
  modelYear: z.number().describe('The model year of the vehicle.'),
  transmission: z.string().describe('The transmission type of the vehicle.'),
  fuel: z.string().describe('The fuel type.'),
  doors: z.number().describe('Number of doors.'),
  color: z.string().describe('Vehicle color.'),
  plateEnding: z.string().describe('Last digit of the license plate.'),
});
export type GetVehicleInfoFromPlateOutput = z.infer<typeof GetVehicleInfoFromPlateOutputSchema>;

export async function getVehicleInfoFromPlate(input: GetVehicleInfoFromPlateInput): Promise<GetVehicleInfoFromPlateOutput | null> {
  const token = process.env.APIPLACAS_TOKEN;

  if (!token) {
    console.error("APIPLACAS_TOKEN not found in environment variables.");
    return null;
  }

  try {
    const response = await fetch(`https://wdapi2.com.br/consulta/${input.plate}/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.error(`API Placas returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.error || data.retorno === 'ERRO' || !data.modelo) {
      console.warn("API Placas returned error or no data:", data);
      return null;
    }

    // --- Basic field extraction ---
    let make = data.marca || data.MARCA || '';
    make = normalizeMake(make);

    const rawModel = data.modelo || data.MODELO || '';
    let model = getBestFipeMatch(rawModel, data.fipe?.dados) || rawModel;
    
    // Explicit overrides
    const rawVersion = data.VERSAO || data.versao || '';
    const fipeDescriptions = data.fipe?.dados?.map((d: any) => d.texto_modelo).join(' | ') || '';
    const extraModel = data.extra?.modelo || '';

    // Direct extraction fields
    const color = data.cor || data.COR || '';
    const plateEnding = input.plate.slice(-1) || '';

    // Ensure years are numbers
    const year = parseInt(data.ano) || new Date().getFullYear();
    const modelYear = parseInt(data.anoModelo) || parseInt(data.ano) || new Date().getFullYear();

    // --- Native Heuristics Interpretation ---
    let transmission = simpleExtractTransmission(
      [data.modelo, data.versao, extraModel, model].filter(Boolean).join(' '),
      data.extra?.caixa_cambio
    );
    
    // Doors: FIPE often says "5p", "4P", "3p", etc in the description. Otherwise default to extra segment or 4.
    let doors = 4;
    const modelDescLower = model.toLowerCase();
    const doorsMatch = modelDescLower.match(/(\d)p/);
    if (doorsMatch) {
      doors = parseInt(doorsMatch[1], 10);
    } else if (data.extra?.quantidade_passageiro) {
      doors = parseInt(data.extra.quantidade_passageiro, 10);
      if (isNaN(doors) || doors === 0) doors = 4;
    }

    // Fuel: FIPE "Flex" overrides generic "Alcool / Gasolina". 
    // Fallback looks at FIPE text or raw extra field
    let fuel = 'Flex'; // default reasonable guess for modern BR cars
    const rawFuel = (data.extra?.combustivel || data.combustivel || '').toLowerCase();
    
    if (rawFuel.includes('alcool/gasolina') || rawFuel.includes('álcool/gasolina') || rawFuel.includes('flex')) {
      fuel = 'Flex';
    } else if (rawFuel.includes('diesel')) {
      fuel = 'Diesel';
    } else if (rawFuel.includes('gasolina')) {
      fuel = 'Gasolina';
    } else if (rawFuel.includes('hibrid') || rawFuel.includes('híbrid') || modelDescLower.includes('hybrid')) {
      fuel = 'Híbrido';
    } else if (rawFuel.includes('eletric') || rawFuel.includes('elétric') || modelDescLower.includes('ev')) {
       fuel = 'Elétrico';
    } else if (data.extra?.combustivel) {
       // Just capitalize whatever we found
       fuel = data.extra.combustivel.charAt(0).toUpperCase() + data.extra.combustivel.slice(1).toLowerCase();
    }

    return {
      make,
      model,
      year,
      modelYear,
      transmission,
      fuel,
      doors,
      color,
      plateEnding
    };

  } catch (error) {
    console.error("Error fetching vehicle info from API Placas:", error);
    return null;
  }
}

function normalizeMake(make: string): string {
  if (!make) return '';
  const upperMake = make.toUpperCase();

  if (upperMake.includes('VW') || upperMake.includes('VOLKS')) return 'Volkswagen';
  if (upperMake.includes('GM') || upperMake.includes('CHEVROLET')) return 'Chevrolet';
  if (upperMake.includes('FIAT')) return 'Fiat';
  if (upperMake.includes('HONDA')) return 'Honda';
  if (upperMake.includes('TOYOTA')) return 'Toyota';
  if (upperMake.includes('HYUNDAI')) return 'Hyundai';
  if (upperMake.includes('FORD')) return 'Ford';
  if (upperMake.includes('RENAULT')) return 'Renault';
  if (upperMake.includes('JEEP')) return 'Jeep';
  if (upperMake.includes('NISSAN')) return 'Nissan';
  if (upperMake.includes('MITSUBISHI')) return 'Mitsubishi';
  if (upperMake.includes('CITROEN') || upperMake.includes('CITROËN')) return 'Citroën';
  if (upperMake.includes('PEUGEOT')) return 'Peugeot';
  if (upperMake.includes('CAOA') || upperMake.includes('CHERY')) return 'Caoa Chery';
  if (upperMake.includes('BMW')) return 'BMW';
  if (upperMake.includes('MERCEDES')) return 'Mercedes-Benz';
  if (upperMake.includes('AUDI')) return 'Audi';
  if (upperMake.includes('BYD')) return 'BYD';
  if (upperMake.includes('RAM')) return 'Ram';

  return make.charAt(0).toUpperCase() + make.slice(1).toLowerCase();
}

function simpleExtractTransmission(description: string, specificField?: string): string {
  const normalizedDesc = description.toUpperCase();
  const normalizedSpecific = (specificField || '').toUpperCase();

  if (normalizedSpecific.includes('AUTOMATICO') || normalizedSpecific.includes('AUTOMÁTICO')) return 'Automático';
  if (normalizedSpecific.includes('MANUAL')) return 'Manual';
  if (normalizedSpecific.includes('CVT')) return 'CVT';
  if (normalizedSpecific.includes('AUTOMATIZADO')) return 'Automatizado';

  if (
    normalizedDesc.includes('AUT.') ||
    normalizedDesc.includes('AUTOMATICO') ||
    normalizedDesc.includes(' AT ') ||
    normalizedDesc.endsWith(' AT') ||
    normalizedDesc.includes('TIPTRONIC')
  ) return 'Automático';

  if (
    normalizedDesc.includes('MAN.') ||
    normalizedDesc.includes('MANUAL') ||
    normalizedDesc.includes('MEC.') ||
    normalizedDesc.includes(' MT ') ||
    normalizedDesc.endsWith(' MT')
  ) return 'Manual';

  if (normalizedDesc.includes('CVT')) return 'CVT';

  if (
    normalizedDesc.includes('I-MOTION') ||
    normalizedDesc.includes('DUALOGIC') ||
    normalizedDesc.includes('POWERSHIFT') ||
    normalizedDesc.includes('EASYTRONIC')
  ) return 'Automatizado';

  return '';
}

function getBestFipeMatch(rawModel: string, fipeList: any[]): string | null {
  if (!fipeList || fipeList.length === 0) return null;
  if (!rawModel) return fipeList[0].texto_modelo;

  // Split both strings into words to count matches
  const splitWords = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 1);
  
  const rawWords = splitWords(rawModel);
  
  let bestMatch = fipeList[0];
  let maxScore = -1;

  for (const fipe of fipeList) {
    const fipeWords = splitWords(fipe.texto_modelo);
    let score = 0;
    
    for (const rw of rawWords) {
      // Partial matching (e.g. 'joye' matches 'joy')
      if (fipeWords.some(fw => fw.includes(rw) || rw.includes(fw))) {
        score++;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = fipe;
    }
  }

  return bestMatch.texto_modelo;
}
