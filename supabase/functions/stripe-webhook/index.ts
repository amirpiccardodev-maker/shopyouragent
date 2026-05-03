function supabaseUrl() { return Deno.env.get('SUPABASE_URL')!; }
function supabaseSrk() { return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; }

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const t = sigHeader.match(/t=(\d+)/)?.[1];
  const v1s = [...sigHeader.matchAll(/v1=([a-f0-9]+)/g)].map(m => m[1]);
  if (!t || v1s.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  return v1s.some(sig => {
    if (sig.length !== computed.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ computed.charCodeAt(i);
    return diff === 0;
  });
}

async function dbPost(path: string, body: unknown) {
  const res = await fetch(`${supabaseUrl()}/rest/v1${path}`, {
    method: 'POST',
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

Deno.serve(async (req) => {
  const body = await req.text();
  const sigHeader = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
  if (!valid) return new Response('Webhook signature invalid', { status: 400 });

  const event = JSON.parse(body) as {
    type: string;
    data: { object: Record<string, unknown> };
  };

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session['mode'] !== 'subscription') break;
      const meta = session['metadata'] as Record<string, string> | null;
      if (!meta?.user_id || !meta?.agent_id) break;

      await dbPost('/subscriptions', {
        user_id: meta.user_id,
        agent_id: meta.agent_id,
        stato: 'attiva',
        data_inizio: new Date().toISOString(),
        stripe_subscription_id: session['subscription'],
        stripe_customer_id: session['customer'],
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await dbPatch('/subscriptions', { stripe_subscription_id: `eq.${sub['id']}` }, { stato: 'annullata' });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice['subscription']) {
        await dbPatch('/subscriptions',
          { stripe_subscription_id: `eq.${invoice['subscription']}` },
          { stato: 'pagamento_fallito' }
        );
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
