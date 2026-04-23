import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
import { blockSuperAdmin } from '../middlewares/tenant.js';
import { resolveSemaforos } from '../utils/semaforos.js';

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/empresas — Listar todas
// ─────────────────────────────────────────
router.get('/', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { ativo } = req.query;

    let query = supabase.from('empresas').select('*').order('nome').eq('conta_id', req.contaId);

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
router.get('/:id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('empresas').select('*, unidades(*)').eq('id', id).eq('conta_id', req.contaId).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/empresas/:id/semaforos — Config efetiva
// ─────────────────────────────────────────
router.get('/:id/semaforos', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('empresas').select('configuracao_semaforos').eq('id', id).eq('conta_id', req.contaId).single();
    if (error || !data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    const semaforos = resolveSemaforos(data.configuracao_semaforos, null);
    res.json({ ok: true, data: semaforos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/empresas — Criar
// ─────────────────────────────────────────
router.post('/', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { nome, cnpj, logo_url, configuracao_semaforos } = req.body;

    if (!nome) {
      return res.status(400).json({ ok: false, error: 'Campo "nome" é obrigatório' });
    }

    const { data, error } = await supabase
      .from('empresas')
      .insert({ nome, cnpj, logo_url, configuracao_semaforos: configuracao_semaforos || null, ativo: true, conta_id: req.contaId })
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
router.put('/:id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, logo_url, configuracao_semaforos } = req.body;

    const campos = {};
    if (nome                    !== undefined) campos.nome                    = nome;
    if (cnpj                    !== undefined) campos.cnpj                    = cnpj;
    if (logo_url                !== undefined) campos.logo_url                = logo_url;
    if (configuracao_semaforos  !== undefined) campos.configuracao_semaforos  = configuracao_semaforos;
    campos.atualizado_em = new Date().toISOString();

    const { data, error } = await supabase
      .from('empresas').update(campos).eq('id', id).eq('conta_id', req.contaId).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/empresas/:id/desativar
// ─────────────────────────────────────────
router.patch('/:id/desativar', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('empresas').update({ ativo: false, atualizado_em: new Date().toISOString() })
      .eq('id', id).eq('conta_id', req.contaId).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/empresas/:id/ativar
// ─────────────────────────────────────────
router.patch('/:id/ativar', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('empresas').update({ ativo: true, atualizado_em: new Date().toISOString() })
      .eq('id', id).eq('conta_id', req.contaId).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Empresa não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
