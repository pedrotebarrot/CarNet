import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';

export async function GET(request: NextRequest) {
  const dealershipId = request.nextUrl.searchParams.get('dealershipId');
  if (!dealershipId) return NextResponse.json({ error: 'dealershipId required' }, { status: 400 });

  const db = getAdminDb();
  const snap = await db.doc(`dealerships/${dealershipId}`).get();
  const ml = snap.data()?.integrations?.mercadolivre;
  if (!ml?.accessToken) return NextResponse.json({ error: 'ML not connected' }, { status: 400 });

  const token = ml.accessToken;
  const userId = ml.userId;

  const [listingTypes, userInfo, items] = await Promise.all([
    fetch(`https://api.mercadolibre.com/categories/MLB1744/listing_types`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
    fetch(`https://api.mercadolibre.com/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
    fetch(`https://api.mercadolibre.com/users/${userId}/classifieds_promotion_packs?category_id=MLB1744`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
  ]);

  return NextResponse.json({ listingTypes, userInfo: { id: userInfo.id, nickname: userInfo.nickname, seller_reputation: userInfo.seller_reputation, tags: userInfo.tags }, classifiedPacks: items });
}
