import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Multer — armazena em memória (sem salvar disco)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WEBP.'));
        }
    }
});

// ─────────────────────────────────────────────
// POST /api/ocorrencias/:id/fotos
// Campo do form: "foto" (arquivo) + "slot" (1 ou 2)
// ─────────────────────────────────────────────
router.post('/ocorrencias/:id/fotos', requireAuth, upload.single('foto'), async (req, res) => {
    try {
        const { id } = req.params;
        const slot = parseInt(req.body.slot); // 1 ou 2

        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
        }
        if (![1, 2].includes(slot)) {
            return res.status(400).json({ erro: 'Slot inválido. Use 1 ou 2.' });
        }

        // Busca a ocorrência para verificar se existe
        const { data: ocorrencia, error: erroOc } = await supabase
            .from('ocorrencias')
            .select('id, foto_1_url, foto_2_url')
            .eq('id', id)
            .single();

        if (erroOc || !ocorrencia) {
            return res.status(404).json({ erro: 'Ocorrência não encontrada.' });
        }

        // Remove foto antiga do storage se já existir no slot
        const urlAntiga = slot === 1 ? ocorrencia.foto_1_url : ocorrencia.foto_2_url;
        if (urlAntiga) {
            const pathAntigo = urlAntiga.replace(/^.*\/fotos\//, '');
            await supabase.storage.from('fotos').remove([pathAntigo]);
        }

        // Monta o path: ocorrencias/{id}/foto_{slot}_{timestamp}.ext
        const ext = req.file.mimetype.split('/')[1];
        const timestamp = Date.now();
        const filePath = `ocorrencias/${id}/foto_${slot}_${timestamp}.${ext}`;

        // Upload para o Supabase Storage
        const { error: erroUpload } = await supabase.storage
            .from('fotos')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (erroUpload) throw erroUpload;

        // Salva o path na tabela ocorrencias
        const campo = slot === 1 ? 'foto_1_url' : 'foto_2_url';
        const { data: atualizada, error: erroUpdate } = await supabase
            .from('ocorrencias')
            .update({
                [campo]: filePath,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (erroUpdate) throw erroUpdate;

        // Gera URL assinada para visualização (válida por 1 hora)
        const { data: urlAssinada } = await supabase.storage
            .from('fotos')
            .createSignedUrl(filePath, 3600);

        res.status(201).json({
            mensagem: `Foto ${slot} salva com sucesso!`,
            path: filePath,
            url_visualizacao: urlAssinada?.signedUrl || null,
            ocorrencia: atualizada
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao fazer upload da foto.', detalhe: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/ocorrencias/:id/fotos/:slot
// ─────────────────────────────────────────────
router.delete('/ocorrencias/:id/fotos/:slot', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const slot = parseInt(req.params.slot);

        if (![1, 2].includes(slot)) {
            return res.status(400).json({ erro: 'Slot inválido. Use 1 ou 2.' });
        }

        const { data: ocorrencia, error: erroOc } = await supabase
            .from('ocorrencias')
            .select('id, foto_1_url, foto_2_url')
            .eq('id', id)
            .single();

        if (erroOc || !ocorrencia) {
            return res.status(404).json({ erro: 'Ocorrência não encontrada.' });
        }

        const campo = slot === 1 ? 'foto_1_url' : 'foto_2_url';
        const filePath = ocorrencia[campo];

        if (!filePath) {
            return res.status(404).json({ erro: `Slot ${slot} não possui foto.` });
        }

        // Remove do Storage
        const { error: erroRemove } = await supabase.storage
            .from('fotos')
            .remove([filePath]);

        if (erroRemove) throw erroRemove;

        // Limpa o campo na tabela
        const { data: atualizada, error: erroUpdate } = await supabase
            .from('ocorrencias')
            .update({
                [campo]: null,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (erroUpdate) throw erroUpdate;

        res.json({
            mensagem: `Foto ${slot} removida com sucesso!`,
            ocorrencia: atualizada
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao remover foto.', detalhe: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/ocorrencias/:id/fotos
// Retorna URLs assinadas das fotos
// ─────────────────────────────────────────────
router.get('/ocorrencias/:id/fotos', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: ocorrencia, error } = await supabase
            .from('ocorrencias')
            .select('id, foto_1_url, foto_2_url')
            .eq('id', id)
            .single();

        if (error || !ocorrencia) {
            return res.status(404).json({ erro: 'Ocorrência não encontrada.' });
        }

        const fotos = {};

        if (ocorrencia.foto_1_url) {
            const { data } = await supabase.storage
                .from('fotos')
                .createSignedUrl(ocorrencia.foto_1_url, 3600);
            fotos.foto_1 = { path: ocorrencia.foto_1_url, url: data?.signedUrl || null };
        } else {
            fotos.foto_1 = { path: null, url: null }; // ✅ sempre retorna objeto
        }

        if (ocorrencia.foto_2_url) {
            const { data } = await supabase.storage
                .from('fotos')
                .createSignedUrl(ocorrencia.foto_2_url, 3600);
            fotos.foto_2 = { path: ocorrencia.foto_2_url, url: data?.signedUrl || null };
        } else {
            fotos.foto_2 = { path: null, url: null }; // ✅ sempre retorna objeto
        }

        res.json({ ocorrencia_id: id, fotos });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar fotos.', detalhe: err.message });
    }
});

// ─────────────────────────────────────────────
// Handler de erro do Multer
// ─────────────────────────────────────────────
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            erro: 'Erro no upload',
            detalhe: err.message
        });
    }
    if (err) {
        return res.status(400).json({
            erro: err.message
        });
    }
    next();
});

export default router;
