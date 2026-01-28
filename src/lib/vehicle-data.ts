export const vehicleMakes = [
  'Fiat', 'Honda', 'BYD', 'Chevrolet', 'Renault', 'Jeep', 'Volkswagen', 'Ford', 'Toyota', 'Hyundai', 'Caoa Chery', 'Peugeot', 'Citroën', 'Mitsubishi', 'Nissan', 'Ram', 'Mercedes-Benz', 'BMW', 'Audi'
] as const;

export type VehicleMake = typeof vehicleMakes[number];

export const vehicleModels: Record<VehicleMake, string[]> = {
  Fiat: ['Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Toro', 'Strada', 'Fiorino', 'Uno', 'Palio', 'Siena'],
  Honda: ['City', 'City Hatch', 'HR-V', 'ZR-V', 'Civic', 'Fit', 'WR-V'],
  BYD: ['Dolphin', 'Dolphin Mini', 'Seal', 'Yuan Plus', 'Song Plus'],
  Chevrolet: ['Onix', 'Onix Plus', 'Tracker', 'Montana', 'S10', 'Spin', 'Equinox', 'Trailblazer', 'Silverado', 'Celta', 'Cruze'],
  Renault: ['Kwid', 'Stepway', 'Logan', 'Duster', 'Oroch', 'Master', 'Kardian', 'Sandero', 'Captur'],
  Jeep: ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Gladiator'],
  Volkswagen: ['Polo', 'Nivus', 'T-Cross', 'Taos', 'Virtus', 'Saveiro', 'Amarok', 'Jetta', 'Gol', 'Voyage', 'Tiguan'],
  Ford: ['Ranger', 'Territory', 'Mustang Mach-E', 'Bronco Sport', 'Maverick', 'Ka', 'EcoSport'],
  Toyota: ['Corolla', 'Corolla Cross', 'Yaris', 'Yaris Sedan', 'Hilux', 'RAV4', 'SW4'],
  Hyundai: ['HB20', 'HB20S', 'Creta', 'Tucson', 'i30'],
  'Caoa Chery': ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6', 'Tiggo 2', 'Tiggo 3X'],
  Peugeot: ['208', '2008', '3008', 'Partner'],
  Citroën: ['C3', 'C4 Cactus', 'Aircross', 'Jumpy'],
  Mitsubishi: ['L200 Triton', 'Eclipse Cross', 'Pajero Sport', 'Outlander'],
  Nissan: ['Kicks', 'Versa', 'Frontier', 'March', 'Sentra'],
  Ram: ['Rampage', '1500', '2500', '3500'],
  'Mercedes-Benz': ['Classe C', 'Classe A', 'GLA', 'GLC', 'Sprinter'],
  BMW: ['Série 3', 'X1', 'Série 1', 'X3', 'X5'],
  Audi: ['A3', 'A4', 'Q3', 'Q5']
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
