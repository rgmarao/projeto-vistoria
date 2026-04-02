import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/itens
// Lista todos os itens de verificação (biblioteca global)
// ?ativo=true|false
// ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { ativo } = req.query;
    let query = supabase
      .from('itens_verificacao')
      .select('id, descricao, ativo, criado_em')
      .order('descricao');
    if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/itens
// Cria um item de verificação
// ─────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { descricao } = req.body;
    if (!descricao?.trim()) {
      return res.status(400).json({ ok: false, error: 'Descrição é obrigatória' });
    }
    const { data, error } = await supabase
      .from('itens_verificacao')
      .insert({ descricao: descricao.trim(), ativo: true })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/itens/:id
// Edita a descrição de um item
// ─────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao } = req.body;
    if (!descricao?.trim()) {
      return res.status(400).json({ ok: false, error: 'Descrição é obrigatória' });
    }
    const { data, error } = await supabase
      .from('itens_verificacao')
      .update({ descricao: descricao.trim() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Item não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/itens/:id/ativar
// PATCH /api/itens/:id/desativar
// ─────────────────────────────────────────
router.patch('/:id/ativar', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('itens_verificacao').update({ ativo: true }).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Item não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.patch('/:id/desativar', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('itens_verificacao').update({ ativo: false }).eq('id', req.params.id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Item não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
