import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

async function podeMutate(grupoId, userPerfil, contaId) {
  if (userPerfil === 'super_admin') return true;
  const { data } = await supabase
    .from('grupos_verificacao').select('conta_id').eq('id', grupoId).single();
  if (!data) return false;
  if (data.conta_id === null) return false; // global — só super_admin altera
  return data.conta_id === contaId;
}

// ─────────────────────────────────────────
// GET /api/grupos
// Lista grupos globais + grupos da conta logada
// ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { ativo } = req.query;
    let query = supabase
      .from('grupos_verificacao')
      .select('id, nome, ativo, conta_id, criado_em')
      .order('nome');

    if (req.userPerfil === 'super_admin') {
      // super_admin só vê grupos globais (catálogo da plataforma)
      query = query.is('conta_id', null);
    } else {
      query = query.or(`conta_id.is.null,conta_id.eq.${req.contaId}`);
    }

    if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');
    const { data, error } = await query;
    if (error) throw error;

    const grupos = (data || []).map(g => ({ ...g, global: g.conta_id === null }));
    res.json({ ok: true, data: grupos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/grupos
// super_admin cria global; admin cria no escopo da conta
// ─────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome?.trim()) {
      return res.status(400).json({ ok: false, error: 'Nome é obrigatório' });
    }
    const conta_id = req.userPerfil === 'super_admin' ? null : req.contaId;
    const { data, error } = await supabase
      .from('grupos_verificacao')
      .insert({ nome: nome.trim(), ativo: true, conta_id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ ok: true, data: { ...data, global: data.conta_id === null } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/grupos/:id
// ─────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    if (!nome?.trim()) {
      return res.status(400).json({ ok: false, error: 'Nome é obrigatório' });
    }
    if (!(await podeMutate(id, req.userPerfil, req.contaId))) {
      return res.status(403).json({ ok: false, error: 'Sem permissão para editar este grupo' });
    }
    const { data, error } = await supabase
      .from('grupos_verificacao').update({ nome: nome.trim() }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Grupo não encontrado' });
    res.json({ ok: true, data: { ...data, global: data.conta_id === null } });
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
    const { id } = req.params;
    if (!(await podeMutate(id, req.userPerfil, req.contaId))) {
      return res.status(403).json({ ok: false, error: 'Sem permissão para alterar este grupo' });
    }
    const { data, error } = await supabase
      .from('grupos_verificacao').update({ ativo: true }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Grupo não encontrado' });
    res.json({ ok: true, data: { ...data, global: data.conta_id === null } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.patch('/:id/desativar', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!(await podeMutate(id, req.userPerfil, req.contaId))) {
      return res.status(403).json({ ok: false, error: 'Sem permissão para alterar este grupo' });
    }
    const { data, error } = await supabase
      .from('grupos_verificacao').update({ ativo: false }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Grupo não encontrado' });
    res.json({ ok: true, data: { ...data, global: data.conta_id === null } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/grupos/:id
// ─────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!(await podeMutate(id, req.userPerfil, req.contaId))) {
      return res.status(403).json({ ok: false, error: 'Sem permissão para remover este grupo' });
    }
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
