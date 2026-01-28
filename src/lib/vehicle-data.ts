export const vehicleMakes = [
  'Fiat', 'Honda', 'BYD', 'Chevrolet', 'Renault', 'Jeep', 'Volkswagen', 'Ford', 'Toyota', 'Hyundai', 'Caoa Chery', 'Peugeot', 'Citroën', 'Mitsubishi', 'Nissan', 'Ram', 'Mercedes-Benz', 'BMW', 'Audi'
] as const;

export type VehicleMake = typeof vehicleMakes[number];

export const vehicleModels: Record<VehicleMake, string[]> = {
  Fiat: ['Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Toro', 'Strada', 'Fiorino'],
  Honda: ['City', 'City Hatch', 'HR-V', 'ZR-V', 'Civic'],
  BYD: ['Dolphin', 'Dolphin Mini', 'Seal', 'Yuan Plus', 'Song Plus'],
  Chevrolet: ['Onix', 'Onix Plus', 'Tracker', 'Montana', 'S10', 'Spin', 'Equinox', 'Trailblazer', 'Silverado'],
  Renault: ['Kwid', 'Stepway', 'Logan', 'Duster', 'Oroch', 'Master', 'Kardian'],
  Jeep: ['Renegade', 'Compass', 'Commander'],
  Volkswagen: ['Polo', 'Nivus', 'T-Cross', 'Taos', 'Virtus', 'Saveiro', 'Amarok', 'Jetta'],
  Ford: ['Ranger', 'Territory', 'Mustang Mach-E', 'Bronco Sport', 'Maverick'],
  Toyota: ['Corolla', 'Corolla Cross', 'Yaris', 'Yaris Sedan', 'Hilux', 'RAV4', 'SW4'],
  Hyundai: ['HB20', 'HB20S', 'Creta'],
  'Caoa Chery': ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6'],
  Peugeot: ['208', '2008', '3008'],
  Citroën: ['C3', 'C4 Cactus'],
  Mitsubishi: ['L200 Triton', 'Eclipse Cross', 'Pajero Sport'],
  Nissan: ['Kicks', 'Versa', 'Frontier'],
  Ram: ['Rampage', '1500', '2500', '3500'],
  'Mercedes-Benz': ['Classe C', 'Classe A', 'GLA', 'GLC'],
  BMW: ['Série 3', 'X1', 'Série 1'],
  Audi: ['A3', 'Q3', 'Q5']
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
