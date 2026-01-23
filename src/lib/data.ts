export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
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
    make: 'Volkswagen',
    model: 'Golf',
    year: 2021,
    mileage: 15000,
    price: 120000,
    description: 'Carro em excelente estado, único dono. Todas as revisões feitas na concessionária. Versão Highline com teto solar e painel digital.',
    status: 'available',
    images: ['https://picsum.photos/seed/car1/800/600', 'https://picsum.photos/seed/car-interior1/800/600', 'https://picsum.photos/seed/car-detail1/800/600'],
    featuredImage: 'https://picsum.photos/seed/car1/800/600',
  },
  {
    id: '2',
    make: 'Chevrolet',
    model: 'Onix',
    year: 2022,
    mileage: 5000,
    price: 85000,
    description: 'Praticamente novo, com baixa quilometragem. Versão LTZ, completo com multimídia MyLink e OnStar.',
    status: 'available',
    images: ['https://picsum.photos/seed/car2/800/600', 'https://picsum.photos/seed/car-interior2/800/600'],
    featuredImage: 'https://picsum.photos/seed/car2/800/600',
  },
  {
    id: '3',
    make: 'Ford',
    model: 'Mustang',
    year: 2020,
    mileage: 25000,
    price: 350000,
    description: 'Ícone americano em sua melhor forma. Motor V8 potente e ronco inconfundível. Cuidado com extremo zelo.',
    status: 'sold',
    images: ['https://picsum.photos/seed/car3/800/600'],
    featuredImage: 'https://picsum.photos/seed/car3/800/600',
  },
  {
    id: '4',
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    mileage: 45000,
    price: 110000,
    description: 'Confiabilidade japonesa com design esportivo. Versão Touring com motor turbo. Ótimo para a cidade e estrada.',
    status: 'available',
    images: ['https://picsum.photos/seed/car4/800/600'],
    featuredImage: 'https://picsum.photos/seed/car4/800/600',
  },
  {
    id: '5',
    make: 'Toyota',
    model: 'Corolla',
    year: 2023,
    mileage: 1000,
    price: 150000,
    description: 'O sedan mais vendido do Brasil, agora em sua versão híbrida. Economia e tecnologia de ponta. Cheira a novo.',
    status: 'available',
    images: ['https://picsum.photos/seed/car5/800/600'],
    featuredImage: 'https://picsum.photos/seed/car5/800/600',
  },
  {
    id: '6',
    make: 'Fiat',
    model: 'Toro',
    year: 2018,
    mileage: 80000,
    price: 95000,
    description: 'Picape versátil e robusta. Versão Freedom com motor diesel e tração 4x4. Ideal para trabalho e lazer.',
    status: 'unavailable',
    images: ['https://picsum.photos/seed/car6/800/600'],
    featuredImage: 'https://picsum.photos/seed/car6/800/600',
  },
  {
    id: '7',
    make: 'Jeep',
    model: 'Renegade',
    year: 2022,
    mileage: 12000,
    price: 130000,
    description: 'SUV compacto e valente. Versão Longitude com motor turbo flex. Ótimo estado de conservação.',
    status: 'available',
    images: ['https://picsum.photos/seed/car7/800/600'],
    featuredImage: 'https://picsum.photos/seed/car7/800/600',
  },
];
