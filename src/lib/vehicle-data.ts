export const vehicleMakes = [
  'Fiat', 'Honda', 'BYD', 'Chevrolet', 'Renault', 'Jeep', 'Volkswagen', 'Ford', 'Toyota', 'Hyundai', 'Caoa Chery', 'Peugeot', 'Citroën', 'Mitsubishi', 'Nissan', 'Ram', 'Mercedes-Benz', 'BMW', 'Audi'
] as const;

export type VehicleMake = typeof vehicleMakes[number];

export const vehicleModels: Record<VehicleMake, string[]> = {
  Fiat: ['Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Toro', 'Strada', 'Fiorino', 'Uno', 'Palio', 'Siena', 'Grand Siena', 'Idea', 'Punto', 'Linea', 'Stilo', 'Doblo', 'Weekend', '500', 'Freemont', 'Ducato'],
  Honda: ['City', 'City Hatch', 'HR-V', 'ZR-V', 'Civic', 'Fit', 'WR-V', 'CR-V', 'Accord', 'CR-V Hybrid', 'Civic Type R'],
  BYD: ['Dolphin', 'Dolphin Mini', 'Seal', 'Yuan Plus', 'Song Plus', 'Tan', 'Han', 'King', 'Shark'],
  Chevrolet: ['Onix', 'Onix Plus', 'Tracker', 'Montana', 'S10', 'Spin', 'Equinox', 'Trailblazer', 'Silverado', 'Celta', 'Cruze', 'Agile', 'Cobalt', 'Prisma', 'Sonic', 'Captiva', 'Malibu', 'Camaro', 'Corvette', 'Meriva', 'Zafira', 'Vectra', 'Astra', 'Classic', 'Omega', 'Blazer'],
  Renault: ['Kwid', 'Stepway', 'Logan', 'Duster', 'Oroch', 'Master', 'Kardian', 'Sandero', 'Captur', 'Clio', 'Fluence', 'Symbol', 'Megane', 'Scenic', 'Kangoo'],
  Jeep: ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Gladiator', 'Grand Cherokee'],
  Volkswagen: ['Polo', 'Nivus', 'T-Cross', 'Taos', 'Virtus', 'Saveiro', 'Amarok', 'Jetta', 'Gol', 'Voyage', 'Tiguan', 'Fox', 'SpaceFox', 'CrossFox', 'Up!', 'Golf', 'Bora', 'Passat', 'Fusca', 'Kombi', 'Parati', 'Santana', 'Touareg'],
  Ford: ['Ranger', 'Territory', 'Mustang Mach-E', 'Bronco Sport', 'Maverick', 'Ka', 'Ka Sedan', 'EcoSport', 'Fiesta', 'Focus', 'Fusion', 'Edge', 'Escort', 'F-150', 'F-250', 'Courier'],
  Toyota: ['Corolla', 'Corolla Cross', 'Yaris', 'Yaris Sedan', 'Hilux', 'RAV4', 'SW4', 'Camry', 'Prius', 'Etios', 'Etios Sedan', 'Fielder', 'Supra', 'Tacoma'],
  Hyundai: ['HB20', 'HB20S', 'Creta', 'Tucson', 'i30', 'ix35', 'Santa Fe', 'Azera', 'Elantra', 'Veloster', 'iX35', 'HR', 'Vera Cruz', 'Sonata'],
  'Caoa Chery': ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6', 'Tiggo 2', 'Tiggo 3X', 'iCar', 'QQ', 'Celer', 'Face'],
  Peugeot: ['208', '2008', '3008', 'Partner', '206', '207', '307', '308', '408', 'Expert', 'Boxer', 'RCZ'],
  Citroën: ['C3', 'C4 Cactus', 'Aircross', 'Jumpy', 'C4 Lounge', 'C3 Picasso', 'C5 Aircross', 'Berlingo', 'DS3', 'C4 Pallas', 'Xsara Picasso'],
  Mitsubishi: ['L200 Triton', 'Eclipse Cross', 'Pajero Sport', 'Outlander', 'ASX', 'Pajero Full', 'Pajero TR4', 'Pajero Dakar', 'Lancer'],
  Nissan: ['Kicks', 'Versa', 'Frontier', 'March', 'Sentra', 'Tiida', 'Livina', 'Grand Livina', 'Leaf', 'X-Trail', 'Pathfinder'],
  Ram: ['Rampage', '1500', '2500', '3500', 'Classic'],
  'Mercedes-Benz': ['Classe C', 'Classe A', 'GLA', 'GLC', 'Sprinter', 'CLA', 'Classe E', 'GLE', 'GLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS'],
  BMW: ['Série 3', 'X1', 'Série 1', 'X3', 'X5', 'X2', 'X4', 'X6', 'Série 5', 'Série 4', 'iX', 'iX1', 'i4', 'M3', 'M4'],
  Audi: ['A3', 'A4', 'Q3', 'Q5', 'A5', 'Q7', 'Q8', 'e-tron', 'Q4 e-tron', 'A1', 'TT', 'A6', 'RS6', 'RS Q8']
};

export const getYears = () => {
  const endYear = 2027;
  const startYear = 1950;
  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year.toString());
  }
  return years;
};

export const vehicleTransmissions = [
  'Automático',
  'Manual',
  'CVT',
  'Automatizado',
] as const;

export type VehicleTransmission = typeof vehicleTransmissions[number];
