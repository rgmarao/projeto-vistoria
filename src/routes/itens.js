import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Verifica se o usuário pode modificar o item (tenant dono ou super_admin)
async function podeMutate(itemId, userPerfil, contaId) {
  if (userPerfil === 'super_admin') return true;
  const { data } = await supabase
    .from('itens_verificacao').select('conta_id').eq('id', itemId).single();
  if (!data) return false;
  // Itens globais (conta_id NULL) só super_admin pode alterar
  if (data.conta_id === null) return false;
  return data.conta_id === contaId;
}

// ─────────────────────────────────────────
// GET /api/itens
// Lista itens globais + itens da conta logada
// super_admin vê tudo
// ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { ativo, grupo_id } = req.query;
    let query = supabase
      .from('itens_verificacao')
      .select('id, descricao, ativo, grupo_id, conta_id, grupos_verificacao(id, nome), criado_em')
      .order('descricao');

    if (req.userPerfil === 'super_admin') {
      // super_admin só vê itens globais (catálogo da plataforma)
      query = query.is('conta_id', null);
    } else {
      // Globais (NULL) + próprios da conta
      query = query.or(`conta_id.is.null,conta_id.eq.${req.contaId}`);
    }

    if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');
    if (grupo_id)            query = query.eq('grupo_id', grupo_id);

    const { data, error } = await query;
    if (error) throw error;

    const itens = (data || []).map(i => ({
      ...i,
      global:     i.conta_id === null,
      grupo_nome: i.grupos_verificacao?.nome || null,
      grupos_verificacao: undefined
    }));

    res.json({ ok: true, data: itens });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/itens
// Cria item: admin → escopo da conta; super_admin → global (conta_id NULL)
// ─────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { descricao, grupo_id } = req.body;
    if (!descricao?.trim()) {
      return res.status(400).json({ ok: false, error: 'Descrição é obrigatória' });
    }

    const payload = { descricao: descricao.trim(), ativo: true };
    if (grupo_id) payload.grupo_id = grupo_id;

    // super_admin cria global (null); demais criam no escopo da sua conta
    payload.conta_id = req.userPerfil === 'super_admin' ? null : req.contaId;

    const { data, error } = await supabase
      .from('itens_verificacao')
      .insert(payload)
      .select('id, descricao, ativo, grupo_id, conta_id, grupos_verificacao(id, nome), criado_em')
      .single();
    if (error) throw error;

    res.status(201).json({
      ok: true,
      data: { ...data, global: data.conta_id === null, grupo_nome: data.grupos_verificacao?.nome || null }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/itens/:id
// Só edita itens da própria conta (ou super_admin edita qualquer)
// ─────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, grupo_id } = req.body;
    if (!descricao?.trim()) {
      return res.status(400).json({ ok: false, error: 'Descrição é obrigatória' });
    }
    if (!(await podeMutate(id, req.userPerfil, req.contaId))) {
      return res.status(403).json({ ok: false, error: 'Sem permissão para editar este item' });
    }
    const payload = { descricao: descricao.trim(), grupo_id: grupo_id || null };
    const { data, error } = await supabase
      .from('itens_verificacao')
      .update(payload)
      .eq('id', id)
      .select('id, descricao, ativo, grupo_id, conta_id, grupos_verificacao(id, nome), criado_em')
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Item não encontrado' });
    res.json({ ok: true, data: { ...data, global: data.conta_id === null, grupo_nome: data.grupos_verificacao?.nome || null } });
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
    const { id } = req.params;
    if (!(await podeMutate(id, req.userPerfil, req.contaId))) {
      return res.status(403).json({ ok: false, error: 'Sem permissão para alterar este item' });
    }
    const { data, error } = await supabase
      .from('itens_verificacao').update({ ativo: true }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Item não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.patch('/:id/desativar', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!(await podeMutate(id, req.userPerfil, req.contaId))) {
      return res.status(403).json({ ok: false, error: 'Sem permissão para alterar este item' });
    }
    const { data, error } = await supabase
      .from('itens_verificacao').update({ ativo: false }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Item não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
