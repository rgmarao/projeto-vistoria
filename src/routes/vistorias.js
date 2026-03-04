import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─────────────────────────────────────────
// POST /api/vistorias
// Cria uma nova vistoria
// Perfil: admin | analista
// ─────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { unidade_id } = req.body;

    if (!unidade_id) {
      return res.status(400).json({ error: 'unidade_id é obrigatório' });
    }

    // Busca perfil do usuário
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', req.user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(403).json({ error: 'Perfil de usuário não encontrado' });
    }

    if (!['admin', 'analista'].includes(perfil.perfil)) {
      return res.status(403).json({ error: 'Sem permissão para criar vistorias' });
    }

    const { data, error } = await supabase
      .from('vistorias')
      .insert({
        unidade_id,
        criado_por: req.user.id,
        status: 'em_andamento',
        data_criacao: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: '✅ Vistoria criada com sucesso',
      vistoria: data
    });

  } catch (err) {
    console.error('Erro ao criar vistoria:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// GET /api/vistorias
// Lista vistorias com filtros opcionais
// ?status=em_andamento|finalizada|publicada
// ?unidade_id=uuid
// Perfil: admin vê tudo | analista vê suas unidades | usuario só publicadas
// ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, unidade_id } = req.query;

    // Busca perfil do usuário
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', req.user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(403).json({ error: 'Perfil de usuário não encontrado' });
    }

    let query = supabase
      .from('vistorias')
      .select(`
        *,
        unidades (id, nome, endereco),
        perfis (id, nome)
      `)
      .order('data_criacao', { ascending: false });

    // Restrições por perfil
    if (perfil.perfil === 'usuario') {
      // Busca apenas unidades vinculadas ao usuário
      const { data: vinculos } = await supabase
        .from('usuario_unidades')
        .select('unidade_id')
        .eq('usuario_id', req.user.id);

      const unidadeIds = vinculos?.map(v => v.unidade_id) || [];

      query = query
        .in('unidade_id', unidadeIds)
        .eq('status', 'publicada'); // usuário só vê publicadas
    }

    // Filtros opcionais
    if (status && perfil.perfil !== 'usuario') {
      query = query.eq('status', status);
    }

    if (unidade_id) {
      query = query.eq('unidade_id', unidade_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      total: data.length,
      vistorias: data
    });

  } catch (err) {
    console.error('Erro ao listar vistorias:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// GET /api/vistorias/:id
// Retorna detalhe completo de uma vistoria
// ─────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Busca perfil do usuário
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', req.user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(403).json({ error: 'Perfil de usuário não encontrado' });
    }

    const { data, error } = await supabase
      .from('vistorias')
      .select(`
        *,
        unidades (id, nome, endereco, logo_url),
        perfis (id, nome),
        ocorrencias (
          id,
          area_id,
          item_id,
          numero_ocorrencia,
          descricao,
          status,
          recomendacao,
          foto_1_url,
          foto_2_url,
          origem,
          criado_em,
          areas (id, nome),
          itens_verificacao (id, descricao)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    // Usuário comum só vê vistorias publicadas
    if (perfil.perfil === 'usuario' && data.status !== 'publicada') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    return res.json({ vistoria: data });

  } catch (err) {
    console.error('Erro ao buscar vistoria:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// PATCH /api/vistorias/:id/finalizar
// Muda status para "finalizada"
// Perfil: admin | analista
// ─────────────────────────────────────────
router.patch('/:id/finalizar', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', req.user.id)
      .single();

    if (perfilError || !['admin', 'analista'].includes(perfil?.perfil)) {
      return res.status(403).json({ error: 'Sem permissão para finalizar vistorias' });
    }

    // Verifica se vistoria existe e está em_andamento
    const { data: vistoria } = await supabase
      .from('vistorias')
      .select('status')
      .eq('id', id)
      .single();

    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    if (vistoria.status !== 'em_andamento') {
      return res.status(400).json({ error: `Vistoria não pode ser finalizada — status atual: ${vistoria.status}` });
    }

    const { data, error } = await supabase
      .from('vistorias')
      .update({
        status: 'finalizada',
        data_finalizacao: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      message: '✅ Vistoria finalizada com sucesso',
      vistoria: data
    });

  } catch (err) {
    console.error('Erro ao finalizar vistoria:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// PATCH /api/vistorias/:id/publicar
// Muda status para "publicada"
// Perfil: admin | analista
// ─────────────────────────────────────────
router.patch('/:id/publicar', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', req.user.id)
      .single();

    if (perfilError || !['admin', 'analista'].includes(perfil?.perfil)) {
      return res.status(403).json({ error: 'Sem permissão para publicar vistorias' });
    }

    // Verifica se vistoria existe e está finalizada
    const { data: vistoria } = await supabase
      .from('vistorias')
      .select('status')
      .eq('id', id)
      .single();

    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    if (vistoria.status !== 'finalizada') {
      return res.status(400).json({ error: `Vistoria não pode ser publicada — status atual: ${vistoria.status}` });
    }

    const { data, error } = await supabase
      .from('vistorias')
      .update({
        status: 'publicada',
        data_publicacao: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      message: '✅ Vistoria publicada com sucesso',
      vistoria: data
    });

  } catch (err) {
    console.error('Erro ao publicar vistoria:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
