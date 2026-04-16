import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

const PERFIS_VALIDOS = ['admin', 'analista', 'gestor', 'usuario'];

// GET /api/perfis — Listar todos os perfis
router.get('/', requireAuth, async (req, res) => {
  try {
    const { ativo } = req.query;
    let query = supabase.from('perfis').select('*').order('nome');

    // Isolamento de tenant: super_admin vê todos; demais veem apenas sua conta
    if (req.userPerfil !== 'super_admin') {
      query = query.eq('conta_id', req.contaId);
    }

    if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/perfis/:id — Detalhe + unidades vinculadas
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let query = supabase.from('perfis').select('*').eq('id', id);
    if (req.userPerfil !== 'super_admin') query = query.eq('conta_id', req.contaId);

    const { data: perfil, error: errPerfil } = await query.single();
    if (errPerfil) throw errPerfil;
    if (!perfil) return res.status(404).json({ ok: false, error: 'Perfil não encontrado' });
    const { data: vinculos, error: errVinculos } = await supabase
      .from('usuario_unidades').select('id, unidade_id, unidades(id, nome, endereco)').eq('usuario_id', id);
    if (errVinculos) throw errVinculos;
    res.json({ ok: true, data: { ...perfil, unidades: vinculos } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/perfis — Criar perfil
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, nome, perfil } = req.body;
    if (!id || !nome) return res.status(400).json({ ok: false, error: 'Campos "id" e "nome" são obrigatórios' });
    if (perfil && !PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ ok: false, error: `Perfil inválido. Use: ${PERFIS_VALIDOS.join(', ')}` });
    }

    // Perfil herda conta_id do admin que está criando
    const conta_id = req.userPerfil === 'super_admin' ? (req.body.conta_id || null) : req.contaId;

    const { data, error } = await supabase
      .from('perfis')
      .insert({ id, nome, perfil: perfil || 'usuario', ativo: true, conta_id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/perfis/:id — Atualizar perfil
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, perfil } = req.body;
    if (perfil && !PERFIS_VALIDOS.includes(perfil)) {
      return res.status(400).json({ ok: false, error: `Perfil inválido. Use: ${PERFIS_VALIDOS.join(', ')}` });
    }
    const campos = { atualizado_em: new Date().toISOString() };
    if (nome   !== undefined) campos.nome   = nome;
    if (perfil !== undefined) campos.perfil = perfil;

    let query = supabase.from('perfis').update(campos).eq('id', id);
    if (req.userPerfil !== 'super_admin') query = query.eq('conta_id', req.contaId);

    const { data, error } = await query.select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Perfil não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH /api/perfis/:id/ativar
router.patch('/:id/ativar', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let query = supabase.from('perfis').update({ ativo: true, atualizado_em: new Date().toISOString() }).eq('id', id);
    if (req.userPerfil !== 'super_admin') query = query.eq('conta_id', req.contaId);
    const { data, error } = await query.select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Perfil não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH /api/perfis/:id/desativar
router.patch('/:id/desativar', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let query = supabase.from('perfis').update({ ativo: false, atualizado_em: new Date().toISOString() }).eq('id', id);
    if (req.userPerfil !== 'super_admin') query = query.eq('conta_id', req.contaId);
    const { data, error } = await query.select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Perfil não encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/perfis/:id/unidades — Unidades vinculadas
router.get('/:id/unidades', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('usuario_unidades').select('id, unidade_id, unidades(id, nome, endereco, ativo)').eq('usuario_id', id);
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/perfis/:id/unidades — Vincular unidade
router.post('/:id/unidades', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { unidade_id } = req.body;
    if (!unidade_id) return res.status(400).json({ ok: false, error: 'Campo "unidade_id" é obrigatório' });
    const { data, error } = await supabase.from('usuario_unidades').insert({ usuario_id: id, unidade_id }).select().single();
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/perfis/:id/unidades/:unidade_id — Desvincular unidade
router.delete('/:id/unidades/:unidade_id', requireAuth, async (req, res) => {
  try {
    const { id, unidade_id } = req.params;
    const { error } = await supabase.from('usuario_unidades').delete().eq('usuario_id', id).eq('unidade_id', unidade_id);
    if (error) throw error;
    res.json({ ok: true, message: '✅ Vínculo removido com sucesso' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
