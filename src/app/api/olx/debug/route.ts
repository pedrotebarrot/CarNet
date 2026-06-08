/**
 * Debug OLX integration — GET /api/olx/debug?dealershipId=...
 * Shows token status, user info, and tests the API endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealershipId = searchParams.get('dealershipId');
  if (!dealershipId) return NextResponse.json({ error: 'dealershipId required' }, { status: 400 });

  const db   = getAdminDb();
  const snap = await db.doc(`dealerships/${dealershipId}`).get();
  if (!snap.exists) return NextResponse.json({ error: 'dealership not found' }, { status: 404 });

  const data = snap.data() as any;
  const olx  = data?.integrations?.olx;

  const result: Record<string, any> = {
    olx_integration: {
      connected:    olx?.connected ?? false,
      hasToken:     Boolean(olx?.accessToken),
      hasRefresh:   Boolean(olx?.refreshToken),
      expiresAt:    olx?.expiresAt ?? null,
      connectedAt:  olx?.connectedAt ?? null,
    },
  };

  // Test token against OLX API
  const token = olx?.accessToken;
  if (token) {
    // Test 1: get user info
    const userRes = await fetch('https://api.olx.com.br/users/me', {
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
    });
    result.user_info = {
      status: userRes.status,
      body:   await userRes.text().then(t => t.slice(0, 500)).catch(() => '(failed)'),
    };

    // Test 2: check autoupload endpoint with GET (to check if URL exists)
    const uploadRes = await fetch('https://api.olx.com.br/autoupload/v1.0/insertado', {
      method:  'GET',
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
    });
    result.endpoint_test_v1 = {
      url:    'https://api.olx.com.br/autoupload/v1.0/insertado',
      status: uploadRes.status,
      body:   await uploadRes.text().then(t => t.slice(0, 500)).catch(() => '(failed)'),
    };

    // Test 3: try alternate endpoint
    const uploadRes2 = await fetch('https://api.olx.com.br/autoupload/insertado', {
      method:  'GET',
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
    });
    result.endpoint_test_no_version = {
      url:    'https://api.olx.com.br/autoupload/insertado',
      status: uploadRes2.status,
      body:   await uploadRes2.text().then(t => t.slice(0, 500)).catch(() => '(failed)'),
    };

    // Test 4: try ads endpoint
    const adsRes = await fetch('https://api.olx.com.br/ads', {
      method:  'GET',
      headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' },
    });
    result.endpoint_test_ads = {
      url:    'https://api.olx.com.br/ads',
      status: adsRes.status,
      body:   await adsRes.text().then(t => t.slice(0, 500)).catch(() => '(failed)'),
    };
  }

  return NextResponse.json(result, { status: 200 });
}
