import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';
import { blockSuperAdmin } from '../middlewares/tenant.js';
import { resolveSemaforos } from '../utils/semaforos.js';

const router = express.Router();

// Retorna IDs de todas as unidades pertencentes ao tenant
async function unidadeIdsDoTenant(contaId) {
  const { data: empresas } = await supabase.from('empresas').select('id').eq('conta_id', contaId);
  const empIds = (empresas || []).map(e => e.id);
  if (!empIds.length) return [];
  const { data: unidades } = await supabase.from('unidades').select('id').in('empresa_id', empIds);
  return (unidades || []).map(u => u.id);
}

// Verifica se uma vistoria pertence ao tenant (via unidade→empresa→conta)
async function vistoriaPertenceAoTenant(vistoriaId, contaId) {
  const { data: vis } = await supabase.from('vistorias').select('unidade_id').eq('id', vistoriaId).single();
  if (!vis) return false;
  const { data: check } = await supabase
    .from('unidades')
    .select('id, empresas!inner(conta_id)')
    .eq('id', vis.unidade_id)
    .eq('empresas.conta_id', contaId)
    .single();
  return !!check;
}

// ─────────────────────────────────────────
// POST /api/vistorias
// ─────────────────────────────────────────
router.post('/', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { unidade_id } = req.body;

    if (!unidade_id) {
      return res.status(400).json({ error: 'unidade_id é obrigatório' });
    }

    if (!['admin', 'analista'].includes(req.userPerfil)) {
      return res.status(403).json({ error: 'Sem permissão para criar vistorias' });
    }

    // Verifica que a unidade pertence ao tenant do usuário
    const unidadeIds = await unidadeIdsDoTenant(req.contaId);
    if (!unidadeIds.includes(unidade_id)) {
      return res.status(403).json({ error: 'Unidade não pertence à sua conta' });
    }

    const { data: ultimaVersao } = await supabase
      .from('estrutura_versoes')
      .select('id')
      .eq('unidade_id', unidade_id)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('vistorias')
      .insert({
        unidade_id,
        criado_por: req.user.id,
        status: 'em_andamento',
        data_criacao: new Date().toISOString(),
        estrutura_versao_id: ultimaVersao?.id || null
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
// ─────────────────────────────────────────
router.get('/', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { status, unidade_id } = req.query;
    const perfilAtual = req.userPerfil;

    let query = supabase
      .from('vistorias')
      .select(`
        *,
        unidades (id, nome, endereco, empresas(id, nome)),
        perfis (id, nome)
      `)
      .order('data_criacao', { ascending: false });

    if (perfilAtual === 'usuario') {
      const { data: vinculos } = await supabase
        .from('usuario_unidades')
        .select('unidade_id')
        .eq('usuario_id', req.user.id);

      const unidadeIds = vinculos?.map(v => v.unidade_id) || [];
      query = query.in('unidade_id', unidadeIds).eq('status', 'publicada');
    } else {
      // admin, analista, gestor: apenas vistorias do próprio tenant
      const unidadeIds = await unidadeIdsDoTenant(req.contaId);
      if (!unidadeIds.length) return res.json({ ok: true, data: [] });
      query = query.in('unidade_id', unidadeIds);
    }

    if (status && perfilAtual !== 'usuario') {
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
// ─────────────────────────────────────────
router.get('/:id/checklist', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica acesso ao tenant
    if (!(await vistoriaPertenceAoTenant(id, req.contaId))) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    const { data: vis, error: errVis } = await supabase
      .from('vistorias')
      .select('*, unidades(id, nome, endereco, configuracao_semaforos, empresas(id, nome, configuracao_semaforos))')
      .eq('id', id)
      .single();

    if (errVis || !vis) return res.status(404).json({ error: 'Vistoria não encontrada' });

    let areasList;

    if (vis.estrutura_versao_id) {
      const { data: versao, error: errVersao } = await supabase
        .from('estrutura_versoes')
        .select('estrutura')
        .eq('id', vis.estrutura_versao_id)
        .single();
      if (errVersao) throw errVersao;
      areasList = versao?.estrutura || [];
    } else {
      const { data: areas, error: errAreas } = await supabase
        .from('areas')
        .select('id, nome, ordem, area_itens(id, item_id, ordem, itens_verificacao(id, descricao))')
        .eq('unidade_id', vis.unidade_id)
        .eq('ativo', true)
        .order('ordem');
      if (errAreas) throw errAreas;
      areasList = (areas || []).map(area => ({
        area_id:   area.id,
        area_nome: area.nome,
        itens: (area.area_itens || [])
          .sort((a, b) => a.ordem - b.ordem)
          .map(ai => ({
            area_item_id: ai.id,
            item_id:      ai.item_id,
            descricao:    ai.itens_verificacao?.descricao || '',
            ordem:        ai.ordem
          }))
      }));
    }

    const { data: ocorrencias, error: errOcs } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('vistoria_id', id)
      .order('numero_ocorrencia');

    if (errOcs) throw errOcs;

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

    const ocsPorItem = {};
    for (const oc of ocsComFotos) {
      const key = `${oc.area_id}_${oc.item_id}`;
      if (!ocsPorItem[key]) ocsPorItem[key] = [];
      ocsPorItem[key].push(oc);
    }

    const estrutura = areasList.map(area => ({
      area_id:   area.area_id,
      area_nome: area.area_nome,
      itens: (area.itens || []).map(item => ({
        area_item_id: item.area_item_id,
        item_id:      item.item_id,
        descricao:    item.descricao || '',
        ocorrencias:  ocsPorItem[`${area.area_id}_${item.item_id}`] || []
      }))
    }));

    const semaforos = resolveSemaforos(
      vis.unidades?.empresas?.configuracao_semaforos,
      vis.unidades?.configuracao_semaforos
    );

    return res.json({
      ok: true,
      vistoria: {
        id:               vis.id,
        status:           vis.status,
        data_criacao:     vis.data_criacao,
        data_finalizacao: vis.data_finalizacao,
        unidade_id:       vis.unidade_id,
        unidade_nome:     vis.unidades?.nome,
        empresa_nome:     vis.unidades?.empresas?.nome,
      },
      semaforos,
      areas: estrutura
    });

  } catch (err) {
    console.error('Erro ao buscar checklist da vistoria:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ─────────────────────────────────────────
// GET /api/vistorias/:id
// ─────────────────────────────────────────
router.get('/:id', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const perfilAtual = req.userPerfil;

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

    // Verificação de acesso ao tenant (via unidade → empresa → conta)
    if (perfilAtual === 'usuario') {
      if (data.status !== 'publicada') {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      const { data: vinculo } = await supabase
        .from('usuario_unidades')
        .select('id')
        .eq('usuario_id', req.user.id)
        .eq('unidade_id', data.unidade_id)
        .single();
      if (!vinculo) return res.status(404).json({ error: 'Vistoria não encontrada' });
    } else {
      // admin, analista, gestor: verifica se unidade pertence ao tenant
      const { data: tenantCheck } = await supabase
        .from('unidades')
        .select('id, empresas!inner(conta_id)')
        .eq('id', data.unidade_id)
        .eq('empresas.conta_id', req.contaId)
        .single();
      if (!tenantCheck) return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    const ocorrenciasComFotos = await Promise.all(
      (data.ocorrencias || []).map(async (oc) => {
        let foto_1_signed = null;
        let foto_2_signed = null;

        if (oc.foto_1_url) {
          const { data: s1 } = await supabase.storage.from('fotos').createSignedUrl(oc.foto_1_url, 3600);
          foto_1_signed = s1?.signedUrl || null;
        }

        if (oc.foto_2_url) {
          const { data: s2 } = await supabase.storage.from('fotos').createSignedUrl(oc.foto_2_url, 3600);
          foto_2_signed = s2?.signedUrl || null;
        }

        return { ...oc, foto_1_signed, foto_2_signed };
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
// ─────────────────────────────────────────
router.patch('/:id/finalizar', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!['admin', 'analista'].includes(req.userPerfil)) {
      return res.status(403).json({ error: 'Sem permissão para finalizar vistorias' });
    }

    if (!(await vistoriaPertenceAoTenant(id, req.contaId))) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    const { data: vistoria } = await supabase.from('vistorias').select('status').eq('id', id).single();

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
// ─────────────────────────────────────────
router.patch('/:id/publicar', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!['admin', 'analista'].includes(req.userPerfil)) {
      return res.status(403).json({ error: 'Sem permissão para publicar vistorias' });
    }

    if (!(await vistoriaPertenceAoTenant(id, req.contaId))) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    const { data: vistoria } = await supabase.from('vistorias').select('status').eq('id', id).single();

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

// ─────────────────────────────────────────
// PATCH /api/vistorias/:id/reabrir
// ─────────────────────────────────────────
router.patch('/:id/reabrir', requireAuth, blockSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!['admin', 'analista'].includes(req.userPerfil)) {
      return res.status(403).json({ error: 'Sem permissão para reabrir vistorias' });
    }

    if (!(await vistoriaPertenceAoTenant(id, req.contaId))) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    const { data: vistoria } = await supabase.from('vistorias').select('status').eq('id', id).single();

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
