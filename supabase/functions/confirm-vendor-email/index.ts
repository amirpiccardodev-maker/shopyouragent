import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = Deno.env.get('SITE_URL') || 'https://shopyouragent.onrender.com';
const cors = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'content-type',
};

function supabaseUrl() { return Deno.env.get('SUPABASE_URL')!; }
function supabaseSrk() { return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const vid = url.searchParams.get('vid');

    if (!token || !vid) throw new Error('Parametri mancanti');
    if (token.length !== 64 || !/^[0-9a-f]+$/.test(token)) throw new Error('Token non valido');

    const supabaseAdmin = createClient(supabaseUrl(), supabaseSrk());

    // Find vendor with this token
    const { data: vendors, error } = await supabaseAdmin
      .from('vendors')
      .select('id, email_verificata, token_expires_at')
      .eq('id', vid)
      .eq('verification_token', token)
      .limit(1);

    if (error || !vendors?.length) throw new Error('Token non valido o già utilizzato');

    const vendor = vendors[0];

    if (vendor.email_verificata) {
      return new Response(JSON.stringify({ ok: true, already: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Check expiry
    if (vendor.token_expires_at && new Date(vendor.token_expires_at) < new Date()) {
      throw new Error('Il link di verifica è scaduto. Richiedine uno nuovo dalla dashboard.');
    }

    // Mark as verified and clear token
    const { error: updateError } = await supabaseAdmin
      .from('vendors')
      .update({ email_verificata: true, verification_token: null, token_expires_at: null })
      .eq('id', vid);

    if (updateError) throw new Error('Errore durante la verifica');

    return new Response(JSON.stringify({ ok: true }), {
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
