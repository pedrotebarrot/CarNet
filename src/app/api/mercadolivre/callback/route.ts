import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';

export async function GET(request: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autosdigital.vercel.app').replace(/\/$/, '');
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

  const codeVerifier = request.cookies.get('ml_code_verifier')?.value;

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
        ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('ML token exchange failed:', errText);
      const detail = encodeURIComponent(errText.slice(0, 200));
      return NextResponse.redirect(`${base}/dashboard/settings?ml_error=token_failed&ml_detail=${detail}`);
    }

    const tokens = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const db = getAdminDb();

    await db.doc(`dealerships/${dealershipId}`).update({
      'integrations.mercadolivre': {
        connected:   true,
        accessToken: tokens.access_token,
        userId:      tokens.user_id,
        expiresAt,
        connectedAt: new Date(),
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
    });

    const successRes = NextResponse.redirect(`${base}/dashboard/settings?ml_connected=1`);
    successRes.cookies.delete('ml_code_verifier');
    return successRes;
  } catch (err: any) {
    console.error('ML OAuth error:', err);
    const detail = encodeURIComponent(String(err?.message ?? err).slice(0, 200));
    return NextResponse.redirect(`${base}/dashboard/settings?ml_error=oauth_failed&ml_detail=${detail}`);
  }
}
