import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─────────────────────────────────────────
// GET /api/usuarios — Listar todos
// ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const usuarios = data.users.map(u => ({
      id: u.id,
      email: u.email,
      nome: u.user_metadata?.nome || null,
      role: u.user_metadata?.role || 'vistoriador',
      criado_em: u.created_at,
      ultimo_login: u.last_sign_in_at
    }));

    res.json({ ok: true, data: usuarios });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/usuarios/:id — Detalhe
// ─────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (error) throw error;
    if (!data?.user) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });

    const u = data.user;
    res.json({
      ok: true,
      data: {
        id: u.id,
        email: u.email,
        nome: u.user_metadata?.nome || null,
        role: u.user_metadata?.role || 'vistoriador',
        criado_em: u.created_at,
        ultimo_login: u.last_sign_in_at
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/usuarios/:id — Atualizar perfil
// ─────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, role } = req.body;

    const campos = { user_metadata: {} };
    if (nome !== undefined) campos.user_metadata.nome = nome;
    if (role !== undefined) campos.user_metadata.role = role;

    const { data, error } = await supabase.auth.admin.updateUserById(id, campos);
    if (error) throw error;
    if (!data?.user) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });

    const u = data.user;
    res.json({
      ok: true,
      data: {
        id: u.id,
        email: u.email,
        nome: u.user_metadata?.nome || null,
        role: u.user_metadata?.role || 'vistoriador'
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/usuarios/:id — Remover
// ─────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    res.json({ ok: true, message: '✅ Usuário removido com sucesso' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
