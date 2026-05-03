const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeJwt(token: string): { sub: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

function supabaseUrl() { return Deno.env.get('SUPABASE_URL')!; }
function supabaseSrk() { return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; }
function stripeSk() { return Deno.env.get('STRIPE_SECRET_KEY')!; }

async function dbGet(path: string, query: Record<string, string>) {
  const url = new URL(`${supabaseUrl()}/rest/v1${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { apikey: supabaseSrk(), Authorization: `Bearer ${supabaseSrk()}` },
  });
  return res.json();
}

async function dbPatch(path: string, query: Record<string, string>, body: unknown) {
  const url = new URL(`${supabaseUrl()}/rest/v1${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: supabaseSrk(),
      Authorization: `Bearer ${supabaseSrk()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  return res;
}

async function stripePost(path: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSk()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const user = decodeJwt(token);
    if (!user?.sub) throw new Error('Non autorizzato');

    const { stripeSubscriptionId } = await req.json();

    const subs = await dbGet('/subscriptions', {
      stripe_subscription_id: `eq.${stripeSubscriptionId}`,
      user_id: `eq.${user.sub}`,
      stato: `eq.attiva`,
      select: 'id',
    });
    if (!Array.isArray(subs) || subs.length === 0) throw new Error('Abbonamento non trovato');

    const result = await stripePost(`/v1/subscriptions/${stripeSubscriptionId}`, {
      cancel_at_period_end: 'true',
    });
    if (result.error) throw new Error(result.error.message);

    await dbPatch('/subscriptions',
      { stripe_subscription_id: `eq.${stripeSubscriptionId}` },
      { stato: 'disdetta' }
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
