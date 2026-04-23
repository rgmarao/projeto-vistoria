import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
import { blockSuperAdmin } from '../middlewares/tenant.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Carrega um plano com itens e tarefas aninhadas */
async function carregarPlanoCompleto(id) {
  const { data: plano, error } = await supabase
    .from('planos_acao')
    .select(`
      *,
      criador:criado_por(id, nome),
      vistorias(id, status, data_criacao, unidades(id, nome, empresas(id, nome)))
    `)
    .eq('id', id)
    .single();

  if (error || !plano) return null;

  const { data: itens } = await supabase
    .from('plano_acao_itens')
    .select('*, ocorrencias(id, numero_ocorrencia, status, descricao)')
    .eq('plano_id', id)
    .order('criado_em');

  const itenIds = (itens || []).map(i => i.id);
  let tarefasPorItem = {};

  if (itenIds.length) {
    const { data: tarefas } = await supabase
      .from('plano_acao_tarefas')
      .select('*, responsavel:responsavel_id(id, nome), aprovador:aprovado_por(id, nome)')
      .in('item_id', itenIds)
      .order('criado_em');

    for (const t of tarefas || []) {
      if (!tarefasPorItem[t.item_id]) tarefasPorItem[t.item_id] = [];
      tarefasPorItem[t.item_id].push(t);
    }
  }

  plano.itens = (itens || []).map(item => ({
    ...item,
    tarefas: tarefasPorItem[item.id] || []
  }));

  return plano;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/planos-acao — Listar planos
// Query: vistoria_id, unidade_id, responsavel_id, meus (true = minhas tarefas)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { vistoria_id, unidade_id, responsavel_id } = req.query;

    let query = supabase
      .from('planos_acao')
      .select(`
        id, titulo, status, criado_em, atualizado_em,
        criador:criado_por(id, nome),
        vistorias(id, status, data_criacao, unidades(id, nome, empresas(id, nome)))
      `)
      .order('criado_em', { ascending: false });

    if (vistoria_id) query = query.eq('vistoria_id', vistoria_id);
    if (unidade_id)  query = query.eq('vistorias.unidade_id', unidade_id);

    const { data, error } = await query;
    if (error) throw error;

    // Filtro por responsável (tarefas onde o usuário é responsável)
    if (responsavel_id) {
      const { data: tarefas } = await supabase
        .from('plano_acao_tarefas')
        .select('item_id')
        .eq('responsavel_id', responsavel_id);

      if (tarefas?.length) {
        const itemIds = tarefas.map(t => t.item_id);
        const { data: itens } = await supabase
          .from('plano_acao_itens')
          .select('plano_id')
          .in('id', itemIds);
        const planoIds = [...new Set((itens || []).map(i => i.plano_id))];
        const filtrado = (data || []).filter(p => planoIds.includes(p.id));
        return res.json({ ok: true, data: filtrado });
      }
      return res.json({ ok: true, data: [] });
    }

    res.json({ ok: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/planos-acao/tarefas/:tarefa_id — Detalhe de tarefa
// (Rota literal ANTES de /:id para evitar conflito de parâmetro)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tarefas/:tarefa_id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { tarefa_id } = req.params;
    const { data, error } = await supabase
      .from('plano_acao_tarefas')
      .select('*, responsavel:responsavel_id(id, nome), aprovador:aprovado_por(id, nome)')
      .eq('id', tarefa_id)
      .single();
    if (error || !data) return res.status(404).json({ ok: false, error: 'Tarefa não encontrada' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/planos-acao/tarefas/:tarefa_id — Atualizar tarefa
// ─────────────────────────────────────────────────────────────────────────────
router.put('/tarefas/:tarefa_id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { tarefa_id } = req.params;
    const { descricao, responsavel_id, prazo, status } = req.body;
    const campos = { atualizado_em: new Date().toISOString() };
    if (descricao      !== undefined) campos.descricao      = descricao;
    if (responsavel_id !== undefined) campos.responsavel_id = responsavel_id || null;
    if (prazo          !== undefined) campos.prazo          = prazo || null;
    if (status         !== undefined) campos.status         = status;

    const { data, error } = await supabase
      .from('plano_acao_tarefas')
      .update(campos)
      .eq('id', tarefa_id)
      .select('*, responsavel:responsavel_id(id, nome)')
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Tarefa não encontrada' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/planos-acao/tarefas/:tarefa_id — Excluir tarefa
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/tarefas/:tarefa_id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { tarefa_id } = req.params;
    const { error } = await supabase.from('plano_acao_tarefas').delete().eq('id', tarefa_id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/planos-acao/tarefas/:tarefa_id/aprovar — Aprovar tarefa
// Apenas admin ou gestor
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/tarefas/:tarefa_id/aprovar', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { tarefa_id } = req.params;
    const userId = req.user?.id;

    // Verificar perfil
    const { data: perfil } = await supabase
      .from('perfis').select('perfil').eq('id', userId).single();
    if (!['admin', 'gestor'].includes(perfil?.perfil)) {
      return res.status(403).json({ ok: false, error: 'Apenas gestor ou admin pode aprovar tarefas' });
    }

    // Verificar se tarefa está concluída
    const { data: tarefa } = await supabase
      .from('plano_acao_tarefas').select('status').eq('id', tarefa_id).single();
    if (!tarefa) return res.status(404).json({ ok: false, error: 'Tarefa não encontrada' });
    if (tarefa.status !== 'concluida') {
      return res.status(400).json({ ok: false, error: 'Só é possível aprovar tarefas com status "concluida"' });
    }

    const { data, error } = await supabase
      .from('plano_acao_tarefas')
      .update({
        status: 'aprovada',
        aprovado_por: userId,
        aprovado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .eq('id', tarefa_id)
      .select('*, responsavel:responsavel_id(id, nome), aprovador:aprovado_por(id, nome)')
      .single();

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/planos-acao/minhas-tarefas — Tarefas do usuário logado
// (Rota literal ANTES de /:id para evitar conflito de parâmetro)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/minhas-tarefas', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { data, error } = await supabase
      .from('plano_acao_tarefas')
      .select(`
        *,
        responsavel:responsavel_id(id, nome),
        aprovador:aprovado_por(id, nome),
        plano_acao_itens(
          id, descricao, ocorrencia_id,
          planos_acao(
            id, titulo, status,
            vistorias(id, data_criacao, unidades(id, nome, empresas(id, nome)))
          )
        )
      `)
      .eq('responsavel_id', userId)
      .order('prazo', { ascending: true, nullsFirst: false });

    if (error) throw error;
    res.json({ ok: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/planos-acao/:id — Detalhe completo
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const plano = await carregarPlanoCompleto(req.params.id);
    if (!plano) return res.status(404).json({ ok: false, error: 'Plano não encontrado' });
    res.json({ ok: true, data: plano });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/planos-acao — Criar plano
// Body: { vistoria_id, titulo?, observacoes?, itens: [{ ocorrencia_id?, descricao, tarefas: [...] }] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { vistoria_id, titulo, observacoes, itens } = req.body;
    const userId = req.user?.id;

    if (!vistoria_id) return res.status(400).json({ ok: false, error: 'Campo "vistoria_id" é obrigatório' });

    // Criar o plano
    const { data: plano, error: errPlano } = await supabase
      .from('planos_acao')
      .insert({
        vistoria_id,
        criado_por: userId,
        titulo: titulo || 'Plano de Ação',
        observacoes: observacoes || null
      })
      .select()
      .single();

    if (errPlano) throw errPlano;

    // Criar itens e tarefas se fornecidos
    if (itens?.length) {
      for (const item of itens) {
        const { data: novoItem, error: errItem } = await supabase
          .from('plano_acao_itens')
          .insert({
            plano_id: plano.id,
            ocorrencia_id: item.ocorrencia_id || null,
            descricao: item.descricao
          })
          .select()
          .single();

        if (errItem) throw errItem;

        if (item.tarefas?.length) {
          const tarefasParaInserir = item.tarefas.map(t => ({
            item_id: novoItem.id,
            descricao: t.descricao,
            responsavel_id: t.responsavel_id || null,
            prazo: t.prazo || null
          }));
          const { error: errTarefas } = await supabase
            .from('plano_acao_tarefas')
            .insert(tarefasParaInserir);
          if (errTarefas) throw errTarefas;
        }
      }
    }

    const planoCompleto = await carregarPlanoCompleto(plano.id);
    res.status(201).json({ ok: true, data: planoCompleto });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ ok: false, error: 'Já existe um plano de ação para esta vistoria' });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/planos-acao/:id — Atualizar cabeçalho do plano
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, observacoes, status } = req.body;
    const campos = { atualizado_em: new Date().toISOString() };
    if (titulo      !== undefined) campos.titulo      = titulo;
    if (observacoes !== undefined) campos.observacoes = observacoes || null;
    if (status      !== undefined) campos.status      = status;

    const { data, error } = await supabase
      .from('planos_acao').update(campos).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Plano não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/planos-acao/:id/itens — Adicionar item ao plano
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/itens', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, ocorrencia_id } = req.body;
    if (!descricao) return res.status(400).json({ ok: false, error: 'Campo "descricao" é obrigatório' });

    const { data, error } = await supabase
      .from('plano_acao_itens')
      .insert({ plano_id: id, descricao, ocorrencia_id: ocorrencia_id || null })
      .select('*, ocorrencias(id, numero_ocorrencia, status, descricao)')
      .single();
    if (error) throw error;
    data.tarefas = [];
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/planos-acao/:id/itens/:item_id — Remover item
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id/itens/:item_id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { item_id } = req.params;
    const { error } = await supabase.from('plano_acao_itens').delete().eq('id', item_id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/planos-acao/:id/itens/:item_id/tarefas — Adicionar tarefa ao item
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/itens/:item_id/tarefas', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { item_id } = req.params;
    const { descricao, responsavel_id, prazo } = req.body;
    if (!descricao) return res.status(400).json({ ok: false, error: 'Campo "descricao" é obrigatório' });

    const { data, error } = await supabase
      .from('plano_acao_tarefas')
      .insert({
        item_id,
        descricao,
        responsavel_id: responsavel_id || null,
        prazo: prazo || null
      })
      .select('*, responsavel:responsavel_id(id, nome)')
      .single();
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
