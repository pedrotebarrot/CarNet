import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealershipId = searchParams.get('dealershipId');

  if (!dealershipId) {
    return new NextResponse('dealershipId obrigatório', { status: 400 });
  }

  const appId = process.env.ML_APP_ID;
  if (!appId) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autosdigital.vercel.app';
    return NextResponse.redirect(`${base}/dashboard/settings?ml_error=not_configured`);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autosdigital.vercel.app';
  const redirectUri = `${base}/api/mercadolivre/callback`;

  const authUrl = new URL('https://auth.mercadolibre.com.br/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', dealershipId);

  return NextResponse.redirect(authUrl.toString());
}
