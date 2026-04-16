import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─────────────────────────────────────────
// POST /api/auth/login
// Login com email e senha
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome, perfil, conta_id')
      .eq('id', data.user.id)
      .single();

    return res.json({
      message: '✅ Login realizado com sucesso',
      user: {
        id:       data.user.id,
        email:    data.user.email,
        nome:     perfil?.nome     || null,
        role:     perfil?.perfil   || data.user.user_metadata?.role || 'vistoriador',
        conta_id: perfil?.conta_id || null
      },
      token: data.session.access_token
    });

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/logout
// Logout do usuário autenticado
// ─────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: '✅ Logout realizado com sucesso' });

  } catch (err) {
    console.error('Erro no logout:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// GET /api/auth/me
// Retorna dados do usuário autenticado
// ─────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome, perfil, conta_id')
      .eq('id', req.user.id)
      .single();

    return res.json({
      user: {
        id:       req.user.id,
        email:    req.user.email,
        nome:     perfil?.nome     || null,
        role:     perfil?.perfil   || req.user.user_metadata?.role || 'vistoriador',
        conta_id: perfil?.conta_id || null
      }
    });

  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/reset-password
// Envia email de recuperação de senha
// ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: '✅ Email de recuperação enviado com sucesso' });

  } catch (err) {
    console.error('Erro ao resetar senha:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/register
// Cadastro de novo usuário
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
          role: 'vistoriador'
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: '✅ Usuário cadastrado com sucesso',
      user: {
        id: data.user.id,
        email: data.user.email,
        nome: data.user.user_metadata?.nome,
        role: data.user.user_metadata?.role
      }
    });

  } catch (err) {
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


export default router;