
import { vehicleModels, VehicleMake } from '@/lib/vehicle-data';

export function findBestModelMatch(make: string, apiModel: string): string | null {
    // Cast make to VehicleMake if it exists in our list
    // If exact make string is not in our keys, we can't look up models.
    // However, we normalized 'make' before calling this.
    // We should check if the normalized make is actually a valid key.

    const validMake = Object.keys(vehicleModels).find(k => k === make) as VehicleMake | undefined;

    if (!validMake) return null;

    const knownModels = vehicleModels[validMake];
    if (!knownModels) return null;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedApiModel = normalize(apiModel);

    // Sort known models by length descending to match specific models first 
    // (e.g. match "Pajero Sport" before "Pajero" if both were plausible, though usually we want to finding contained strings)
    const sortedModels = [...knownModels].sort((a, b) => b.length - a.length);

    for (const knownModel of sortedModels) {
        const normalizedKnown = normalize(knownModel);
        // Check if API model contains the known model (e.g. "207HB XS A" contains "207")
        if (normalizedApiModel.includes(normalizedKnown)) {
            return knownModel;
        }
    }

    return null;
}
