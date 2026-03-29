import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/empresas — Listar todas
// ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { ativo } = req.query;

    let query = supabase
      .from('empresas')
      .select('*')
      .order('nome');

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo === 'true');
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/empresas/:id — Detalhe
// ─────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('empresas')
      .select('*, unidades(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/empresas — Criar
// ─────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { nome, cnpj, logo_url } = req.body;

    if (!nome) {
      return res.status(400).json({ ok: false, error: 'Campo "nome" é obrigatório' });
    }

    const { data, error } = await supabase
      .from('empresas')
      .insert({ nome, cnpj, logo_url, ativo: true })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/empresas/:id — Editar
// ─────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, logo_url } = req.body;

    const campos = {};
    if (nome      !== undefined) campos.nome     = nome;
    if (cnpj      !== undefined) campos.cnpj     = cnpj;
    if (logo_url  !== undefined) campos.logo_url = logo_url;
    campos.atualizado_em = new Date().toISOString();

    const { data, error } = await supabase
      .from('empresas')
      .update(campos)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/empresas/:id/desativar — Desativar
// ─────────────────────────────────────────
router.patch('/:id/desativar', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('empresas')
      .update({ ativo: false, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/empresas/:id/ativar — Reativar
// ─────────────────────────────────────────
router.patch('/:id/ativar', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('empresas')
      .update({ ativo: true, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
