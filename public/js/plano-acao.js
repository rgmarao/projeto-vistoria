/**
 * plano-acao.js — Lógica da página /analista/plano-acao.html
 * Gerencia criação e edição de Planos de Ação para vistorias.
 */
import { requireLogin, getUser, auth, vistorias, planosAcao, perfis } from '/js/api.js';

requireLogin();

const user    = getUser();
const params  = new URLSearchParams(location.search);
const visId   = params.get('vistoria_id');
const planoId = params.get('id'); // acesso direto por ID do plano

document.getElementById('navbar-user').textContent = user?.nome || '';

// Perfis que podem editar planos
const podeEditar = ['admin', 'analista'].includes(user?.perfil);
// Perfis que podem aprovar tarefas
const podeAprovar = ['admin', 'gestor'].includes(user?.perfil);

if (!visId && !planoId) {
  mostrarErro('Parâmetro vistoria_id ou id não informado.');
}

// ── Estado global ──────────────────────────────────────────────
let planoAtual     = null;
let visitoriaAtual = null;
let perfisCache    = [];
let itemAtual      = null;   // item_id ao adicionar tarefa
let tarefaAtual    = null;   // tarefa_id ao editar tarefa

// ── Helpers de modal ───────────────────────────────────────────
const getModal = id => window.bootstrap.Modal.getOrCreateInstance(document.getElementById(id));

// ── Badges ─────────────────────────────────────────────────────
const BADGE_PLANO = {
  aberto:    '<span class="badge badge-pendente">Aberto</span>',
  concluido: '<span class="badge badge-aprovada">Concluído</span>',
  cancelado: '<span class="badge badge-em_andamento bg-secondary-lt text-secondary">Cancelado</span>'
};
const BADGE_TAREFA = {
  pendente:    '<span class="badge badge-pendente">Pendente</span>',
  em_andamento:'<span class="badge badge-em_andamento">Em andamento</span>',
  concluida:   '<span class="badge badge-concluida">Concluída</span>',
  aprovada:    '<span class="badge badge-aprovada">Aprovada</span>'
};
const STATUS_OC_DOT = {
  ok:      '<span class="dot-ok">●</span>',
  atencao: '<span class="dot-atencao">●</span>',
  critico: '<span class="dot-critico">●</span>'
};

function mostrarErro(msg) {
  const el = document.getElementById('alerta-erro');
  el.textContent = msg;
  el.classList.remove('d-none');
  document.getElementById('estado-loading').classList.add('d-none');
}

// ── Inicialização ──────────────────────────────────────────────
async function init() {
  // Carrega perfis para dropdowns de responsável
  try {
    const r = await perfis.listar(true);
    perfisCache = r.data || [];
  } catch (_) { perfisCache = []; }

  if (visId) {
    await carregarPorVistoria(visId);
  } else if (planoId) {
    await carregarPorPlano(planoId);
  }
}

async function carregarPorVistoria(vid) {
  try {
    // Carrega dados da vistoria
    // O endpoint GET /api/vistorias/:id retorna { vistoria: {...} }
    const rv = await vistorias.detalhe(vid);
    visitoriaAtual = rv.vistoria;
    if (!visitoriaAtual) throw new Error('Vistoria não encontrada');
    renderInfoVistoria(visitoriaAtual);

    // Verifica se já existe plano
    const rp = await planosAcao.listar({ vistoria_id: vid });
    const lista = rp.data || [];

    document.getElementById('estado-loading').classList.add('d-none');

    if (lista.length) {
      await carregarPorPlano(lista[0].id);
    } else {
      document.getElementById('estado-sem-plano').classList.remove('d-none');
      if (!podeEditar) {
        document.getElementById('btn-criar-plano').classList.add('d-none');
      }
    }
  } catch (err) {
    mostrarErro('Erro ao carregar vistoria: ' + err.message);
  }
}

