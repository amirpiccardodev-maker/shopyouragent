const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeJwt(token: string): { sub: string; email: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { sub: payload.sub, email: payload.email };
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

async function dbPost(path: string, body: unknown, prefer: string) {
  const res = await fetch(`${supabaseUrl()}/rest/v1${path}`, {
    method: 'POST',
    headers: {
      apikey: supabaseSrk(),
      Authorization: `Bearer ${supabaseSrk()}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
  return res.json();
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

    const { agentId, successUrl, cancelUrl } = await req.json();

    const agents = await dbGet('/agents', {
      id: `eq.${agentId}`,
      attivo: 'eq.true',
      select: 'id,nome,prezzo_mensile,icona',
    });
    if (!Array.isArray(agents) || agents.length === 0) throw new Error('Agente non trovato');
    const agent = agents[0] as { id: string; nome: string; prezzo_mensile: number; icona: string };

    const existingSubs = await dbGet('/subscriptions', {
      user_id: `eq.${user.sub}`,
      agent_id: `eq.${agentId}`,
      stato: `eq.attiva`,
      select: 'id',
    });
    if (Array.isArray(existingSubs) && existingSubs.length > 0) {
      throw new Error('Hai già un abbonamento attivo per questo agente');
    }

    let customerId: string;
    const profiles = await dbGet('/profiles', {
      user_id: `eq.${user.sub}`,
      select: 'stripe_customer_id',
    });

    if (Array.isArray(profiles) && profiles[0]?.stripe_customer_id) {
      customerId = profiles[0].stripe_customer_id;
    } else {
      const customer = await stripePost('/v1/customers', {
        email: user.email ?? '',
        'metadata[supabase_user_id]': user.sub,
      });
      if (customer.error) throw new Error(customer.error.message);
      customerId = customer.id;
      await dbPost('/profiles', { user_id: user.sub, stripe_customer_id: customerId },
        'resolution=merge-duplicates,return=minimal');
    }

    const session = await stripePost('/v1/checkout/sessions', {
      customer: customerId,
      mode: 'subscription',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][price_data][product_data][name]': `${agent.icona || '🤖'} ${agent.nome}`,
      'line_items[0][price_data][product_data][description]': 'Abbonamento mensile — Shop Your Agent',
      'line_items[0][price_data][unit_amount]': String(Math.round(agent.prezzo_mensile * 100)),
      'line_items[0][quantity]': '1',
      success_url: successUrl,
      cancel_url: cancelUrl,
      'metadata[user_id]': user.sub,
      'metadata[agent_id]': agentId,
      'subscription_data[metadata][user_id]': user.sub,
      'subscription_data[metadata][agent_id]': agentId,
      locale: 'it',
    });

    if (session.error) throw new Error(session.error.message);

    return new Response(JSON.stringify({ url: session.url }), {
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
