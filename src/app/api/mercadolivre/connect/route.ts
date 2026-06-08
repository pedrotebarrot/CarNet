import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealershipId = searchParams.get('dealershipId');

  if (!dealershipId) {
    return new NextResponse('dealershipId obrigatório', { status: 400 });
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autosdigital.vercel.app').replace(/\/$/, '');

  const appId = process.env.ML_APP_ID;
  if (!appId) {
    return NextResponse.redirect(`${base}/dashboard/settings?ml_error=not_configured`);
  }

  const redirectUri = `${base}/api/mercadolivre/callback`;
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', dealershipId);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('scope', 'read_items write_items offline_access');

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('ml_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 300, // 5 minutos
    path: '/',
  });

  return response;
}
