import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/firebase/admin';
import { registerOlxWebhooks } from '@/lib/olx/register-webhooks';

export async function GET(request: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autosdigital.vercel.app').replace(/\/$/, '');
  const { searchParams } = new URL(request.url);

  const code         = searchParams.get('code');
  const dealershipId = searchParams.get('state');
  const error        = searchParams.get('error');

  if (error || !code || !dealershipId) {
    return NextResponse.redirect(`${base}/dashboard/settings?olx_error=acesso_negado`);
  }

  const clientId     = process.env.OLX_CLIENT_ID;
  const clientSecret = process.env.OLX_CLIENT_SECRET;
  const redirectUri  = `${base}/api/olx/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/dashboard/settings?olx_error=not_configured`);
  }

  try {
    const tokenRes = await fetch('https://auth.olx.com.br/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     clientId,
        client_secret: clientSecret,
        code,
        redirect_uri:  redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('OLX token exchange failed:', errText);
      const detail = encodeURIComponent(errText.slice(0, 200));
      return NextResponse.redirect(`${base}/dashboard/settings?olx_error=token_failed&olx_detail=${detail}`);
    }

    const tokens = await tokenRes.json();
    // OLX tokens: access_token, refresh_token, expires_in, token_type
    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000);

    // Fetch the OLX account holder's name/email. OLX support asks for this
    // email when registering each dealer's feed, so capturing it at connect
    // time saves a support round-trip per customer.
    // NOTE: OLX's WAF returns 543/544 to requests without a browser-like
    // User-Agent — the header below is required, not cosmetic.
    let accountEmail: string | null = null;
    let accountName:  string | null = null;
    try {
      const infoRes = await fetch('https://apps.olx.com.br/oauth_api/basic_user_info', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ access_token: tokens.access_token }),
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        accountEmail = info?.user_email ?? null;
        accountName  = info?.user_name  ?? null;
      }
    } catch (err) {
      console.warn('[OLX callback] basic_user_info failed (non-fatal):', err);
    }

    const db = getAdminDb();

    await db.doc(`dealerships/${dealershipId}`).update({
      'integrations.olx': {
        connected:    true,
        accessToken:  tokens.access_token,
        expiresAt,
        connectedAt:  new Date(),
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        ...(tokens.user_id       ? { userId: tokens.user_id }             : {}),
        ...(accountEmail         ? { accountEmail }                       : {}),
        ...(accountName          ? { accountName }                        : {}),
      },
    });

    // Auto-register AD_STATUS and LEAD webhooks (fire-and-forget; errors are
    // stored on the doc so the dealer can retry from Settings if needed).
    registerOlxWebhooks(dealershipId, tokens.access_token).catch(err => {
      console.error('[OLX callback] webhook auto-registration failed:', err);
    });

    const successRes = NextResponse.redirect(`${base}/dashboard/settings?olx_connected=1`);
    return successRes;
  } catch (err: any) {
    console.error('OLX OAuth error:', err);
    const detail = encodeURIComponent(String(err?.message ?? err).slice(0, 200));
    return NextResponse.redirect(`${base}/dashboard/settings?olx_error=oauth_failed&olx_detail=${detail}`);
  }
}
