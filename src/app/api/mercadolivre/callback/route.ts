import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autosdigital.vercel.app';
  const { searchParams } = new URL(request.url);

  const code        = searchParams.get('code');
  const dealershipId = searchParams.get('state');
  const error       = searchParams.get('error');

  if (error || !code || !dealershipId) {
    return NextResponse.redirect(`${base}/dashboard/settings?ml_error=acesso_negado`);
  }

  const appId      = process.env.ML_APP_ID;
  const secret     = process.env.ML_SECRET_KEY;
  const redirectUri = `${base}/api/mercadolivre/callback`;

  if (!appId || !secret) {
    return NextResponse.redirect(`${base}/dashboard/settings?ml_error=not_configured`);
  }

  try {
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     appId,
        client_secret: secret,
        code,
        redirect_uri:  redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('ML token exchange failed:', err);
      return NextResponse.redirect(`${base}/dashboard/settings?ml_error=token_failed`);
    }

    const tokens = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db  = getFirestore(app);

    await updateDoc(doc(db, 'dealerships', dealershipId), {
      'integrations.mercadolivre': {
        connected:    true,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token,
        userId:       tokens.user_id,
        expiresAt,
        connectedAt:  new Date(),
      },
    });

    return NextResponse.redirect(`${base}/dashboard/settings?ml_connected=1`);
  } catch (err) {
    console.error('ML OAuth error:', err);
    return NextResponse.redirect(`${base}/dashboard/settings?ml_error=oauth_failed`);
  }
}
