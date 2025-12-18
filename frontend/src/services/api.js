const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || '').toString().replace(/\/$/, '');

function apiUrl(path) {
  if (!path.startsWith('/')) return `${API_BASE}/${path}`;
  return `${API_BASE}${path}`;
}

export async function apiGetRates() {
  const res = await fetch(apiUrl('/api/rates'), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('invalid rates');
  return data;
}

function getAdminToken() {
  try {
    return localStorage.getItem('admin_token') || '';
  } catch {
    return '';
  }
}

function getAdminHeaders(extra = {}) {
  const token = getAdminToken();
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiAdminLogin(username, password) {
  const res = await fetch(apiUrl('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiSaveRates(rates) {
  const res = await fetch(apiUrl('/api/rates'), {
    method: 'PUT',
    headers: getAdminHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify(rates)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiGetReviews() {
  const res = await fetch(apiUrl('/api/reviews'), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('invalid reviews');
  return data;
}

export async function apiCreateReview(payload) {
  const res = await fetch(apiUrl('/api/reviews'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiPatchReview(id, approved) {
  const res = await fetch(apiUrl(`/api/reviews/${id}`), {
    method: 'PATCH',
    headers: getAdminHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify({ approved })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function apiDeleteReview(id) {
  const res = await fetch(apiUrl(`/api/reviews/${id}`), {
    method: 'DELETE',
    headers: getAdminHeaders({ Accept: 'application/json' })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
