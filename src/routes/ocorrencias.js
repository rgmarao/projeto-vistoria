import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/vistorias/:id/ocorrencias
// Adicionar ocorrência a uma vistoria
// ─────────────────────────────────────────────
router.post('/vistorias/:id/ocorrencias', requireAuth, async (req, res) => {
  try {
    const { id: vistoria_id } = req.params;
    const {
      area_id,
      item_id,
      descricao,
      status,
      recomendacao,
      foto_1_url,
      foto_2_url,
      origem
    } = req.body;

    // Verifica se a vistoria existe e está em_andamento
    const { data: vistoria, error: errVistoria } = await supabase
      .from('vistorias')
      .select('id, status')
      .eq('id', vistoria_id)
      .single();

    if (errVistoria || !vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    if (vistoria.status !== 'em_andamento') {
      return res.status(400).json({
        error: 'Só é possível adicionar ocorrências em vistorias em andamento'
      });
    }

    // Valida recomendação — só permitida em amarelo ou vermelho
    const statusPermiteRecomendacao = ['amarelo', 'vermelho'];
    const recomendacaoFinal =
      status && statusPermiteRecomendacao.includes(status) ? recomendacao : null;

    // Busca o próximo número de ocorrência para esta vistoria
    const { count } = await supabase
      .from('ocorrencias')
      .select('id', { count: 'exact', head: true })
      .eq('vistoria_id', vistoria_id);

    const numero_ocorrencia = (count || 0) + 1;

    // Insere a ocorrência
    const { data: ocorrencia, error } = await supabase
      .from('ocorrencias')
      .insert({
        vistoria_id,
        area_id: area_id || null,
        item_id: item_id || null,
        numero_ocorrencia,
        descricao: descricao || null,
        status: status || 'sem_status',
        recomendacao: recomendacaoFinal || null,
        foto_1_url: foto_1_url || null,
        foto_2_url: foto_2_url || null,
        origem: origem || 'web',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: '✅ Ocorrência criada com sucesso',
      ocorrencia
    });

  } catch (err) {
    console.error('Erro ao criar ocorrência:', err);
    return res.status(500).json({ error: 'Erro interno ao criar ocorrência' });
  }
});

export default router;
