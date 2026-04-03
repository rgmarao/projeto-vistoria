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
        unidades (id, nome, endereco, empresas(id, nome)),
        perfis (id, nome)
      `)
      .order('data_criacao', { ascending: false });

    if (perfil.perfil === 'usuario') {
      const { data: vinculos } = await supabase
        .from('usuario_unidades')
        .select('unidade_id')
        .eq('usuario_id', req.user.id);

      const unidadeIds = vinculos?.map(v => v.unidade_id) || [];

      query = query
        .in('unidade_id', unidadeIds)
        .eq('status', 'publicada');
    }

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

    return res.json({ ok: true, data });

  } catch (err) {
    console.error('Erro ao listar vistorias:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// GET /api/vistorias/:id/checklist
// Retorna vistoria + estrutura completa (áreas → itens → ocorrências)
// Usado pela view web para preenchimento/visualização
// ─────────────────────────────────────────
router.get('/:id/checklist', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Busca vistoria com unidade
    const { data: vis, error: errVis } = await supabase
      .from('vistorias')
      .select('*, unidades(id, nome, endereco, empresas(id, nome))')
      .eq('id', id)
      .single();

    if (errVis || !vis) return res.status(404).json({ error: 'Vistoria não encontrada' });

    // 2. Busca áreas ativas da unidade com seus itens
    const { data: areas, error: errAreas } = await supabase
      .from('areas')
      .select('id, nome, ordem, area_itens(id, item_id, ordem, itens_verificacao(id, descricao))')
      .eq('unidade_id', vis.unidade_id)
      .eq('ativo', true)
      .order('ordem');

    if (errAreas) throw errAreas;

    // 3. Busca ocorrências da vistoria com URLs assinadas
    const { data: ocorrencias, error: errOcs } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('vistoria_id', id)
      .order('numero_ocorrencia');

    if (errOcs) throw errOcs;

    // 4. Assina URLs das fotos
    const ocsComFotos = await Promise.all((ocorrencias || []).map(async oc => {
      let foto_1_signed = null, foto_2_signed = null;
      if (oc.foto_1_url) {
        const { data: s } = await supabase.storage.from('fotos').createSignedUrl(oc.foto_1_url, 3600);
        foto_1_signed = s?.signedUrl || null;
      }
      if (oc.foto_2_url) {
        const { data: s } = await supabase.storage.from('fotos').createSignedUrl(oc.foto_2_url, 3600);
        foto_2_signed = s?.signedUrl || null;
      }
      return { ...oc, foto_1_signed, foto_2_signed };
    }));

    // 5. Indexa ocorrências por item_id para lookup rápido
    const ocsPorItem = {};
    for (const oc of ocsComFotos) {
      const key = `${oc.area_id}_${oc.item_id}`;
      if (!ocsPorItem[key]) ocsPorItem[key] = [];
      ocsPorItem[key].push(oc);
    }

    // 6. Monta estrutura areas → itens → ocorrências
    const estrutura = (areas || []).map(area => ({
      area_id:   area.id,
      area_nome: area.nome,
      itens: (area.area_itens || [])
        .sort((a, b) => a.ordem - b.ordem)
        .map(ai => ({
          area_item_id: ai.id,
          item_id:      ai.item_id,
          descricao:    ai.itens_verificacao?.descricao || '',
          ocorrencias:  ocsPorItem[`${area.id}_${ai.item_id}`] || []
        }))
    }));

    return res.json({
      ok: true,
      vistoria: {
        id:              vis.id,
        status:          vis.status,
        data_criacao:    vis.data_criacao,
        data_finalizacao: vis.data_finalizacao,
        unidade_id:      vis.unidade_id,
        unidade_nome:    vis.unidades?.nome,
        empresa_nome:    vis.unidades?.empresas?.nome,
      },
      areas: estrutura
    });

  } catch (err) {
    console.error('Erro ao buscar checklist da vistoria:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// GET /api/vistorias/:id
// Retorna detalhe completo de uma vistoria
// Inclui URLs assinadas das fotos das ocorrências
// ─────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

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
        unidades (id, nome, endereco, logo_url, empresas(id, nome)),
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

    if (perfil.perfil === 'usuario' && data.status !== 'publicada') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // ✅ Gera URLs assinadas para fotos de cada ocorrência
    const ocorrenciasComFotos = await Promise.all(
      (data.ocorrencias || []).map(async (oc) => {
        let foto_1_signed = null;
        let foto_2_signed = null;

        if (oc.foto_1_url) {
          const { data: s1 } = await supabase.storage
            .from('fotos')
            .createSignedUrl(oc.foto_1_url, 3600);
          foto_1_signed = s1?.signedUrl || null;
        }

        if (oc.foto_2_url) {
          const { data: s2 } = await supabase.storage
            .from('fotos')
            .createSignedUrl(oc.foto_2_url, 3600);
          foto_2_signed = s2?.signedUrl || null;
        }

        return {
          ...oc,
          foto_1_signed, // ✅ URL assinada pronta para exibir
          foto_2_signed,
        };
      })
    );

    return res.json({
      vistoria: {
        ...data,
        ocorrencias: ocorrenciasComFotos
      }
    });

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

// PATCH /api/vistorias/:id/reabrir
// Muda status de "finalizada" para "em_andamento"
// Perfil: admin | analista
// ─────────────────────────────────────────
router.patch('/:id/reabrir', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', req.user.id)
      .single();

    if (perfilError || !['admin', 'analista'].includes(perfil?.perfil)) {
      return res.status(403).json({ error: 'Sem permissão para reabrir vistorias' });
    }

    const { data: vistoria } = await supabase
      .from('vistorias')
      .select('status')
      .eq('id', id)
      .single();

    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    if (vistoria.status !== 'finalizada') {
      return res.status(400).json({ error: `Vistoria não pode ser reaberta — status atual: ${vistoria.status}` });
    }

    const { error } = await supabase
      .from('vistorias')
      .update({ status: 'em_andamento', atualizado_em: new Date().toISOString() })
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    return res.json({ ok: true, message: 'Vistoria reaberta com sucesso' });

  } catch (err) {
    console.error('Erro ao reabrir vistoria:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
