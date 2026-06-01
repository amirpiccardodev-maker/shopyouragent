import { readFileSync } from 'fs';
import { request } from 'https';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'rayqkicmlgbjawnyxjml';
const SUPABASE_TOKEN = process.env.SUPABASE_TOKEN;
const SQL_FILE = process.argv[2];

if (!SUPABASE_TOKEN) { console.error('Missing SUPABASE_TOKEN'); process.exit(1); }
if (!SQL_FILE) { console.error('Usage: node run-sql.mjs <file.sql>'); process.exit(1); }

const query = readFileSync(SQL_FILE, 'utf8');
const payload = JSON.stringify({ query });

const req = request({
  method: 'POST',
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  headers: {
    'Authorization': `Bearer ${SUPABASE_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`OK (${res.statusCode}):`, data.slice(0, 500));
    } else {
      console.error(`FAIL (${res.statusCode}):`, data.slice(0, 800));
    }
  });
});
req.on('error', e => console.error('Request error:', e.message));
req.write(payload);
req.end();
