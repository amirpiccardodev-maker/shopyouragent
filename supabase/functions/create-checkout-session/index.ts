import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = Deno.env.get('SITE_URL') || 'https://shopyouragent.onrender.com';
const cors = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    // Verify JWT signature via Supabase auth — prevents forged tokens
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl(), supabaseSrk());
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Non autorizzato');

    const { agentId, successUrl, cancelUrl } = await req.json();

    const agents = await dbGet('/agents', {
      id: `eq.${agentId}`,
      attivo: 'eq.true',
      select: 'id,nome,prezzo_mensile,icona',
    });
    if (!Array.isArray(agents) || agents.length === 0) throw new Error('Agente non trovato');
    const agent = agents[0] as { id: string; nome: string; prezzo_mensile: number; icona: string };

    const existingSubs = await dbGet('/subscriptions', {
      user_id: `eq.${user.id}`,
      agent_id: `eq.${agentId}`,
      stato: `eq.attiva`,
      select: 'id',
    });
    if (Array.isArray(existingSubs) && existingSubs.length > 0) {
      throw new Error('Hai già un abbonamento attivo per questo agente');
    }

    let customerId: string;
    const profiles = await dbGet('/profiles', {
      user_id: `eq.${user.id}`,
      select: 'stripe_customer_id',
    });

    if (Array.isArray(profiles) && profiles[0]?.stripe_customer_id) {
      customerId = profiles[0].stripe_customer_id;
    } else {
      const customer = await stripePost('/v1/customers', {
        email: user.email ?? '',
        'metadata[supabase_user_id]': user.id,
      });
      if (customer.error) throw new Error(customer.error.message);
      customerId = customer.id;
      await dbPost('/profiles', { user_id: user.id, stripe_customer_id: customerId },
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
      'metadata[user_id]': user.id,
      'metadata[agent_id]': agentId,
      'subscription_data[metadata][user_id]': user.id,
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
