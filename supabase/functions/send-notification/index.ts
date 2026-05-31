const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function supabaseUrl() { return Deno.env.get('SUPABASE_URL')!; }
function supabaseSrk() { return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; }

async function verifyUser(token: string): Promise<{ id: string }> {
  const res = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { apikey: supabaseSrk(), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Non autorizzato');
  const user = await res.json();
  if (!user.id) throw new Error('Non autorizzato');
  return { id: user.id };
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
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    await verifyUser(token);

    const { type, agentName, vendorEmail, vendorName, buyerEmail } = await req.json();
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'amirpiccardo@gmail.com';

    if (!RESEND_KEY) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no RESEND_API_KEY' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'vendor_registered' && agentName) {
      await sendEmail(RESEND_KEY, ADMIN_EMAIL,
        `Nuovo vendor da approvare: ${agentName}`,
        `<p>Un nuovo sviluppatore <strong>${agentName}</strong> ha creato un account vendor e attende approvazione.</p>
         <p><a href="${SITE_URL}/admin.html">Approva dalla dashboard admin →</a></p>`
      );
    }

    if (type === 'agent_submitted' && agentName) {
      await sendEmail(RESEND_KEY, ADMIN_EMAIL,
        `Nuovo agente da approvare: ${agentName}`,
        `<p>Un vendor ha inviato un nuovo agente <strong>${agentName}</strong> in attesa di approvazione.</p>
         <p><a href="${SITE_URL}/admin.html">Vai alla dashboard admin →</a></p>`
      );
    }

    if (type === 'vendor_approved' && agentName && vendorEmail) {
      await sendEmail(RESEND_KEY, vendorEmail,
        `Il tuo account vendor è stato approvato! 🎉`,
        `<p>Ciao <strong>${agentName}</strong>,</p>
         <p>Il tuo account vendor su Shop Your Agent è stato approvato. Puoi ora pubblicare i tuoi agenti AI.</p>
         <p><a href="${SITE_URL}/dashboard-vendor.html">Accedi alla dashboard →</a></p>`
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

    if (type === 'welcome' && agentName && vendorEmail) {
      await sendEmail(RESEND_KEY, vendorEmail,
        `Benvenuto su Shop Your Agent, ${agentName}! 🎉`,
        `<p>Ciao <strong>${agentName}</strong>,</p>
         <p>Benvenuto su Shop Your Agent — il marketplace italiano degli agenti AI.</p>
         <p>Puoi subito esplorare il catalogo e attivare il tuo primo agente in pochi minuti, senza nessuna competenza tecnica.</p>
         <p><a href="${SITE_URL}/shop_your_agent.html">Esplora il catalogo →</a></p>
         <p style="margin-top:24px;font-size:13px;color:#666;">Hai domande? Consulta le <a href="${SITE_URL}/faq.html">FAQ</a> o scrivici a <a href="mailto:support@shopyouragent.com">support@shopyouragent.com</a>.</p>
         <p>A presto,<br>Il team di Shop Your Agent</p>`
      );
    }

    if (type === 'new_subscription' && agentName && vendorEmail) {
      const buyer = buyerEmail || 'Un nuovo utente';
      await sendEmail(RESEND_KEY, vendorEmail,
        `Nuovo abbonamento per "${agentName}"! 💰`,
        `<p>Ciao${vendorName ? ` <strong>${vendorName}</strong>` : ''},</p>
         <p>${buyer} si è abbonato al tuo agente <strong>${agentName}</strong>.</p>
         <p>Il guadagno del 70% ti verrà accreditato il 1° del mese.</p>
         <p><a href="${SITE_URL}/dashboard-vendor.html">Vedi i tuoi guadagni →</a></p>`
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
