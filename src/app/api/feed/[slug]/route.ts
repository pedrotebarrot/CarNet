import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export const revalidate = 0;

function escapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatKm(km: number): string {
  return new Intl.NumberFormat('pt-BR').format(km ?? 0);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

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

  const today = new Date().toISOString().split('T')[0];
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const phone = (dealership.phone ?? '').replace(/\D/g, '');

  const listings = vehicles.map(v => {
    const priceReais = Math.round((v.price ?? 0) / 100);
    const title = escapeXml(`${v.make} ${v.model} ${v.year}/${v.modelYear}`);
    const body = escapeXml(
      v.description ||
      `${v.make} ${v.model} ${v.year}/${v.modelYear} — ${formatKm(v.mileage)} km, ${v.fuel}, ${v.transmission}, ${v.color}, ${v.doors} portas. Final de placa: ${v.plateEnding}.`
    );
    const images = (v.images ?? []).slice(0, 20)
      .map((img: string) => `      <Image>${img}</Image>`)
      .join('\n');

    return `  <Listing>
    <Id>${v.id}</Id>
    <Title>${title}</Title>
    <Price>${priceReais}</Price>
    <Body>${body}</Body>
    <Category>carros-vans-e-utilitarios</Category>
    <Phone>${phone}</Phone>
    <PostingDate>${today}</PostingDate>
    <ExpirationDate>${expiry}</ExpirationDate>
    ${images ? `<Images>\n${images}\n    </Images>` : ''}
    <Features>
      <Feature name="marca">${escapeXml(v.make)}</Feature>
      <Feature name="modelo">${escapeXml(v.model)}</Feature>
      <Feature name="ano">${v.year}</Feature>
      <Feature name="ano_modelo">${v.modelYear}</Feature>
      <Feature name="quilometragem">${v.mileage ?? 0}</Feature>
      <Feature name="cambio">${escapeXml(v.transmission)}</Feature>
      <Feature name="combustivel">${escapeXml(v.fuel)}</Feature>
      <Feature name="cor">${escapeXml(v.color)}</Feature>
      <Feature name="portas">${v.doors}</Feature>
      <Feature name="final_placa">${escapeXml(v.plateEnding)}</Feature>
    </Features>
  </Listing>`;
  }).join('\n\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListingService xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Listings>
${listings}
  </Listings>
</ListingService>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
