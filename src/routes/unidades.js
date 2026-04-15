import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import { supabase } from '../config/supabase.js';
import { resolveSemaforos } from '../utils/semaforos.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WEBP.'));
        }
    }
});

async function gerarUrlLogo(logoPath) {
    if (!logoPath) return null;
    const { data } = await supabase.storage.from('fotos').createSignedUrl(logoPath, 3600);
    return data?.signedUrl || null;
}

// GET /api/unidades
router.get('/', requireAuth, async (req, res) => {
    try {
        const { empresa_id, ativo } = req.query;
        let query = supabase.from('unidades').select('*, empresas(id, nome)').order('nome');
        if (empresa_id) query = query.eq('empresa_id', empresa_id);
        if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');
        const { data, error } = await query;
        if (error) throw error;
        res.json({ ok: true, data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// GET /api/unidades/:id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('unidades')
            .select('*, empresas(id, nome), areas(id, nome, ordem, ativo)')
            .eq('id', id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ ok: false, error: 'Unidade não encontrada' });
        const logo_url_assinada = await gerarUrlLogo(data.logo_url);
        res.json({ ok: true, data: { ...data, logo_url_assinada } });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// GET /api/unidades/:id/semaforos — Configuração efetiva de semáforos
router.get('/:id/semaforos', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('unidades')
            .select('configuracao_semaforos, empresas(configuracao_semaforos)')
            .eq('id', id)
            .single();
        if (error || !data) return res.status(404).json({ ok: false, error: 'Unidade não encontrada' });
        const semaforos = resolveSemaforos(
            data.empresas?.configuracao_semaforos,
            data.configuracao_semaforos
        );
        res.json({ ok: true, data: semaforos });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// POST /api/unidades
router.post('/', requireAuth, upload.single('logo'), async (req, res) => {
    try {
        const { nome, empresa_id, endereco } = req.body;
        if (!nome)       return res.status(400).json({ ok: false, error: 'Campo "nome" é obrigatório' });
        if (!empresa_id) return res.status(400).json({ ok: false, error: 'Campo "empresa_id" é obrigatório' });

        let configuracao_semaforos = null;
        if (req.body.configuracao_semaforos) {
            try { configuracao_semaforos = JSON.parse(req.body.configuracao_semaforos); } catch { /* ignora JSON inválido */ }
        }

        const { data: novaUnidade, error: erroCriar } = await supabase
            .from('unidades')
            .insert({ nome, empresa_id, endereco: endereco || null, configuracao_semaforos, ativo: true })
            .select().single();
        if (erroCriar) throw erroCriar;

        if (req.file) {
            const ext = req.file.mimetype.split('/')[1];
            const filePath = `unidades/${novaUnidade.id}/logo_${Date.now()}.${ext}`;
            const { error: erroUpload } = await supabase.storage
                .from('fotos').upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
            if (erroUpload) throw erroUpload;
            const { data: atualizada, error: erroUpdate } = await supabase
                .from('unidades').update({ logo_url: filePath, atualizado_em: new Date().toISOString() })
                .eq('id', novaUnidade.id).select().single();
            if (erroUpdate) throw erroUpdate;
            const logo_url_assinada = await gerarUrlLogo(filePath);
            return res.status(201).json({ ok: true, data: { ...atualizada, logo_url_assinada } });
        }
        res.status(201).json({ ok: true, data: novaUnidade });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// PUT /api/unidades/:id
router.put('/:id', requireAuth, upload.single('logo'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, endereco } = req.body;
        const campos = {};
        if (nome     !== undefined) campos.nome     = nome;
        if (endereco !== undefined) campos.endereco = endereco;
        if (req.body.configuracao_semaforos !== undefined) {
            if (req.body.configuracao_semaforos === 'null' || req.body.configuracao_semaforos === '') {
                campos.configuracao_semaforos = null;
            } else {
                try { campos.configuracao_semaforos = JSON.parse(req.body.configuracao_semaforos); } catch { /* ignora */ }
            }
        }
        campos.atualizado_em = new Date().toISOString();

        if (req.file) {
            const { data: unidadeAtual } = await supabase.from('unidades').select('logo_url').eq('id', id).single();
            if (unidadeAtual?.logo_url) await supabase.storage.from('fotos').remove([unidadeAtual.logo_url]);
            const ext = req.file.mimetype.split('/')[1];
            const filePath = `unidades/${id}/logo_${Date.now()}.${ext}`;
            const { error: erroUpload } = await supabase.storage
                .from('fotos').upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
            if (erroUpload) throw erroUpload;
            campos.logo_url = filePath;
        }

        const { data, error } = await supabase.from('unidades').update(campos).eq('id', id).select().single();
        if (error) throw error;
        if (!data) return res.status(404).json({ ok: false, error: 'Unidade não encontrada' });
        const logo_url_assinada = await gerarUrlLogo(data.logo_url);
        res.json({ ok: true, data: { ...data, logo_url_assinada } });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// PATCH /api/unidades/:id/desativar
router.patch('/:id/desativar', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('unidades')
            .update({ ativo: false, atualizado_em: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        if (!data) return res.status(404).json({ ok: false, error: 'Unidade não encontrada' });
        res.json({ ok: true, data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// PATCH /api/unidades/:id/ativar
router.patch('/:id/ativar', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('unidades')
            .update({ ativo: true, atualizado_em: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        if (!data) return res.status(404).json({ ok: false, error: 'Unidade não encontrada' });
        res.json({ ok: true, data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// DELETE /api/unidades/:id/logo
router.delete('/:id/logo', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: unidade, error: erroGet } = await supabase.from('unidades').select('id, logo_url').eq('id', id).single();
        if (erroGet || !unidade) return res.status(404).json({ ok: false, error: 'Unidade não encontrada' });
        if (!unidade.logo_url)   return res.status(404).json({ ok: false, error: 'Esta unidade não possui logo' });
        const { error: erroRemove } = await supabase.storage.from('fotos').remove([unidade.logo_url]);
        if (erroRemove) throw erroRemove;
        const { data, error } = await supabase.from('unidades')
            .update({ logo_url: null, atualizado_em: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        res.json({ ok: true, mensagem: 'Logo removido com sucesso', data });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ ok: false, error: 'Erro no upload: ' + err.message });
    if (err) return res.status(400).json({ ok: false, error: err.message });
    next();
});

export default router;
