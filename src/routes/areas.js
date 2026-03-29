import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/unidades/:id/areas — lista áreas de uma unidade
router.get('/unidades/:id/areas', requireAuth, async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('areas')
        .select('id, nome, ordem')
        .eq('unidade_id', id)
        .eq('ativo', true)
        .order('ordem');

    if (error) return res.status(500).json({ erro: error.message });

    res.json(data);
});

// GET /api/areas/:id/itens — lista itens de uma área
router.get('/areas/:id/itens', requireAuth, async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('area_itens')
        .select(`
            ordem,
            itens_verificacao (
                id,
                descricao
            )
        `)
        .eq('area_id', id)
        .order('ordem');

    if (error) return res.status(500).json({ erro: error.message });

    const itens = data.map(row => ({
        id: row.itens_verificacao.id,
        descricao: row.itens_verificacao.descricao,
        ordem: row.ordem
    }));

    res.json(itens);
});

// GET /api/unidades/:id/checklist — estrutura completa (áreas + itens agrupados)
router.get('/unidades/:id/checklist', requireAuth, async (req, res) => {
    const { id } = req.params;

    const { data: areas, error } = await supabase
        .from('areas')
        .select(`
            id,
            nome,
            ordem,
            area_itens (
                id,
                ordem,
                item_id,
                itens_verificacao (
                    id,
                    descricao,
                    ativo
                )
            )
        `)
        .eq('unidade_id', id)
        .eq('ativo', true)
        .order('ordem');

    if (error) return res.status(500).json({ erro: error.message });

    const checklist = areas.map(area => ({
        area_id:   area.id,
        area_nome: area.nome,
        ordem:     area.ordem,
        itens: area.area_itens
            .filter(ai => ai.itens_verificacao?.ativo)
            .sort((a, b) => a.ordem - b.ordem)
            .map(ai => ({
                area_item_id: ai.id,
                item_id:      ai.item_id,
                descricao:    ai.itens_verificacao.descricao,
                ordem:        ai.ordem,
            }))
    }));

    res.json(checklist);
});

export default router;
