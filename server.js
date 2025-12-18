const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
require('dotenv').config();

const { pool } = require('./db');

const app = express();
app.use(express.json({ limit: '1mb' }));

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

function requireAdmin(req, res, next) {
  const header = (req.headers.authorization || '').toString();
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  const v = verifyAdminToken(token);
  if (!v.ok) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// Dev convenience: backend serves only /api. Redirect root to Vite dev server.
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.redirect(302, 'http://localhost:5173');
  });
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASS_HASH || !ADMIN_TOKEN_SECRET) {
    return res.status(500).json({ error: 'admin_auth_not_configured' });
  }

  const username = (req.body?.username ?? '').toString();
  const password = (req.body?.password ?? '').toString();
  const salt = 'calc-fyaz-admin-salt-v1';
  const passHash = sha256Hex(salt + password);

  if (username !== ADMIN_USER) return res.status(401).json({ error: 'invalid_credentials' });

  try {
    const a = Buffer.from(passHash, 'utf8');
    const b = Buffer.from(ADMIN_PASS_HASH, 'utf8');
    if (a.length !== b.length) return res.status(401).json({ error: 'invalid_credentials' });
    if (!crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'invalid_credentials' });
  } catch {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const token = issueAdminToken();
  res.json({ ok: true, token });
});

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

// Health
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Rates: get all
app.get('/api/rates', async (req, res) => {
  const q = `
    select country, currency, cash_rate, bank_rate, usdt_rate, account_info, terms, updated_at
    from exchange_rates
    order by country asc
  `;
  const { rows } = await pool.query(q);
  res.json(rows.map(mapRateRow));
});

// Rates: replace all (admin)
app.put('/api/rates', requireAdmin, async (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Body must be an array' });
  }

  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('delete from exchange_rates');

    const ins = `
      insert into exchange_rates (country, currency, cash_rate, bank_rate, usdt_rate, account_info, terms)
      values ($1,$2,$3,$4,$5,$6,$7)
    `;

    for (const row of data) {
      const country = (row['الدولة'] ?? '').toString().trim();
      if (!country) continue;

      const currency = (row['العملة'] ?? '').toString().trim();
      const cash = Number(row['سعر الكاش']);
      const bank = Number(row['سعر البنكي']);
      const usdt = row['سعر USDT'] === undefined || row['سعر USDT'] === null || row['سعر USDT'] === ''
        ? null
        : Number(row['سعر USDT']);

      const accountInfo = (row['بيانات الحساب'] ?? '').toString();
      const terms = (row['الشروط'] ?? '').toString();

      await client.query(ins, [country, currency, cash, bank, usdt, accountInfo, terms]);
    }

    await client.query('commit');
    res.json({ ok: true, count: data.length });
  } catch (e) {
    await client.query('rollback');
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    client.release();
  }
});

// Reviews: list
app.get('/api/reviews', async (req, res) => {
  const { rows } = await pool.query(
    `select id, name, rating, text, approved, created_at from customer_reviews order by created_at desc`
  );
  res.json(rows);
});

// Reviews: create (public)
app.post('/api/reviews', async (req, res) => {
  const name = (req.body?.name ?? '').toString().trim();
  const rating = Math.max(1, Math.min(5, Number(req.body?.rating) || 5));
  const text = (req.body?.text ?? '').toString().trim();

  if (!text) return res.status(400).json({ error: 'text is required' });

  const { rows } = await pool.query(
    `insert into customer_reviews (name, rating, text, approved)
     values ($1,$2,$3,true)
     returning id, name, rating, text, approved, created_at`,
    [name || null, rating, text]
  );

  res.json(rows[0]);
});

// Reviews: approve/unapprove (admin)
app.patch('/api/reviews/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const approved = !!req.body?.approved;

  const { rows } = await pool.query(
    `update customer_reviews set approved=$2 where id=$1
     returning id, name, rating, text, approved, created_at`,
    [id, approved]
  );
  if (!rows.length) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

// Reviews: delete (admin)
app.delete('/api/reviews/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await pool.query('delete from customer_reviews where id=$1', [id]);
  res.json({ ok: true });
});

// Serve React build (production)
if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, 'frontend', 'dist');
  const indexHtml = path.join(distDir, 'index.html');

  if (fs.existsSync(distDir) && fs.existsSync(indexHtml)) {
    app.use(express.static(distDir));

    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(indexHtml);
    });
  }
}

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
