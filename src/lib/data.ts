export type Vehicle = {
  id: string;
  plate: string;
  make: string;
  model: string;
  version: string;
  year: number;
  modelYear: number;
  engine: string;
  mileage: number;
  price: number;
  description: string;
  status: 'available' | 'sold' | 'unavailable';
  images: string[];
  featuredImage: string;
};

export const vehicles: Vehicle[] = [
  {
    id: '1',
    plate: 'BRA2E19',
    make: 'Volkswagen',
    model: 'Golf',
    version: 'Highline 1.4 TSI',
    year: 2021,
    modelYear: 2021,
    engine: '1.4 TSI',
    mileage: 15000,
    price: 120000,
    description: 'Carro em excelente estado, único dono. Todas as revisões feitas na concessionária. Versão Highline com teto solar e painel digital.',
    status: 'available',
    images: ['https://picsum.photos/seed/car1/800/600', 'https://picsum.photos/seed/car-interior1/800/600', 'https://picsum.photos/seed/car-detail1/800/600'],
    featuredImage: 'https://picsum.photos/seed/car1/800/600',
  },
  {
    id: '2',
    plate: 'ABC1234',
    make: 'Chevrolet',
    model: 'Onix',
    version: 'LTZ 1.0 Turbo',
    year: 2022,
    modelYear: 2022,
    engine: '1.0 Turbo',
    mileage: 5000,
    price: 85000,
    description: 'Praticamente novo, com baixa quilometragem. Versão LTZ, completo com multimídia MyLink e OnStar.',
    status: 'available',
    images: ['https://picsum.photos/seed/car2/800/600', 'https://picsum.photos/seed/car-interior2/800/600'],
    featuredImage: 'https://picsum.photos/seed/car2/800/600',
  },
  {
    id: '3',
    plate: 'XYZ5678',
    make: 'Ford',
    model: 'Mustang',
    version: 'GT Premium 5.0 V8',
    year: 2020,
    modelYear: 2020,
    engine: '5.0 V8',
    mileage: 25000,
    price: 350000,
    description: 'Ícone americano em sua melhor forma. Motor V8 potente e ronco inconfundível. Cuidado com extremo zelo.',
    status: 'sold',
    images: ['https://picsum.photos/seed/car3/800/600'],
    featuredImage: 'https://picsum.photos/seed/car3/800/600',
  },
  {
    id: '4',
    plate: 'JKL4321',
    make: 'Honda',
    model: 'Civic',
    version: 'Touring 1.5 Turbo',
    year: 2019,
    modelYear: 2019,
    engine: '1.5 Turbo',
    mileage: 45000,
    price: 110000,
    description: 'Confiabilidade japonesa com design esportivo. Versão Touring com motor turbo. Ótimo para a cidade e estrada.',
    status: 'available',
    images: ['https://picsum.photos/seed/car4/800/600'],
    featuredImage: 'https://picsum.photos/seed/car4/800/600',
  },
  {
    id: '5',
    plate: 'MNO9876',
    make: 'Toyota',
    model: 'Corolla',
    version: 'Altis Hybrid 1.8',
    year: 2023,
    modelYear: 2023,
    engine: '1.8 Hybrid',
    mileage: 1000,
    price: 150000,
    description: 'O sedan mais vendido do Brasil, agora em sua versão híbrida. Economia e tecnologia de ponta. Cheira a novo.',
    status: 'available',
    images: ['https://picsum.photos/seed/car5/800/600'],
    featuredImage: 'https://picsum.photos/seed/car5/800/600',
  },
  {
    id: '6',
    plate: 'PQR6543',
    make: 'Fiat',
    model: 'Toro',
    version: 'Volcano 2.0 Diesel 4x4',
    year: 2018,
    modelYear: 2018,
    engine: '2.0 Diesel',
    mileage: 80000,
    price: 95000,
    description: 'Picape versátil e robusta. Versão Volcano com motor diesel e tração 4x4. Ideal para trabalho e lazer.',
    status: 'unavailable',
    images: ['https://picsum.photos/seed/car6/800/600'],
    featuredImage: 'https://picsum.photos/seed/car6/800/600',
  },
  {
    id: '7',
    plate: 'STU3210',
    make: 'Jeep',
    model: 'Renegade',
    version: 'Longitude 1.3 Turbo',
    year: 2022,
    modelYear: 2022,
    engine: '1.3 Turbo',
    mileage: 12000,
    price: 130000,
    description: 'SUV compacto e valente. Versão Longitude com motor turbo flex. Ótimo estado de conservação.',
    status: 'available',
    images: ['https://picsum.photos/seed/car7/800/600'],
    featuredImage: 'https://picsum.photos/seed/car7/800/600',
  },
];
