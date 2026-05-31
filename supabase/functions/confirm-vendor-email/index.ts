const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

function supabaseUrl() { return Deno.env.get('SUPABASE_URL')!; }
function supabaseSrk() { return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; }

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const vid = url.searchParams.get('vid');

    if (!token || !vid) throw new Error('Parametri mancanti');
    if (token.length !== 64 || !/^[0-9a-f]+$/.test(token)) throw new Error('Token non valido');

    const vendors = await dbGet('/vendors', {
      id: `eq.${vid}`,
      verification_token: `eq.${token}`,
      select: 'id,email_verificata,token_expires_at',
      limit: '1',
    });

    if (!Array.isArray(vendors) || !vendors.length) throw new Error('Token non valido o già utilizzato');
    const vendor = vendors[0];

    if (vendor.email_verificata) {
      return new Response(JSON.stringify({ ok: true, already: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (vendor.token_expires_at && new Date(vendor.token_expires_at) < new Date()) {
      throw new Error('Il link di verifica è scaduto. Richiedine uno nuovo dalla dashboard.');
    }

    const patchRes = await dbPatch('/vendors', { id: `eq.${vid}` }, {
      email_verificata: true,
      verification_token: null,
      token_expires_at: null,
    });
    if (!patchRes.ok) throw new Error('Errore durante la verifica');

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