async function carregarPorPlano(pid) {
  try {
    const rp = await planosAcao.detalhe(pid);
    planoAtual = rp.data;

    // Garante info de vistoria
    if (!visitoriaAtual && planoAtual.vistorias) {
      visitoriaAtual = planoAtual.vistorias;
      renderInfoVistoria(visitoriaAtual);
    }

    document.getElementById('estado-loading').classList.add('d-none');
    document.getElementById('estado-sem-plano').classList.add('d-none');
    document.getElementById('estado-com-plano').classList.remove('d-none');

    renderPlanoHeader(planoAtual);
    renderItens(planoAtual.itens || []);
    document.title = `${planoAtual.titulo} · VistorIA`;
  } catch (err) {
    mostrarErro('Erro ao carregar plano: ' + err.message);
  }
}

// ── Render: info da vistoria no topo ───────────────────────────
function renderInfoVistoria(vis) {
  const unidade = vis.unidades || vis;
  const empresa = unidade?.empresas || {};
  const card    = document.getElementById('card-vis');

  document.getElementById('vis-unidade').textContent = unidade?.nome || '—';
  document.getElementById('vis-empresa').textContent = empresa?.nome || '';
  document.getElementById('vis-data').innerHTML =
    `<span class="text-muted small">${new Date(vis.data_criacao).toLocaleDateString('pt-BR')}</span>`;

  const vId = vis.id || visId;
  document.getElementById('vis-link').href = `/analista/vistoria.html?id=${vId}`;
  document.getElementById('h-breadcrumb').innerHTML =
    `<a href="/analista/vistoria.html?id=${vId}" class="text-muted">← Vistoria</a>`;

  card.classList.remove('d-none');
}

// ── Render: cabeçalho do plano ─────────────────────────────────
function renderPlanoHeader(plano) {
  document.getElementById('plano-titulo').textContent = plano.titulo;
  document.getElementById('h-titulo').textContent     = plano.titulo;

  const criador = plano.criador?.nome || '';
  const data    = new Date(plano.criado_em).toLocaleDateString('pt-BR');
  document.getElementById('plano-meta').textContent =
    `Criado por ${criador} em ${data}`;

  document.getElementById('plano-status-badge').innerHTML = BADGE_PLANO[plano.status] || plano.status;

  if (plano.observacoes) {
    document.getElementById('plano-obs').textContent = plano.observacoes;
    document.getElementById('plano-obs-row').classList.remove('d-none');
  }

  // Botões de ação para admin/analista
  const acoesEl = document.getElementById('plano-acoes');
  if (podeEditar) {
    acoesEl.innerHTML = `
      <button class="btn btn-sm btn-ghost-secondary" onclick="abrirModalEditarPlano()">Editar</button>
    `;
  }
  // Botão adicionar item
  if (podeEditar) {
    document.getElementById('btn-add-item-wrap').classList.remove('d-none');
  }
}

// ── Render: lista de itens ─────────────────────────────────────
function renderItens(itens) {
  const el = document.getElementById('lista-itens');
  if (!itens.length) {
    el.innerHTML = '<div class="text-muted text-center py-3">Nenhum item no plano ainda.</div>';
    return;
  }
  el.innerHTML = itens.map(item => renderItem(item)).join('');
}

function renderItem(item) {
  const oc     = item.ocorrencias;
  const ocInfo = oc
    ? `${STATUS_OC_DOT[oc.status] || ''} Ocorrência ${oc.numero_ocorrencia}: ${escapeHtml(oc.descricao || '')}`
    : '';

  const tarefasHtml = (item.tarefas || []).map(t => renderTarefa(t)).join('');
  const btnAdd = podeEditar
    ? `<button class="btn-add-tarefa" onclick="abrirModalTarefa('${item.id}')">+ Adicionar Tarefa</button>`
    : '';
  const btnRemItem = podeEditar
    ? `<button class="btn btn-sm btn-ghost-danger" onclick="removerItem('${item.id}')" title="Remover item">✕</button>`
    : '';

  return `
    <div class="plano-item" id="item-${item.id}">
      <div class="plano-item-hdr">
        <div>
          <div class="item-desc">${escapeHtml(item.descricao)}</div>
          ${ocInfo ? `<div class="item-oc">${ocInfo}</div>` : ''}
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-secondary-lt text-secondary">${item.tarefas?.length || 0} tarefa(s)</span>
          ${btnRemItem}
        </div>
      </div>
      <div class="plano-item-body">
        <div id="tarefas-${item.id}">
          ${tarefasHtml || '<div class="text-muted small mb-2">Nenhuma tarefa ainda.</div>'}
        </div>
        ${btnAdd}
      </div>
    </div>`;
}

