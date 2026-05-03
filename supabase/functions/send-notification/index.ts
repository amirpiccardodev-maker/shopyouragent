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

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const from = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const user = decodeJwt(req.headers.get('Authorization')?.replace('Bearer ', '') ?? '');
    if (!user?.sub) throw new Error('Non autorizzato');

    const { type, agentName, vendorEmail } = await req.json();
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'amirpiccardo@gmail.com';
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://shopyouragent.onrender.com';

    if (!RESEND_KEY) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no RESEND_API_KEY' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'agent_submitted' && agentName) {
      await sendEmail(RESEND_KEY, ADMIN_EMAIL,
        `Nuovo agente da approvare: ${agentName}`,
        `<p>Un vendor ha inviato un nuovo agente <strong>${agentName}</strong> in attesa di approvazione.</p>
         <p><a href="${SITE_URL}/admin.html">Vai alla dashboard admin →</a></p>`
      );
    }

    if (type === 'agent_approved' && agentName && vendorEmail) {
      await sendEmail(RESEND_KEY, vendorEmail,
        `Il tuo agente "${agentName}" è stato approvato! 🎉`,
        `<p>Buone notizie! Il tuo agente <strong>${agentName}</strong> è stato approvato e pubblicato su Shop Your Agent.</p>
         <p>Gli utenti possono ora trovarlo e attivarlo direttamente dal catalogo.</p>
         <p><a href="${SITE_URL}/dashboard-vendor.html">Vai alla tua dashboard →</a></p>`
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
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
