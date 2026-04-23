import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { blockSuperAdmin } from '../middlewares/tenant.js';
import { supabase } from '../config/supabase.js';
import { resolveSemaforos } from '../utils/semaforos.js';

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/unidades/:id/areas
// Lista áreas de uma unidade (incluindo inativas para o admin)
// ?incluir_inativas=true
// ─────────────────────────────────────────
router.get('/unidades/:id/areas', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { incluir_inativas } = req.query;

  let query = supabase
    .from('areas')
    .select('id, nome, ordem, ativo')
    .eq('unidade_id', id)
    .order('ordem');

  if (!incluir_inativas) query = query.eq('ativo', true);

  const { data, error } = await query;
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, data });
});

// ─────────────────────────────────────────
// POST /api/unidades/:id/areas
// Cria uma nova área para uma unidade
// body: { nome, ordem? }
// ─────────────────────────────────────────
router.post('/unidades/:id/areas', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { nome, ordem } = req.body;

  if (!nome?.trim()) {
    return res.status(400).json({ ok: false, error: 'Nome é obrigatório' });
  }

  // Calcula próxima ordem se não informada
  let ordemFinal = ordem;
  if (ordemFinal === undefined) {
    const { data: existentes } = await supabase
      .from('areas').select('ordem').eq('unidade_id', id).order('ordem', { ascending: false }).limit(1);
    ordemFinal = existentes?.length ? (existentes[0].ordem + 10) : 10;
  }

  const { data, error } = await supabase
    .from('areas')
    .insert({ unidade_id: id, nome: nome.trim(), ordem: ordemFinal, ativo: true })
    .select()
    .single();

  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.status(201).json({ ok: true, data });
});

// ─────────────────────────────────────────
// PUT /api/areas/:id
// Edita nome e/ou ordem de uma área
// ─────────────────────────────────────────
router.put('/areas/:id', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { nome, ordem } = req.body;

  const campos = {};
  if (nome  !== undefined) campos.nome  = nome.trim();
  if (ordem !== undefined) campos.ordem = ordem;

  if (!Object.keys(campos).length) {
    return res.status(400).json({ ok: false, error: 'Nenhum campo para atualizar' });
  }

  const { data, error } = await supabase
    .from('areas').update(campos).eq('id', id).select().single();

  if (error) return res.status(400).json({ ok: false, error: error.message });
  if (!data)  return res.status(404).json({ ok: false, error: 'Área não encontrada' });
  res.json({ ok: true, data });
});

// ─────────────────────────────────────────
// PATCH /api/areas/:id/ativar
// PATCH /api/areas/:id/desativar
// ─────────────────────────────────────────
router.patch('/areas/:id/ativar', requireAuth, blockSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('areas').update({ ativo: true }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ ok: false, error: error.message });
  if (!data)  return res.status(404).json({ ok: false, error: 'Área não encontrada' });
  res.json({ ok: true, data });
});

router.patch('/areas/:id/desativar', requireAuth, blockSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('areas').update({ ativo: false }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ ok: false, error: error.message });
  if (!data)  return res.status(404).json({ ok: false, error: 'Área não encontrada' });
  res.json({ ok: true, data });
});

// ─────────────────────────────────────────
// DELETE /api/areas/:id
// Remove área (só se não tiver itens associados)
// ─────────────────────────────────────────
router.delete('/areas/:id', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;

  const { count } = await supabase
    .from('area_itens').select('id', { count: 'exact', head: true }).eq('area_id', id);

  if (count > 0) {
    return res.status(400).json({
      ok: false,
      error: `Esta área possui ${count} item(ns) associado(s). Remova os itens primeiro.`
    });
  }

  const { error } = await supabase.from('areas').delete().eq('id', id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.json({ ok: true, message: 'Área removida com sucesso' });
});