function renderTarefa(t) {
  const resp  = t.responsavel?.nome || '<em class="text-muted">Sem responsável</em>';
  const prazo = t.prazo
    ? `Prazo: <strong>${new Date(t.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>`
    : '<span class="text-muted">Sem prazo</span>';

  let botoesAcao = '';
  if (podeEditar || (user?.id === t.responsavel_id)) {
    botoesAcao += `<button class="btn btn-sm btn-ghost-secondary" onclick="abrirModalEditarTarefa(${JSON.stringify(t).replace(/"/g, '&quot;')})">Editar</button>`;
  }
  if (podeEditar) {
    botoesAcao += `<button class="btn btn-sm btn-ghost-danger" onclick="excluirTarefa('${t.id}','${t.item_id}')">✕</button>`;
  }
  if (podeAprovar && t.status === 'concluida') {
    botoesAcao += `<button class="btn btn-sm btn-ghost-success" onclick="aprovarTarefa('${t.id}','${t.item_id}')">✓ Aprovar</button>`;
  }

  return `
    <div class="tarefa-card" id="tarefa-${t.id}">
      <div class="tarefa-info">
        <div class="tarefa-desc">${escapeHtml(t.descricao)}</div>
        <div class="tarefa-meta">${resp} &nbsp;·&nbsp; ${prazo}</div>
      </div>
      <div class="tarefa-acoes">
        ${BADGE_TAREFA[t.status] || t.status}
        ${botoesAcao}
      </div>
    </div>`;
}

