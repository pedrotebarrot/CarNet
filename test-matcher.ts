
import { findBestModelMatch } from './src/ai/flows/model-matcher';
import { vehicleModels } from './src/lib/vehicle-data';

console.log("Testing Model Matcher...");

const testCases = [
    { make: 'Peugeot', apiModel: '207HB XS A', expected: '207' },
    { make: 'Peugeot', apiModel: '208 LIKE', expected: '208' },
    { make: 'Honda', apiModel: 'CIVIC LXR', expected: 'Civic' },
    { make: 'Chevrolet', apiModel: 'ONIX 1.0 MT', expected: 'Onix' },
    { make: 'Volkswagen', apiModel: 'SANTANA CG', expected: 'Santana' }, // Fixed by my previous expansion
];

testCases.forEach(({ make, apiModel, expected }) => {
    const result = findBestModelMatch(make, apiModel);
    console.log(`[${make}] API: "${apiModel}" -> Match: "${result}" (Expected: "${expected}")`);

    if (result !== expected) {
        console.error(`FAILED: Expected ${expected}, got ${result}`);
    }
});
