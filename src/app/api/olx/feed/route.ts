/**
 * OLX JSON feed — formato autoupload para veículos
 * URL: /api/olx/feed?slug=<dealership-slug>
 *
 * OLX puxa este endpoint periodicamente (mínimo diário) para sincronizar.
 * Retorna array JSON raiz conforme documentação:
 * https://developers.olx.com.br/anuncio/json/autos/home.html
 *
 * Categoria 2020 = Carros, Vans e Utilitários
 */
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export const revalidate = 0;

// Fuel: "1"=Gasolina "2"=Etanol "3"=Flex "4"=GNV "5"=Diesel "6"=Híbrido "7"=Elétrico
function mapFuel(fuel: string): string {
  const f = fuel.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (f.includes('flex'))                              return '3';
  if (f.includes('eletric') || f.includes('eletro'))  return '7';
  if (f.includes('hibrido') || f.includes('hybrid'))  return '6';
  if (f.includes('diesel'))                            return '5';
  if (f.includes('gas natural') || f.includes('gnv')) return '4';
  if (f.includes('etanol') || f.includes('alcool'))   return '2';
  return '1'; // Gasolina
}

// Gearbox: "1"=Manual "2"=Automático "3"=Semiautomático
function mapGearbox(t: string): string {
  const s = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (s.includes('cvt') || s.includes('auto')) return '2';
  if (s.includes('semi') || s.includes('automatizado')) return '3';
  return '1'; // Manual
}

// OLX id: max 19 chars, only [A-Za-z0-9_{}-]
function olxId(firestoreId: string): string {
  return firestoreId.replace(/[^A-Za-z0-9_{}\\-]/g, '').slice(0, 19);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) return new NextResponse('slug obrigatório', { status: 400 });

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  // Fetch dealership
  const dSnap = await getDocs(
    query(collection(db, 'dealerships'), where('slug', '==', slug), limit(1))
  );
  if (dSnap.empty) return new NextResponse('Not found', { status: 404 });
  const dealership = { id: dSnap.docs[0].id, ...dSnap.docs[0].data() } as any;

  // zipcode é obrigatório — usar o CEP cadastrado na revenda
  const zipcode = (dealership.zipcode ?? '').replace(/\D/g, '');

  // Fetch vehicles enabled for OLX (available + olxEnabled)
  const vSnap = await getDocs(
    query(
      collection(db, 'vehicles'),
      where('dealershipId', '==', dealership.id),
      where('status',     '==', 'available'),
      where('olxEnabled', '==', true)
    )
  );
  const vehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  // Formato correto conforme docs OLX JSON:
  // - raiz é array []
  // - images é array de strings
  // - category é integer
  // - price é integer
  // - mileage é integer dentro de params
  // - type: "s" obrigatório
  // - zipcode obrigatório
  const ads = vehicles
    .filter(v => zipcode || true) // zipcode validated below
    .map(v => {
      const priceReais = Math.round((v.price ?? 0) / 100);
      const mileage    = Math.max(0, v.mileage ?? 0);
      const images     = (v.images ?? []) as string[];
      const subject    = `${v.make} ${v.model} ${v.year}/${v.modelYear ?? v.year}`;
      const body       = (
        v.description ||
        `${subject} — ${mileage.toLocaleString('pt-BR')} km, ${v.fuel}, ` +
        `${v.transmission}, ${v.color}` +
        (v.doors ? `, ${v.doors} portas` : '') +
        (v.plateEnding ? `. Final de placa: ${v.plateEnding}` : '') +
        '.'
      ).slice(0, 6000);

      const ad: Record<string, any> = {
        id:       olxId(v.id),
        subject:  subject.slice(0, 90),
        body,
        category: 2020,
        type:     's',
        // zipcode: use dealership CEP (required by OLX)
        ...(zipcode ? { zipcode } : {}),
        ...(priceReais > 0 ? { price: priceReais } : {}),
        ...(images.length  ? { images: images.slice(0, 20) } : {}),
        params: {
          regdate: String(v.year ?? new Date().getFullYear()),
          fuel:    mapFuel(v.fuel ?? ''),
          gearbox: mapGearbox(v.transmission ?? ''),
          ...(mileage > 0 ? { mileage } : {}),
        },
      };

      return ad;
    });

  // OLX espera array raiz — NÃO um objeto wrapper
  return NextResponse.json(ads, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store', // feed sempre fresco
    },
  });
}
