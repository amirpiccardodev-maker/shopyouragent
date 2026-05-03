const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeJwt(token: string): { sub: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { sub: payload.sub };
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const user = decodeJwt(req.headers.get('Authorization')?.replace('Bearer ', '') ?? '');
    if (!user?.sub) throw new Error('Non autorizzato');

    const { returnUrl } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SRK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const STRIPE_SK = Deno.env.get('STRIPE_SECRET_KEY')!;

    const profileUrl = new URL(`${SUPABASE_URL}/rest/v1/profiles`);
    profileUrl.searchParams.set('user_id', `eq.${user.sub}`);
    profileUrl.searchParams.set('select', 'stripe_customer_id');
    const profileRes = await fetch(profileUrl, {
      headers: { apikey: SUPABASE_SRK, Authorization: `Bearer ${SUPABASE_SRK}` },
    });
    const profiles = await profileRes.json();

    if (!profiles?.[0]?.stripe_customer_id) {
      throw new Error('Nessun metodo di pagamento associato. Acquista prima un agente.');
    }

    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SK}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: profiles[0].stripe_customer_id,
        return_url: returnUrl,
      }),
    });
    const portal = await portalRes.json();

    if (portal.error) throw new Error(portal.error.message);

    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