// ── Modal: Criar Plano ─────────────────────────────────────────
window.abrirModalCriar = async () => {
  document.getElementById('criar-titulo').value = '';
  document.getElementById('criar-obs').value    = '';
  document.getElementById('criar-erro').classList.add('d-none');

  const listaEl = document.getElementById('lista-ocs-modal');
  listaEl.innerHTML = '<div class="text-center text-muted py-3"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</div>';

  getModal('modal-criar').show();

  try {
    // Carrega checklist para listar ocorrências
    const r = await fetch(`/api/vistorias/${visId}/checklist`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const d = await r.json();
    const ocorrencias = [];
    for (const area of d.areas || []) {
      for (const item of area.itens || []) {
        for (const oc of item.ocorrencias || []) {
          ocorrencias.push({ ...oc, area_nome: area.area_nome, item_desc: item.descricao });
        }
      }
    }

    if (!ocorrencias.length) {
      listaEl.innerHTML = '<div class="text-muted small">Nenhuma ocorrência registrada nesta vistoria.</div>';
      return;
    }

    listaEl.innerHTML = ocorrencias.map(oc => {
      const preSelected = ['atencao', 'critico'].includes(oc.status);
      return `
        <label class="oc-check-item">
          <input type="checkbox" name="oc-sel" value="${oc.id}"
            data-desc="${escapeAttr(oc.descricao || '')}"
            ${preSelected ? 'checked' : ''} />
          <div class="oc-label">
            <strong>${STATUS_OC_DOT[oc.status] || ''} Ocorrência ${oc.numero_ocorrencia}</strong>
            <small>${escapeHtml(oc.area_nome)} → ${escapeHtml(oc.item_desc)}</small>
            <small class="d-block text-dark">${escapeHtml(oc.descricao || '')}</small>
          </div>
        </label>`;
    }).join('');
  } catch (err) {
    listaEl.innerHTML = `<div class="text-danger small">${err.message}</div>`;
  }
};

window.salvarPlano = async () => {
  const titulo = document.getElementById('criar-titulo').value.trim() || 'Plano de Ação';
  const obs    = document.getElementById('criar-obs').value.trim();
  const erroEl = document.getElementById('criar-erro');
  const btn    = document.getElementById('btn-salvar-plano');
  erroEl.classList.add('d-none');

  const checkboxes = document.querySelectorAll('input[name="oc-sel"]:checked');
  const itens = Array.from(checkboxes).map(cb => ({
    ocorrencia_id: cb.value,
    descricao:     cb.dataset.desc || `Ocorrência ${cb.value}`
  }));

  btn.disabled = true;
  try {
    const r = await planosAcao.criar({ vistoria_id: visId, titulo, observacoes: obs || null, itens });
    planoAtual = r.data;
    getModal('modal-criar').hide();
    document.getElementById('estado-sem-plano').classList.add('d-none');
    document.getElementById('estado-com-plano').classList.remove('d-none');
    renderPlanoHeader(planoAtual);
    renderItens(planoAtual.itens || []);
  } catch (err) {
    erroEl.textContent = err.message;
    erroEl.classList.remove('d-none');
  } finally { btn.disabled = false; }
};

// ── Modal: Editar Cabeçalho do Plano ──────────────────────────
window.abrirModalEditarPlano = () => {
  document.getElementById('editar-plano-titulo').value = planoAtual.titulo;
  document.getElementById('editar-plano-obs').value    = planoAtual.observacoes || '';
  document.getElementById('editar-plano-status').value = planoAtual.status;
  document.getElementById('editar-plano-erro').classList.add('d-none');
  getModal('modal-editar-plano').show();
};

window.salvarEditarPlano = async () => {
  const titulo = document.getElementById('editar-plano-titulo').value.trim();
  const obs    = document.getElementById('editar-plano-obs').value.trim();
  const status = document.getElementById('editar-plano-status').value;
  const erroEl = document.getElementById('editar-plano-erro');
  const btn    = document.getElementById('btn-salvar-editar-plano');
  if (!titulo) { erroEl.textContent = 'Título é obrigatório.'; erroEl.classList.remove('d-none'); return; }
  btn.disabled = true;
  erroEl.classList.add('d-none');
  try {
    await planosAcao.editar(planoAtual.id, { titulo, observacoes: obs || null, status });
    getModal('modal-editar-plano').hide();
    await carregarPorPlano(planoAtual.id);
  } catch (err) {
    erroEl.textContent = err.message;
    erroEl.classList.remove('d-none');
  } finally { btn.disabled = false; }
};

// ── Modal: Adicionar Item Livre ────────────────────────────────
window.abrirModalItem = () => {
  document.getElementById('item-desc').value = '';
  document.getElementById('item-erro').classList.add('d-none');
  getModal('modal-item').show();
};

window.salvarItem = async () => {
  const desc   = document.getElementById('item-desc').value.trim();
  const erroEl = document.getElementById('item-erro');
  const btn    = document.getElementById('btn-salvar-item');
  if (!desc) { erroEl.textContent = 'Descrição é obrigatória.'; erroEl.classList.remove('d-none'); return; }
  btn.disabled = true;
  erroEl.classList.add('d-none');
  try {
    const r = await planosAcao.adicionarItem(planoAtual.id, { descricao: desc });
    getModal('modal-item').hide();
    const listaEl = document.getElementById('lista-itens');
    // Remove placeholder se existir
    const placeholder = listaEl.querySelector('.text-muted.text-center');
    if (placeholder) placeholder.remove();
    listaEl.insertAdjacentHTML('beforeend', renderItem(r.data));
  } catch (err) {
    erroEl.textContent = err.message;
    erroEl.classList.remove('d-none');
  } finally { btn.disabled = false; }
};

// ── Remover item ───────────────────────────────────────────────
window.removerItem = async (itemId) => {
  if (!confirm('Remover este item e todas as suas tarefas?')) return;
  try {
    await planosAcao.removerItem(planoAtual.id, itemId);
    document.getElementById(`item-${itemId}`)?.remove();
  } catch (err) { alert(err.message); }
};

// ── Modal: Adicionar / Editar Tarefa ──────────────────────────
function preencherSelectResponsavel(selecionado = '') {
  const sel = document.getElementById('tarefa-responsavel');
  sel.innerHTML = '<option value="">— Sem responsável —</option>' +
    perfisCache.map(p =>
      `<option value="${p.id}" ${p.id === selecionado ? 'selected' : ''}>${escapeHtml(p.nome)}</option>`
    ).join('');
}

window.abrirModalTarefa = (itemId) => {
  itemAtual   = itemId;
  tarefaAtual = null;
  document.getElementById('tarefa-modal-titulo').textContent = 'Nova Tarefa';
  document.getElementById('tarefa-desc').value      = '';
  document.getElementById('tarefa-prazo').value     = '';
  document.getElementById('tarefa-status').value    = 'pendente';
  document.getElementById('tarefa-status-group').classList.add('d-none');
  document.getElementById('tarefa-erro').classList.add('d-none');
  preencherSelectResponsavel();
  getModal('modal-tarefa').show();
};

window.abrirModalEditarTarefa = (tarefa) => {
  itemAtual   = tarefa.item_id;
  tarefaAtual = tarefa.id;
  document.getElementById('tarefa-modal-titulo').textContent = 'Editar Tarefa';
  document.getElementById('tarefa-desc').value      = tarefa.descricao || '';
  document.getElementById('tarefa-prazo').value     = tarefa.prazo || '';
  document.getElementById('tarefa-status').value    = tarefa.status || 'pendente';
  document.getElementById('tarefa-status-group').classList.remove('d-none');
  document.getElementById('tarefa-erro').classList.add('d-none');
  preencherSelectResponsavel(tarefa.responsavel_id || '');
  getModal('modal-tarefa').show();
};

window.salvarTarefa = async () => {
  const desc   = document.getElementById('tarefa-desc').value.trim();
  const resp   = document.getElementById('tarefa-responsavel').value;
  const prazo  = document.getElementById('tarefa-prazo').value;
  const status = document.getElementById('tarefa-status').value;
  const erroEl = document.getElementById('tarefa-erro');
  const btn    = document.getElementById('btn-salvar-tarefa');
  if (!desc) { erroEl.textContent = 'Descrição é obrigatória.'; erroEl.classList.remove('d-none'); return; }
  btn.disabled = true;
  erroEl.classList.add('d-none');
  try {
    let r;
    if (tarefaAtual) {
      r = await planosAcao.editarTarefa(tarefaAtual, { descricao: desc, responsavel_id: resp || null, prazo: prazo || null, status });
    } else {
      r = await planosAcao.adicionarTarefa(planoAtual.id, itemAtual, { descricao: desc, responsavel_id: resp || null, prazo: prazo || null });
    }
    getModal('modal-tarefa').hide();
    // Recarrega item (mais simples que manipular DOM granularmente)
    await recarregarItem(itemAtual);
  } catch (err) {
    erroEl.textContent = err.message;
    erroEl.classList.remove('d-none');
  } finally { btn.disabled = false; }
};

// ── Excluir tarefa ─────────────────────────────────────────────
window.excluirTarefa = async (tarefaId, itemId) => {
  if (!confirm('Excluir esta tarefa?')) return;
  try {
    await planosAcao.excluirTarefa(tarefaId);
    await recarregarItem(itemId);
  } catch (err) { alert(err.message); }
};

// ── Aprovar tarefa ─────────────────────────────────────────────
window.aprovarTarefa = async (tarefaId, itemId) => {
  try {
    await planosAcao.aprovarTarefa(tarefaId);
    await recarregarItem(itemId);
  } catch (err) { alert(err.message); }
};

// ── Recarrega as tarefas de um item específico (sem reload total) ──
async function recarregarItem(itemId) {
  try {
    const rp = await planosAcao.detalhe(planoAtual.id);
    planoAtual = rp.data;
    const item = planoAtual.itens.find(i => i.id === itemId);
    if (!item) return;
    const el = document.getElementById(`item-${itemId}`);
    if (el) el.outerHTML = renderItem(item);
  } catch (err) { console.error(err); }
}

// ── Logout ─────────────────────────────────────────────────────
window.logout = async () => { await auth.logout(); window.location.href = '/index.html'; };

// ── Sanitização ────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Start ──────────────────────────────────────────────────────
init();