// ─────────────────────────────────────────
// PATCH /api/unidades/:id/areas/reordenar
// Atualiza a ordem das áreas em batch
// body: { ordens: [{ id, ordem }] }
// ─────────────────────────────────────────
router.patch('/unidades/:id/areas/reordenar', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { ordens } = req.body;

  if (!Array.isArray(ordens) || !ordens.length) {
    return res.status(400).json({ ok: false, error: 'ordens deve ser um array não vazio' });
  }

  const updates = ordens.map(({ id: areaId, ordem }) =>
    supabase.from('areas').update({ ordem }).eq('id', areaId).eq('unidade_id', id)
  );

  const results = await Promise.all(updates);
  const falha = results.find(r => r.error);
  if (falha) return res.status(400).json({ ok: false, error: falha.error.message });

  res.json({ ok: true });
});

// ─────────────────────────────────────────
// PATCH /api/areas/:id/itens/reordenar
// Atualiza a ordem dos itens de uma área em batch
// body: { ordens: [{ id (area_item_id), ordem }] }
// ─────────────────────────────────────────
router.patch('/areas/:id/itens/reordenar', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { ordens } = req.body;

  if (!Array.isArray(ordens) || !ordens.length) {
    return res.status(400).json({ ok: false, error: 'ordens deve ser um array não vazio' });
  }

  const updates = ordens.map(({ id: areaItemId, ordem }) =>
    supabase.from('area_itens').update({ ordem }).eq('id', areaItemId).eq('area_id', id)
  );

  const results = await Promise.all(updates);
  const falha = results.find(r => r.error);
  if (falha) return res.status(400).json({ ok: false, error: falha.error.message });

  res.json({ ok: true });
});

// ─────────────────────────────────────────
// GET /api/areas/:id/itens
// Lista itens associados a uma área
// ─────────────────────────────────────────
router.get('/areas/:id/itens', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('area_itens')
    .select(`id, ordem, item_id, itens_verificacao (id, descricao, ativo, grupo_id, grupos_verificacao(id, nome))`)
    .eq('area_id', id)
    .order('ordem');

  if (error) return res.status(500).json({ ok: false, error: error.message });

  const itens = data.map(row => ({
    area_item_id: row.id,
    item_id:      row.item_id,
    descricao:    row.itens_verificacao.descricao,
    ativo:        row.itens_verificacao.ativo,
    grupo_id:     row.itens_verificacao.grupo_id || null,
    grupo_nome:   row.itens_verificacao.grupos_verificacao?.nome || null,
    ordem:        row.ordem
  }));

  res.json({ ok: true, data: itens });
});

// ─────────────────────────────────────────
// POST /api/areas/:id/itens
// Associa um item a uma área
// body: { item_id, ordem? }
// ─────────────────────────────────────────
router.post('/areas/:id/itens', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { item_id, ordem } = req.body;

  if (!item_id) {
    return res.status(400).json({ ok: false, error: 'item_id é obrigatório' });
  }

  // Verifica duplicata
  const { data: dup } = await supabase
    .from('area_itens').select('id').eq('area_id', id).eq('item_id', item_id).single();
  if (dup) {
    return res.status(400).json({ ok: false, error: 'Este item já está associado a esta área' });
  }

  let ordemFinal = ordem;
  if (ordemFinal === undefined) {
    const { data: existentes } = await supabase
      .from('area_itens').select('ordem').eq('area_id', id).order('ordem', { ascending: false }).limit(1);
    ordemFinal = existentes?.length ? (existentes[0].ordem + 10) : 10;
  }

  const { data, error } = await supabase
    .from('area_itens')
    .insert({ area_id: id, item_id, ordem: ordemFinal })
    .select(`id, ordem, item_id, itens_verificacao(id, descricao)`)
    .single();

  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.status(201).json({ ok: true, data });
});

// ─────────────────────────────────────────
// DELETE /api/area-itens/:id
// Remove a associação item↔área
// ─────────────────────────────────────────
router.delete('/area-itens/:id', requireAuth, blockSuperAdmin, async (req, res) => {
  const { error } = await supabase.from('area_itens').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.json({ ok: true, message: 'Item removido da área' });
});

