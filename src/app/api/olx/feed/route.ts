/**
 * OLX JSON feed — formato autoupload para veículos
 * URL: /api/olx/feed?slug=<dealership-slug>
 *
 * OLX puxa este endpoint periodicamente para sincronizar o estoque.
 * Categoria 2020 = Carros, Vans e Utilitários
 */
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export const revalidate = 0;

function mapOlxFuel(fuel: string): string {
  const f = fuel.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (f.includes('flex'))                              return 'flex';
  if (f.includes('eletric') || f.includes('eletro'))  return 'eletrico';
  if (f.includes('hibrido') || f.includes('hybrid'))  return 'hibrido';
  if (f.includes('diesel'))                            return 'diesel';
  if (f.includes('gas natural') || f.includes('gnv')) return 'gnv';
  if (f.includes('etanol') || f.includes('alcool'))   return 'alcool';
  return 'gasolina';
}

function mapOlxTransmission(t: string): string {
  const s = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (s.includes('auto') || s.includes('cvt')) return 'automatico';
  return 'manual';
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

  // Fetch available vehicles
  const vSnap = await getDocs(
    query(
      collection(db, 'vehicles'),
      where('dealershipId', '==', dealership.id),
      where('status', '==', 'available')
    )
  );
  const vehicles = vSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  const ads = vehicles.map(v => {
    const priceReais = Math.round((v.price ?? 0) / 100);
    const mileage    = Math.max(0, v.mileage ?? 0);
    const images     = (v.images ?? []).slice(0, 20);
    const subject    = `${v.make} ${v.model} ${v.year}/${v.modelYear ?? v.year}`;
    const body       =
      v.description ||
      `${subject} — ${mileage.toLocaleString('pt-BR')} km, ${v.fuel}, ${v.transmission}, ${v.color}` +
      (v.doors ? `, ${v.doors} portas` : '') +
      (v.plateEnding ? `. Final de placa: ${v.plateEnding}` : '') +
      '.';

    return {
      id:       v.id,
      subject,
      body,
      category: { id: '2020' },
      price:    priceReais > 0
        ? { price: priceReais, negotiable: '1' }
        : { negotiable: '1' },
      phone: {
        phone:        (dealership.phone ?? '').replace(/\D/g, ''),
        phone_hidden: '0',
      },
      params: {
        cartype:   [{ key: 'carros_e_caminhonetes' }],
        marca:     v.make,
        modelo:    v.model,
        fuel:      [{ key: mapOlxFuel(v.fuel) }],
        car_color: [{ key: v.color.toLowerCase() }],
        gearbox:   [{ key: mapOlxTransmission(v.transmission) }],
        ...(v.doors     ? { doors:    [{ key: String(v.doors) }] }    : {}),
        ...(mileage > 0 ? { mileage:  [{ key: String(Math.round(mileage / 1000) * 1000) }] } : {}),
        ...(v.year      ? { car_year: [{ key: String(v.year) }] }     : {}),
      },
      images: images.map((url: string, i: number) => ({
        url,
        label: i === 0 ? 'capa' : String(i),
      })),
    };
  });

  const feed = { ads };

  return NextResponse.json(feed, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
