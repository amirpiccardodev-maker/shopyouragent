import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = Deno.env.get('SITE_URL') || 'https://shopyouragent.onrender.com';
const cors = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function supabaseUrl() { return Deno.env.get('SUPABASE_URL')!; }
function supabaseSrk() { return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // Verify JWT
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl(), supabaseSrk());
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Non autorizzato');

    // Find vendor record
    const { data: vendors, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id, nome, email')
      .eq('user_id', user.id)
      .limit(1);

    if (vendorError || !vendors?.length) throw new Error('Profilo vendor non trovato');
    const vendor = vendors[0];

    // Generate secure token (64-char hex)
    const rawBytes = crypto.getRandomValues(new Uint8Array(32));
    const verificationToken = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Store token with 48h expiry
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('vendors')
      .update({ verification_token: verificationToken, token_expires_at: expiresAt })
      .eq('id', vendor.id);

    if (updateError) throw new Error('Errore nel salvataggio del token');

    // Send verification email
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';
    const verifyUrl = `${SITE_URL}/verify-vendor.html?token=${verificationToken}&vid=${vendor.id}`;
    const vendorEmail = vendor.email || user.email;

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
            <p style="font-family:sans-serif;font-size:13px;color:#888;line-height:1.6;">
              Il link scade tra 48 ore. Se non hai creato un account vendor, ignora questa email.
            </p>
            <p style="font-family:sans-serif;font-size:12px;color:#aaa;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">
              Oppure copia questo URL nel browser:<br>
              <a href="${verifyUrl}" style="color:#7a9a00;word-break:break-all;">${verifyUrl}</a>
            </p>
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
