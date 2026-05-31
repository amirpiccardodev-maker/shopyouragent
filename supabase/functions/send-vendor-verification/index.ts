const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function supabaseUrl() { return Deno.env.get('SUPABASE_URL')!; }
function supabaseSrk() { return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; }

async function verifyUser(token: string): Promise<{ id: string; email: string }> {
  const res = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { apikey: supabaseSrk(), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Non autorizzato');
  const user = await res.json();
  if (!user.id) throw new Error('Non autorizzato');
  return { id: user.id, email: user.email || '' };
}

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
  await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: supabaseSrk(),
      Authorization: `Bearer ${supabaseSrk()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const authUser = await verifyUser(token);

    const vendors = await dbGet('/vendors', {
      user_id: `eq.${authUser.id}`,
      select: 'id,nome,email',
      limit: '1',
    });
    if (!Array.isArray(vendors) || !vendors.length) throw new Error('Profilo vendor non trovato');
    const vendor = vendors[0];

    // Generate secure token (64-char hex)
    const rawBytes = crypto.getRandomValues(new Uint8Array(32));
    const verificationToken = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await dbPatch('/vendors', { id: `eq.${vendor.id}` }, {
      verification_token: verificationToken,
      token_expires_at: expiresAt,
    });

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://shopyouragent.onrender.com';
    const verifyUrl = `${SITE_URL}/verify-vendor.html?token=${verificationToken}&vid=${vendor.id}`;
    const vendorEmail = vendor.email || authUser.email;

    if (RESEND_KEY && vendorEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [vendorEmail],
          subject: 'Verifica la tua email — Shop Your Agent',
          html: `
            <p style="font-family:sans-serif;font-size:15px;">Ciao <strong>${vendor.nome || 'Sviluppatore'}</strong>,</p>
            <p style="font-family:sans-serif;font-size:14px;color:#555;line-height:1.7;">
              Grazie per aver creato un account vendor su Shop Your Agent.<br>
              Clicca il pulsante qui sotto per verificare la tua email e velocizzare l'approvazione del tuo account.
            </p>
            <p style="margin:28px 0;text-align:center;">
              <a href="${verifyUrl}"
                 style="display:inline-block;background:#c8f55a;color:#0a0a0a;font-family:sans-serif;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
                ✓ Verifica email
              </a>
            </p>
            <p style="font-family:sans-serif;font-size:13px;color:#888;">Il link scade tra 48 ore.</p>
          `,
        }),
      });
    }

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
