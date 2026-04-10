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

// ── Fetch helper para FormData (upload de arquivos) ────────────
async function apiFetchForm(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
    // Content-Type não definido — o browser define automaticamente com boundary
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
  publicar:  (id)          => apiFetch(`/api/vistorias/${id}/publicar`,  { method: 'PATCH' }),
  reabrir:   (id)          => apiFetch(`/api/vistorias/${id}/reabrir`,   { method: 'PATCH' })
};

// ── Ocorrências ────────────────────────────────────────────────
export const ocorrencias = {
  criar:   (vistoria_id, body) => apiFetch(`/api/vistorias/${vistoria_id}/ocorrencias`, { method: 'POST', body: JSON.stringify(body) }),
  editar:  (id, body)          => apiFetch(`/api/ocorrencias/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  deletar: (id)                => apiFetch(`/api/ocorrencias/${id}`, { method: 'DELETE' })
};

// ── Unidades ───────────────────────────────────────────────────
export const unidades = {
  listar:      (params = {}) => apiFetch(`/api/unidades?${new URLSearchParams(params)}`),
  detalhe:     (id)          => apiFetch(`/api/unidades/${id}`),
  criar:       (formData)    => apiFetchForm('/api/unidades',    { method: 'POST', body: formData }),
  editar:      (id, formData)=> apiFetchForm(`/api/unidades/${id}`, { method: 'PUT', body: formData }),
  ativar:      (id)          => apiFetch(`/api/unidades/${id}/ativar`,    { method: 'PATCH' }),
  desativar:   (id)          => apiFetch(`/api/unidades/${id}/desativar`, { method: 'PATCH' }),
  removerLogo: (id)          => apiFetch(`/api/unidades/${id}/logo`,      { method: 'DELETE' })
};

// ── Itens de verificação ───────────────────────────────────────
export const itens = {
  listar:    (ativo)    => apiFetch(`/api/itens${ativo !== undefined ? `?ativo=${ativo}` : ''}`),
  criar:     (body)     => apiFetch('/api/itens',       { method: 'POST',   body: JSON.stringify(body) }),
  editar:    (id, body) => apiFetch(`/api/itens/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  ativar:    (id)       => apiFetch(`/api/itens/${id}/ativar`,    { method: 'PATCH' }),
  desativar: (id)       => apiFetch(`/api/itens/${id}/desativar`, { method: 'PATCH' })
};

// ── Estrutura (áreas + itens por unidade) ─────────────────────
export const estrutura = {
  listarAreas:   (unidade_id)       => apiFetch(`/api/unidades/${unidade_id}/areas?incluir_inativas=true`),
  criarArea:     (unidade_id, body) => apiFetch(`/api/unidades/${unidade_id}/areas`, { method: 'POST',   body: JSON.stringify(body) }),
  editarArea:    (area_id, body)    => apiFetch(`/api/areas/${area_id}`,             { method: 'PUT',    body: JSON.stringify(body) }),
  ativarArea:    (area_id)          => apiFetch(`/api/areas/${area_id}/ativar`,      { method: 'PATCH' }),
  desativarArea: (area_id)          => apiFetch(`/api/areas/${area_id}/desativar`,   { method: 'PATCH' }),
  deletarArea:   (area_id)          => apiFetch(`/api/areas/${area_id}`,             { method: 'DELETE' }),
  listarItens:   (area_id)          => apiFetch(`/api/areas/${area_id}/itens`),
  adicionarItem: (area_id, body)    => apiFetch(`/api/areas/${area_id}/itens`,     { method: 'POST',   body: JSON.stringify(body) }),
  removerItem:   (area_item_id)     => apiFetch(`/api/area-itens/${area_item_id}`, { method: 'DELETE' }),
  checklist:          (unidade_id) => apiFetch(`/api/unidades/${unidade_id}/checklist`),
  publicarEstrutura:  (unidade_id) => apiFetch(`/api/unidades/${unidade_id}/estrutura/publicar`, { method: 'POST' }),
  ultimaVersao:       (unidade_id) => apiFetch(`/api/unidades/${unidade_id}/estrutura/versoes/ultima`)
};

// ── Áreas ──────────────────────────────────────────────────────
export const areas = {
  listar:    (unidade_id) => apiFetch(`/api/unidades/${unidade_id}/areas`),
  checklist: (unidade_id) => apiFetch(`/api/unidades/${unidade_id}/checklist`)
};
