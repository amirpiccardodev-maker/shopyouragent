import { readFileSync } from 'fs';
import { request } from 'https';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'rayqkicmlgbjawnyxjml';
const SUPABASE_TOKEN = process.env.SUPABASE_TOKEN;
if (!SUPABASE_TOKEN) { console.error('Missing SUPABASE_TOKEN env var'); process.exit(1); }

function httpRequest(method, hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = request({ method, hostname, path, headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function deployFunction(slug, sourceFile, verifyJwt) {
  const body = readFileSync(sourceFile, 'utf8');
  const payload = JSON.stringify({ slug, name: slug, body, verify_jwt: verifyJwt });

  // Try PATCH first (update existing), then POST (create new)
  let res = await httpRequest('PATCH',
    'api.supabase.com',
    `/v1/projects/${PROJECT_REF}/functions/${slug}`,
    {
      'Authorization': `Bearer ${SUPABASE_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    payload
  );

  if (res.status === 404) {
    res = await httpRequest('POST',
      'api.supabase.com',
      `/v1/projects/${PROJECT_REF}/functions`,
      {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      payload
    );
  }

  const result = JSON.parse(res.body);
  if (res.status >= 200 && res.status < 300) {
    console.log(`✓ ${slug} deployed (${res.status})`);
  } else {
    console.error(`✗ ${slug} failed (${res.status}):`, result);
  }
}

const functions = [
  // Core payments
  { slug: 'create-checkout-session',  file: 'supabase/functions/create-checkout-session/index.ts',  jwt: true  },
  { slug: 'stripe-webhook',           file: 'supabase/functions/stripe-webhook/index.ts',           jwt: false },
  { slug: 'cancel-subscription',      file: 'supabase/functions/cancel-subscription/index.ts',      jwt: true  },
  { slug: 'create-billing-portal',    file: 'supabase/functions/create-billing-portal/index.ts',    jwt: true  },
  // Notifications
  { slug: 'send-notification',        file: 'supabase/functions/send-notification/index.ts',        jwt: true  },
  // Vendor identity verification
  { slug: 'send-vendor-verification', file: 'supabase/functions/send-vendor-verification/index.ts', jwt: true  },
  { slug: 'confirm-vendor-email',     file: 'supabase/functions/confirm-vendor-email/index.ts',     jwt: false },
  // Public contact form
  { slug: 'contact-form',             file: 'supabase/functions/contact-form/index.ts',             jwt: false },
];

for (const fn of functions) {
  await deployFunction(fn.slug, fn.file, fn.jwt);
}