// ─────────────────────────────────────────
// POST /api/unidades/:id/estrutura/publicar
// Salva snapshot da estrutura atual como nova versão
// Perfil: admin
// ─────────────────────────────────────────
router.post('/unidades/:id/estrutura/publicar', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;

  const { data: perfil } = await supabase
    .from('perfis').select('perfil').eq('id', req.user.id).single();

  if (!perfil || perfil.perfil !== 'admin') {
    return res.status(403).json({ ok: false, error: 'Apenas administradores podem publicar estruturas' });
  }

  const { data: areas, error: errAreas } = await supabase
    .from('areas')
    .select(`
      id, nome, ordem,
      area_itens (
        id, ordem, item_id,
        itens_verificacao (id, descricao)
      )
    `)
    .eq('unidade_id', id)
    .eq('ativo', true)
    .order('ordem');

  if (errAreas) return res.status(500).json({ ok: false, error: errAreas.message });

  const snapshot = (areas || []).map(area => ({
    area_id:    area.id,
    area_nome:  area.nome,
    area_ordem: area.ordem,
    itens: (area.area_itens || [])
      .sort((a, b) => a.ordem - b.ordem)
      .map(ai => ({
        area_item_id: ai.id,
        item_id:      ai.item_id,
        descricao:    ai.itens_verificacao?.descricao || '',
        ordem:        ai.ordem
      }))
  }));

  const { data, error } = await supabase
    .from('estrutura_versoes')
    .insert({ unidade_id: id, estrutura: snapshot, criado_por: req.user.id })
    .select()
    .single();

  if (error) return res.status(400).json({ ok: false, error: error.message });
  return res.status(201).json({ ok: true, data });
});

// ─────────────────────────────────────────
// GET /api/unidades/:id/estrutura/versoes/ultima
// Retorna metadados da última versão publicada
// ─────────────────────────────────────────
router.get('/unidades/:id/estrutura/versoes/ultima', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;

  const { data } = await supabase
    .from('estrutura_versoes')
    .select('id, criado_em, criado_por, perfis(nome)')
    .eq('unidade_id', id)
    .order('criado_em', { ascending: false })
    .limit(1)
    .single();

  return res.json({ ok: true, data: data || null });
});

// ─────────────────────────────────────────
// GET /api/unidades/:id/checklist
// Estrutura completa (áreas + itens agrupados) — usada pelo app
// Inclui `semaforos` (configuração efetiva herdada empresa → unidade)
// ─────────────────────────────────────────
router.get('/unidades/:id/checklist', requireAuth, blockSuperAdmin, async (req, res) => {
  const { id } = req.params;

  const [areasResult, unidadeResult] = await Promise.all([
    supabase
      .from('areas')
      .select(`
        id, nome, ordem,
        area_itens (
          id, ordem, item_id,
          itens_verificacao (id, descricao, ativo)
        )
      `)
      .eq('unidade_id', id)
      .eq('ativo', true)
      .order('ordem'),
    supabase
      .from('unidades')
      .select('configuracao_semaforos, empresas(configuracao_semaforos)')
      .eq('id', id)
      .single()
  ]);

  if (areasResult.error) return res.status(500).json({ ok: false, error: areasResult.error.message });

  const checklist = areasResult.data.map(area => ({
    area_id:   area.id,
    area_nome: area.nome,
    ordem:     area.ordem,
    itens: area.area_itens
      .filter(ai => ai.itens_verificacao?.ativo)
      .sort((a, b) => a.ordem - b.ordem)
      .map(ai => ({
        area_item_id: ai.id,
        item_id:      ai.item_id,
        descricao:    ai.itens_verificacao.descricao,
        ordem:        ai.ordem,
      }))
  }));

  const semaforos = resolveSemaforos(
    unidadeResult.data?.empresas?.configuracao_semaforos,
    unidadeResult.data?.configuracao_semaforos
  );

  res.json({ ok: true, data: checklist, semaforos });
});

export default router;
