import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
import { requireSuperAdmin } from '../middlewares/tenant.js';

const router = express.Router();

function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─────────────────────────────────────────
// GET /api/contas — Listar todas (super_admin)
// ─────────────────────────────────────────
router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { ativo } = req.query;
    let query = supabase.from('contas').select('*').order('nome');
    if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');

    const { data, error } = await query;
    if (error) throw error;

    // Conta de empresas e perfis por conta para o dashboard
    const { data: stats } = await supabase
      .from('empresas')
      .select('conta_id')
      .not('conta_id', 'is', null);

    const { data: statsPerfis } = await supabase
      .from('perfis')
      .select('conta_id')
      .not('conta_id', 'is', null);

    const empresasPorConta  = (stats        || []).reduce((acc, r) => { acc[r.conta_id] = (acc[r.conta_id] || 0) + 1; return acc; }, {});
    const perfisPorConta    = (statsPerfis  || []).reduce((acc, r) => { acc[r.conta_id] = (acc[r.conta_id] || 0) + 1; return acc; }, {});

    const resultado = data.map(c => ({
      ...c,
      total_empresas: empresasPorConta[c.id] || 0,
      total_usuarios: perfisPorConta[c.id]   || 0
    }));

    res.json({ ok: true, data: resultado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/contas/minha — Conta do usuário logado
// ─────────────────────────────────────────
router.get('/minha', requireAuth, async (req, res) => {
  try {
    if (!req.contaId) {
      return res.status(404).json({ ok: false, error: 'Usuário sem conta associada' });
    }
    const { data, error } = await supabase.from('contas').select('*').eq('id', req.contaId).single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/contas/:id — Detalhe
// ─────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Admin só pode ver sua própria conta; super_admin vê qualquer uma
    if (req.userPerfil !== 'super_admin' && req.contaId !== id) {
      return res.status(403).json({ ok: false, error: 'Acesso negado' });
    }

    const { data, error } = await supabase.from('contas').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Conta não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/contas — Criar nova conta (super_admin)
// ─────────────────────────────────────────
router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { nome, plano } = req.body;
    if (!nome) return res.status(400).json({ ok: false, error: 'Campo "nome" é obrigatório' });

    const slug = gerarSlug(nome);
    const planosValidos = ['basico', 'profissional', 'enterprise'];
    const planoFinal = planosValidos.includes(plano) ? plano : 'basico';

    const { data, error } = await supabase
      .from('contas')
      .insert({ nome, slug, plano: planoFinal, ativo: true })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/contas/:id — Editar conta (super_admin)
// ─────────────────────────────────────────
router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, plano } = req.body;

    const planosValidos = ['basico', 'profissional', 'enterprise'];
    const campos = { atualizado_em: new Date().toISOString() };
    if (nome  !== undefined) { campos.nome = nome; campos.slug = gerarSlug(nome); }
    if (plano !== undefined && planosValidos.includes(plano)) campos.plano = plano;

    const { data, error } = await supabase.from('contas').update(campos).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Conta não encontrada' });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/contas/:id/ativar
// ─────────────────────────────────────────
router.patch('/:id/ativar', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('contas').update({ ativo: true, atualizado_em: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Conta não encontrada' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/contas/:id/desativar
// ─────────────────────────────────────────
router.patch('/:id/desativar', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('contas').update({ ativo: false, atualizado_em: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, error: 'Conta não encontrada' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/contas/:id — Excluir conta (super_admin)
// Bloqueado se a conta tiver empresas ou perfis associados
// ─────────────────────────────────────────
router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Protege a Conta Padrão (migração legado)
    if (id === '00000000-0000-0000-0000-000000000001') {
      return res.status(403).json({ ok: false, error: 'A Conta Padrão não pode ser excluída' });
    }

    const [{ count: countEmpresas }, { count: countPerfis }] = await Promise.all([
      supabase.from('empresas').select('id', { count: 'exact', head: true }).eq('conta_id', id),
      supabase.from('perfis').select('id', { count: 'exact', head: true }).eq('conta_id', id)
    ]);

    if (countEmpresas > 0 || countPerfis > 0) {
      return res.status(400).json({
        ok: false,
        error: `Esta conta possui dados associados (${countEmpresas} empresa(s), ${countPerfis} usuário(s)). Remova os dados antes de excluir a conta.`
      });
    }

    const { error } = await supabase.from('contas').delete().eq('id', id);
    if (error) throw error;

    res.json({ ok: true, message: 'Conta removida com sucesso' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/contas/registro — Auto-cadastro (público)
// Cria conta + usuário admin em um único fluxo
// ─────────────────────────────────────────
router.post('/registro', async (req, res) => {
  try {
    const { nome_conta, nome_admin, email, senha } = req.body;

    if (!nome_conta || !nome_admin || !email || !senha) {
      return res.status(400).json({ ok: false, error: 'Todos os campos são obrigatórios: nome_conta, nome_admin, email, senha' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ ok: false, error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const slug = gerarSlug(nome_conta);

    // Verificar se slug já existe
    const { data: contaExistente } = await supabase.from('contas').select('id').eq('slug', slug).single();
    if (contaExistente) {
      return res.status(400).json({ ok: false, error: 'Já existe uma conta com esse nome. Tente um nome diferente.' });
    }

    // 1. Criar conta
    const { data: conta, error: errConta } = await supabase
      .from('contas')
      .insert({ nome: nome_conta, slug, plano: 'basico', ativo: true })
      .select()
      .single();

    if (errConta) throw errConta;

    // 2. Criar usuário no Supabase Auth
    const { data: authData, error: errAuth } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: nome_admin, role: 'admin' }
    });

    if (errAuth) {
      // Rollback: remover a conta criada
      await supabase.from('contas').delete().eq('id', conta.id);
      return res.status(400).json({ ok: false, error: errAuth.message });
    }

    // 3. Criar perfil vinculado à conta
    const { error: errPerfil } = await supabase
      .from('perfis')
      .insert({ id: authData.user.id, nome: nome_admin, perfil: 'admin', conta_id: conta.id, ativo: true });

    if (errPerfil) {
      // Rollback parcial: remover auth user e conta
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('contas').delete().eq('id', conta.id);
      throw errPerfil;
    }

    // 4. Gerar sessão para login imediato
    const { data: sessao, error: errSessao } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (errSessao) {
      // Conta criada com sucesso, apenas a sessão falhou — não reverter
      return res.status(201).json({
        ok: true,
        message: '✅ Conta criada! Faça login para continuar.',
        conta: { id: conta.id, nome: conta.nome, slug: conta.slug }
      });
    }

    res.status(201).json({
      ok: true,
      message: '✅ Conta criada com sucesso!',
      conta: { id: conta.id, nome: conta.nome, slug: conta.slug },
      user:  { id: authData.user.id, email, nome: nome_admin, role: 'admin' },
      token: sessao.session.access_token
    });

  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
