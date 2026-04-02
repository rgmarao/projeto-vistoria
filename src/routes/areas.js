import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/unidades/:id/areas
// Lista áreas de uma unidade (incluindo inativas para o admin)
// ?incluir_inativas=true
// ─────────────────────────────────────────
router.get('/unidades/:id/areas', requireAuth, async (req, res) => {
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
router.post('/unidades/:id/areas', requireAuth, async (req, res) => {
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
router.put('/areas/:id', requireAuth, async (req, res) => {
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
router.patch('/areas/:id/ativar', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('areas').update({ ativo: true }).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ ok: false, error: error.message });
  if (!data)  return res.status(404).json({ ok: false, error: 'Área não encontrada' });
  res.json({ ok: true, data });
});

router.patch('/areas/:id/desativar', requireAuth, async (req, res) => {
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
router.delete('/areas/:id', requireAuth, async (req, res) => {
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
// GET /api/areas/:id/itens
// Lista itens associados a uma área
// ─────────────────────────────────────────
router.get('/areas/:id/itens', requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('area_itens')
    .select(`id, ordem, item_id, itens_verificacao (id, descricao, ativo)`)
    .eq('area_id', id)
    .order('ordem');

  if (error) return res.status(500).json({ ok: false, error: error.message });

  const itens = data.map(row => ({
    area_item_id: row.id,
    item_id:      row.item_id,
    descricao:    row.itens_verificacao.descricao,
    ativo:        row.itens_verificacao.ativo,
    ordem:        row.ordem
  }));

  res.json({ ok: true, data: itens });
});

// ─────────────────────────────────────────
// POST /api/areas/:id/itens
// Associa um item a uma área
// body: { item_id, ordem? }
// ─────────────────────────────────────────
router.post('/areas/:id/itens', requireAuth, async (req, res) => {
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
router.delete('/area-itens/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('area_itens').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  res.json({ ok: true, message: 'Item removido da área' });
});

// ─────────────────────────────────────────
// GET /api/unidades/:id/checklist
// Estrutura completa (áreas + itens agrupados) — usada pelo app
// ─────────────────────────────────────────
router.get('/unidades/:id/checklist', requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data: areas, error } = await supabase
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
    .order('ordem');

  if (error) return res.status(500).json({ ok: false, error: error.message });

  const checklist = areas.map(area => ({
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

  res.json({ ok: true, data: checklist });
});

export default router;
