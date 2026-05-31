const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
};

const SUBJECTS: Record<string, string> = {
  acquisto:      'Domanda su acquisto/abbonamento',
  configurazione:'Problema di configurazione agente',
  pagamento:     'Problema di pagamento',
  rimborso:      'Richiesta di rimborso',
  tecnico:       'Problema tecnico',
  vendor:        'Informazioni per sviluppatori',
  altro:         'Altro',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { nome, email, soggetto, messaggio } = await req.json();

    if (!nome?.trim() || !email?.trim() || !messaggio?.trim()) {
      return new Response(JSON.stringify({ error: 'Compila tutti i campi obbligatori' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Email non valida' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (messaggio.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Il messaggio è troppo breve' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'amirpiccardo@gmail.com';
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';
    const soggettoLabel = SUBJECTS[soggetto] || soggetto || 'Contatto dal sito';

    if (RESEND_KEY) {
      // Email all'admin
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [ADMIN_EMAIL],
          reply_to: email.trim(),
          subject: `[SYA Supporto] ${soggettoLabel}`,
          html: `
            <h2 style="font-family:sans-serif;color:#111;">Nuova richiesta di supporto</h2>
            <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:560px;">
              <tr><td style="padding:8px 0;color:#666;width:120px;">Nome</td><td style="padding:8px 0;font-weight:500;">${escapeHtml(nome)}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Soggetto</td><td style="padding:8px 0;">${escapeHtml(soggettoLabel)}</td></tr>
            </table>
            <div style="margin-top:16px;padding:16px;background:#f5f5f2;border-radius:8px;font-family:sans-serif;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(messaggio)}</div>
            <p style="margin-top:16px;font-family:sans-serif;font-size:12px;color:#999;">Inviato da <a href="${SITE_URL}">${SITE_URL}</a></p>
          `,
        }),
      });

      // Email di conferma all'utente
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email.trim()],
          subject: 'Abbiamo ricevuto la tua richiesta — Shop Your Agent',
          html: `
            <p style="font-family:sans-serif;font-size:15px;">Ciao <strong>${escapeHtml(nome)}</strong>,</p>
            <p style="font-family:sans-serif;font-size:14px;color:#555;line-height:1.7;">Abbiamo ricevuto la tua richiesta riguardo a: <strong>${escapeHtml(soggettoLabel)}</strong>.</p>
            <p style="font-family:sans-serif;font-size:14px;color:#555;line-height:1.7;">Il nostro team ti risponderà entro 24 ore (di solito molto prima).</p>
            <p style="font-family:sans-serif;font-size:14px;color:#555;margin-top:24px;">A presto,<br>Il team di Shop Your Agent</p>
            <p style="font-family:sans-serif;font-size:12px;color:#aaa;margin-top:32px;border-top:1px solid #eee;padding-top:12px;">
              <a href="${SITE_URL}" style="color:#7a9a00;">Shop Your Agent</a> — Il marketplace italiano degli agenti AI
            </p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore interno';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
