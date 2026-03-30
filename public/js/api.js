// ── Configuração base ──────────────────────────────────────────
const BASE_URL = '';

// ── Auth helpers ───────────────────────────────────────────────
export function getToken()  { return localStorage.getItem('token'); }
export function getUser()   { return JSON.parse(localStorage.getItem('user') || 'null'); }
export function isLoggedIn(){ return !!getToken(); }

export function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function requireLogin(redirectTo = '/index.html') {
  if (!isLoggedIn()) window.location.href = redirectTo;
}

export function requireRole(role, redirectTo = '/index.html') {
  const user = getUser();
  if (!user || user.perfil !== role) window.location.href = redirectTo;
}

// ── Fetch helper ───────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res  = await fetch(BASE_URL + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Erro desconhecido');
  return data;
}

// ── Auth ───────────────────────────────────────────────────────
export const auth = {
  async login(email, senha) {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: senha })
    });
  },
  async logout() {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch (_) {}
    clearSession();
  }
};

// ── Perfis ─────────────────────────────────────────────────────
export const perfis = {
  listar:     (ativo)           => apiFetch(`/api/perfis${ativo !== undefined ? `?ativo=${ativo}` : ''}`),
  detalhe:    (id)              => apiFetch(`/api/perfis/${id}`),
  criar:      (body)            => apiFetch('/api/perfis', { method: 'POST', body: JSON.stringify(body) }),
  editar:     (id, body)        => apiFetch(`/api/perfis/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  ativar:     (id)              => apiFetch(`/api/perfis/${id}/ativar`,    { method: 'PATCH' }),
  desativar:  (id)              => apiFetch(`/api/perfis/${id}/desativar`, { method: 'PATCH' }),
  unidades:   (id)              => apiFetch(`/api/perfis/${id}/unidades`),
  vincular:   (id, unidade_id)  => apiFetch(`/api/perfis/${id}/unidades`, { method: 'POST', body: JSON.stringify({ unidade_id }) }),
  desvincular:(id, unidade_id)  => apiFetch(`/api/perfis/${id}/unidades/${unidade_id}`, { method: 'DELETE' })
};

// ── Empresas ───────────────────────────────────────────────────
export const empresas = {
  listar:    (ativo)     => apiFetch(`/api/empresas${ativo !== undefined ? `?ativo=${ativo}` : ''}`),
  detalhe:   (id)        => apiFetch(`/api/empresas/${id}`),
  criar:     (body)      => apiFetch('/api/empresas', { method: 'POST', body: JSON.stringify(body) }),
  editar:    (id, body)  => apiFetch(`/api/empresas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  ativar:    (id)        => apiFetch(`/api/empresas/${id}/ativar`,    { method: 'PATCH' }),
  desativar: (id)        => apiFetch(`/api/empresas/${id}/desativar`, { method: 'PATCH' })
};

// ── Vistorias ──────────────────────────────────────────────────
export const vistorias = {
  listar:    (params = {}) => apiFetch(`/api/vistorias?${new URLSearchParams(params)}`),
  detalhe:   (id)          => apiFetch(`/api/vistorias/${id}`),
  criar:     (body)        => apiFetch('/api/vistorias', { method: 'POST', body: JSON.stringify(body) }),
  finalizar: (id)          => apiFetch(`/api/vistorias/${id}/finalizar`, { method: 'PATCH' }),
  publicar:  (id)          => apiFetch(`/api/vistorias/${id}/publicar`,  { method: 'PATCH' })
};

// ── Ocorrências ────────────────────────────────────────────────
export const ocorrencias = {
  criar:   (vistoria_id, body) => apiFetch(`/api/vistorias/${vistoria_id}/ocorrencias`, { method: 'POST', body: JSON.stringify(body) }),
  editar:  (id, body)          => apiFetch(`/api/ocorrencias/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  deletar: (id)                => apiFetch(`/api/ocorrencias/${id}`, { method: 'DELETE' })
};

// ── Áreas ──────────────────────────────────────────────────────
export const areas = {
  listar:    (unidade_id) => apiFetch(`/api/unidades/${unidade_id}/areas`),
  checklist: (unidade_id) => apiFetch(`/api/unidades/${unidade_id}/checklist`)
};
