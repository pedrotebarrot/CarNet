import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealershipId = searchParams.get('dealershipId');

  if (!dealershipId) {
    return new NextResponse('dealershipId obrigatório', { status: 400 });
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autosdigital.vercel.app').replace(/\/$/, '');

  const clientId = process.env.OLX_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(`${base}/dashboard/settings?olx_error=not_configured`);
  }

  const redirectUri = `${base}/api/olx/callback`;

  const authUrl = new URL('https://auth.olx.com.br/oauth/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', dealershipId);
  authUrl.searchParams.set('scope', 'basic_user_info autoupload');

  return NextResponse.redirect(authUrl.toString());
}
