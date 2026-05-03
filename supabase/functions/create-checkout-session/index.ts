import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Non autorizzato');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Non autorizzato');

    const { agentId, successUrl, cancelUrl } = await req.json();

    // Carica dati agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, nome, prezzo_mensile, icona')
      .eq('id', agentId)
      .eq('attivo', true)
      .single();

    if (agentError || !agent) throw new Error('Agente non trovato');

    // Verifica che l'utente non abbia già un abbonamento attivo
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('agent_id', agentId)
      .eq('stato', 'attiva')
      .maybeSingle();

    if (existing) throw new Error('Hai già un abbonamento attivo per questo agente');

    // Recupera o crea customer Stripe
    let customerId: string;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' });
    }

    // Crea sessione di checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          recurring: { interval: 'month' },
          product_data: {
            name: `${agent.icona || '🤖'} ${agent.nome}`,
            description: 'Abbonamento mensile — Shop Your Agent',
          },
          unit_amount: Math.round(agent.prezzo_mensile * 100),
        },
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: user.id, agent_id: agentId },
      subscription_data: { metadata: { user_id: user.id, agent_id: agentId } },
      locale: 'it',
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
