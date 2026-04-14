import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/grupos
// Lista todos os grupos de verificação
// ?ativo=true|false
// ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { ativo } = req.query;
    let query = supabase
      .from('grupos_verificacao')
      .select('id, nome, ativo, criado_em')
      .order('nome');
    if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/grupos
// Cria um grupo de verificação
// body: { nome }
// ─────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome?.trim()) {
      return res.status(400).json({ ok: false, error: 'Nome é obrigatório' });
    }
    const { data, error } = await supabase
      .from('grupos_verificacao')
      .insert({ nome: nome.trim(), ativo: true })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/grupos/:id
// Edita um grupo
// body: { nome }
// ─────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    if (!nome?.trim()) {
      return res.status(400).json({ ok: false, error: 'Nome é obrigatório' });
    }
    const { data, error } = await supabase
      .from('grupos_verificacao')
      .update({ nome: nome.trim() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Grupo não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/grupos/:id/ativar
// PATCH /api/grupos/:id/desativar
// ─────────────────────────────────────────
router.patch('/:id/ativar', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grupos_verificacao').update({ ativo: true }).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Grupo não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.patch('/:id/desativar', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grupos_verificacao').update({ ativo: false }).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Grupo não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/grupos/:id
// Remove grupo (somente se não tiver itens associados)
// ─────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { count } = await supabase
      .from('itens_verificacao').select('id', { count: 'exact', head: true }).eq('grupo_id', id);

    if (count > 0) {
      return res.status(400).json({
        ok: false,
        error: `Este grupo possui ${count} item(ns) associado(s). Remova a associação primeiro.`
      });
    }

    const { error } = await supabase.from('grupos_verificacao').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true, message: 'Grupo removido com sucesso' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
