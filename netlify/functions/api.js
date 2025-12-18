const crypto = require('crypto');
const { Pool } = require('pg');

let pool;
function getPool() {
  if (pool) return pool;

  const connectionString = (process.env.DATABASE_URL || '').toString();
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  return pool;
}

const ADMIN_USER = (process.env.ADMIN_USER || 'Admin').toString();
const ADMIN_PASS_HASH = (process.env.ADMIN_PASS_HASH || '').toString();
const ADMIN_TOKEN_SECRET = (process.env.ADMIN_TOKEN_SECRET || '').toString();

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function base64urlEncode(input) {
  return Buffer.from(input, 'utf8').toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecodeToString(input) {
  const s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  return Buffer.from(s + pad, 'base64').toString('utf8');
}

function hmacHex(secret, data) {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
}

function issueAdminToken() {
  const exp = Date.now() + 1000 * 60 * 60 * 12; // 12h
  const payload = { u: ADMIN_USER, exp };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64urlEncode(payloadStr);
  const sig = hmacHex(ADMIN_TOKEN_SECRET, payloadB64);
  return `${payloadB64}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return { ok: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false };

  const payloadB64 = parts[0];
  const sig = parts[1];
  if (!ADMIN_TOKEN_SECRET) return { ok: false };

  const expected = hmacHex(ADMIN_TOKEN_SECRET, payloadB64);
  try {
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return { ok: false };
    if (!crypto.timingSafeEqual(a, b)) return { ok: false };
  } catch {
    return { ok: false };
  }

  try {
    const payloadStr = base64urlDecodeToString(payloadB64);
    const payload = JSON.parse(payloadStr);
    if (!payload || payload.u !== ADMIN_USER) return { ok: false };
    if (!payload.exp || Date.now() > Number(payload.exp)) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function requireAdmin(event) {
  const header = (event.headers?.authorization || event.headers?.Authorization || '').toString();
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  const v = verifyAdminToken(token);
  return v.ok;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function text(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: (body ?? '').toString()
  };
}

function mapRateRow(row) {
  return {
    الدولة: row.country,
    العملة: row.currency,
    'سعر الكاش': Number(row.cash_rate),
    'سعر البنكي': Number(row.bank_rate),
    'سعر USDT': row.usdt_rate === null ? null : Number(row.usdt_rate),
    'بيانات الحساب': row.account_info || '',
    الشروط: row.terms || ''
  };
}

function getRoute(event) {
  // Expected paths:
  // - /.netlify/functions/api/rates
  // - /.netlify/functions/api/reviews/123
  // Also handle /api/rates from rawUrl or path
  let rawPath = (event.rawUrl || event.path || '').toString();
  
  // Extract path from full URL if needed
  try {
    const url = new URL(rawPath, 'http://localhost');
    rawPath = url.pathname;
  } catch {
    // keep rawPath as is
  }
  
  // Remove /.netlify/functions/api prefix
  const prefix1 = '/.netlify/functions/api';
  if (rawPath.startsWith(prefix1)) {
    rawPath = rawPath.slice(prefix1.length);
  }
  
  // Remove /api prefix (from redirect)
  const prefix2 = '/api';
  if (rawPath.startsWith(prefix2)) {
    rawPath = rawPath.slice(prefix2.length);
  }
  
  // Ensure starts with /
  if (!rawPath.startsWith('/')) rawPath = `/${rawPath}`;
  
  // Remove trailing slashes
  rawPath = rawPath.replace(/\/+$/, '') || '/';
  
  return rawPath;
}

async function readJsonBody(event) {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  const route = getRoute(event);

  try {
    const db = getPool();

    // Health
    if (method === 'GET' && route === '/health') {
      await db.query('select 1');
      return json(200, { ok: true });
    }

    // Admin login
    if (method === 'POST' && route === '/admin/login') {
      if (!ADMIN_PASS_HASH || !ADMIN_TOKEN_SECRET) {
        return json(500, { error: 'admin_auth_not_configured' });
      }

      const body = await readJsonBody(event);
      const username = (body?.username ?? '').toString();
      const password = (body?.password ?? '').toString();
      const salt = 'calc-fyaz-admin-salt-v1';
      const passHash = sha256Hex(salt + password);

      if (username !== ADMIN_USER) return json(401, { error: 'invalid_credentials' });

      try {
        const a = Buffer.from(passHash, 'utf8');
        const b = Buffer.from(ADMIN_PASS_HASH, 'utf8');
        if (a.length !== b.length) return json(401, { error: 'invalid_credentials' });
        if (!crypto.timingSafeEqual(a, b)) return json(401, { error: 'invalid_credentials' });
      } catch {
        return json(401, { error: 'invalid_credentials' });
      }

      const token = issueAdminToken();
      return json(200, { ok: true, token });
    }

    // Rates: get all
    if (method === 'GET' && route === '/rates') {
      const q = `
        select country, currency, cash_rate, bank_rate, usdt_rate, account_info, terms, updated_at
        from exchange_rates
        order by country asc
      `;
      const { rows } = await db.query(q);
      return json(200, rows.map(mapRateRow));
    }

    // Rates: replace all (admin)
    if (method === 'PUT' && route === '/rates') {
      if (!requireAdmin(event)) return json(401, { error: 'unauthorized' });

      const data = await readJsonBody(event);
      if (!Array.isArray(data)) {
        return json(400, { error: 'Body must be an array' });
      }

      const client = await db.connect();
      try {
        await client.query('begin');
        await client.query('delete from exchange_rates');

        const ins = `
          insert into exchange_rates (country, currency, cash_rate, bank_rate, usdt_rate, account_info, terms)
          values ($1,$2,$3,$4,$5,$6,$7)
        `;

        for (const row of data) {
          const country = (row?.['الدولة'] ?? '').toString().trim();
          if (!country) continue;

          const currency = (row?.['العملة'] ?? '').toString().trim();
          const cash = Number(row?.['سعر الكاش']);
          const bank = Number(row?.['سعر البنكي']);
          const usdt = row?.['سعر USDT'] === undefined || row?.['سعر USDT'] === null || row?.['سعر USDT'] === ''
            ? null
            : Number(row?.['سعر USDT']);

          const accountInfo = (row?.['بيانات الحساب'] ?? '').toString();
          const terms = (row?.['الشروط'] ?? '').toString();

          await client.query(ins, [country, currency, cash, bank, usdt, accountInfo, terms]);
        }

        await client.query('commit');
        return json(200, { ok: true, count: data.length });
      } catch (e) {
        await client.query('rollback');
        return json(500, { ok: false, error: e.message });
      } finally {
        client.release();
      }
    }

    // Reviews: list
    if (method === 'GET' && route === '/reviews') {
      const { rows } = await db.query(
        `select id, name, rating, text, approved, created_at from customer_reviews order by created_at desc`
      );
      return json(200, rows);
    }

    // Reviews: create (public)
    if (method === 'POST' && route === '/reviews') {
      const body = await readJsonBody(event);
      const name = (body?.name ?? '').toString().trim();
      const rating = Math.max(1, Math.min(5, Number(body?.rating) || 5));
      const textValue = (body?.text ?? '').toString().trim();

      if (!textValue) return json(400, { error: 'text is required' });

      const { rows } = await db.query(
        `insert into customer_reviews (name, rating, text, approved)
         values ($1,$2,$3,true)
         returning id, name, rating, text, approved, created_at`,
        [name || null, rating, textValue]
      );

      return json(200, rows[0]);
    }

    // Reviews: approve/unapprove (admin)
    const patchMatch = route.match(/^\/reviews\/(\d+)$/);
    if (method === 'PATCH' && patchMatch) {
      if (!requireAdmin(event)) return json(401, { error: 'unauthorized' });

      const id = Number(patchMatch[1]);
      const body = await readJsonBody(event);
      const approved = !!body?.approved;

      const { rows } = await db.query(
        `update customer_reviews set approved=$2 where id=$1
         returning id, name, rating, text, approved, created_at`,
        [id, approved]
      );
      if (!rows.length) return json(404, { error: 'not found' });
      return json(200, rows[0]);
    }

    // Reviews: delete (admin)
    const deleteMatch = route.match(/^\/reviews\/(\d+)$/);
    if (method === 'DELETE' && deleteMatch) {
      if (!requireAdmin(event)) return json(401, { error: 'unauthorized' });

      const id = Number(deleteMatch[1]);
      await db.query('delete from customer_reviews where id=$1', [id]);
      return json(200, { ok: true });
    }

    return json(404, { error: 'not_found', method, route });
  } catch (e) {
    return text(500, e?.message || 'server_error');
  }
};
