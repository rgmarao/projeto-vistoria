import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/vistorias/:id/ocorrencias
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
      origem
    } = req.body;

    if (!descricao) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    // Valida status
    const statusValidos = ['ok', 'atencao', 'critico'];
    const statusFinal = statusValidos.includes(status) ? status : 'ok';

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

    // Recomendação só permitida em atencao ou critico
    const recomendacaoFinal =
      ['atencao', 'critico'].includes(statusFinal) ? (recomendacao || null) : null;

    // Próximo número de ocorrência
    const { count } = await supabase
      .from('ocorrencias')
      .select('id', { count: 'exact', head: true })
      .eq('vistoria_id', vistoria_id);

    const numero_ocorrencia = (count || 0) + 1;

    const { data: ocorrencia, error } = await supabase
      .from('ocorrencias')
      .insert({
        vistoria_id,
        area_id:           area_id    || null,
        item_id:           item_id    || null,
        numero_ocorrencia,
        descricao,
        status:            statusFinal,
        recomendacao:      recomendacaoFinal,
        foto_1_url:        null,
        foto_2_url:        null,
        origem:            origem     || 'vistoria',
        criado_em:         new Date().toISOString(),
        atualizado_em:     new Date().toISOString()
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

// ─────────────────────────────────────────────
// PUT /api/ocorrencias/:id
// Editar ocorrência
// ─────────────────────────────────────────────
router.put('/ocorrencias/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, status, recomendacao } = req.body;

    // Valida status
    const statusValidos = ['ok', 'atencao', 'critico'];
    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Use: ${statusValidos.join(', ')}` });
    }

    // Verifica se ocorrência existe
    const { data: existente, error: errBusca } = await supabase
      .from('ocorrencias')
      .select('id, status')
      .eq('id', id)
      .single();

    if (errBusca || !existente) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' });
    }

    const statusFinal = status || existente.status;

    // Recomendação só permitida em atencao ou critico
    const recomendacaoFinal =
      ['atencao', 'critico'].includes(statusFinal) ? (recomendacao || null) : null;

    const campos = {
      ...(descricao && { descricao }),
      status:       statusFinal,
      recomendacao: recomendacaoFinal,
      atualizado_em: new Date().toISOString()
    };

    const { data: ocorrencia, error } = await supabase
      .from('ocorrencias')
      .update(campos)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: '✅ Ocorrência atualizada com sucesso',
      ocorrencia
    });

  } catch (err) {
    console.error('Erro ao editar ocorrência:', err);
    return res.status(500).json({ error: 'Erro interno ao editar ocorrência' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/ocorrencias/:id
// Remover ocorrência
// ─────────────────────────────────────────────
router.delete('/ocorrencias/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se existe
    const { data: existente, error: errBusca } = await supabase
      .from('ocorrencias')
      .select('id')
      .eq('id', id)
      .single();

    if (errBusca || !existente) {
      return res.status(404).json({ error: 'Ocorrência não encontrada' });
    }

    const { error } = await supabase
      .from('ocorrencias')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      message: '✅ Ocorrência removida com sucesso'
    });

  } catch (err) {
    console.error('Erro ao remover ocorrência:', err);
    return res.status(500).json({ error: 'Erro interno ao remover ocorrência' });
  }
});

export default router;
