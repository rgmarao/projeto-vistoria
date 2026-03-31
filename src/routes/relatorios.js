import express from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

const STATUS_LABEL = {
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada',
  publicada: 'Publicada'
};

const OC_STATUS_LABEL = { ok: 'OK', atencao: 'Atenção', critico: 'Crítico' };
const OC_STATUS_COLOR = { ok: '#388e3c', atencao: '#f57c00', critico: '#d32f2f' };

async function fetchImageBuffer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
// GET /api/vistorias/:id/pdf
// Gera e retorna o relatório PDF da vistoria
// Perfil: admin | analista | usuario (só publicadas)
// ─────────────────────────────────────────
router.get('/vistorias/:id/pdf', requireAuth, async (req, res) => {
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
        unidades (id, nome, endereco, empresas(id, nome)),
        perfis (id, nome),
        ocorrencias (
          id,
          numero_ocorrencia,
          descricao,
          status,
          recomendacao,
          foto_1_url,
          foto_2_url,
          origem,
          criado_em
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

    // Gera URLs assinadas e faz download dos buffers das fotos
    const ocorrencias = await Promise.all(
      (data.ocorrencias || [])
        .sort((a, b) => a.numero_ocorrencia - b.numero_ocorrencia)
        .map(async (oc) => {
          let foto1buf = null;
          let foto2buf = null;

          if (oc.foto_1_url) {
            const { data: s1 } = await supabase.storage
              .from('fotos')
              .createSignedUrl(oc.foto_1_url, 300);
            if (s1?.signedUrl) foto1buf = await fetchImageBuffer(s1.signedUrl);
          }
          if (oc.foto_2_url) {
            const { data: s2 } = await supabase.storage
              .from('fotos')
              .createSignedUrl(oc.foto_2_url, 300);
            if (s2?.signedUrl) foto2buf = await fetchImageBuffer(s2.signedUrl);
          }

          return { ...oc, foto1buf, foto2buf };
        })
    );

    const unidade        = data.unidades;
    const empresa        = unidade?.empresas;
    const analista       = data.perfis;
    const dataCriacao    = data.data_criacao    ? new Date(data.data_criacao).toLocaleDateString('pt-BR')    : '—';
    const dataFinaliz    = data.data_finalizacao ? new Date(data.data_finalizacao).toLocaleDateString('pt-BR') : null;
    const dataPublic     = data.data_publicacao  ? new Date(data.data_publicacao).toLocaleDateString('pt-BR')  : null;

    // ── Monta o PDF ──────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vistoria-${id.slice(0, 8)}.pdf"`
    );
    doc.pipe(res);

    // ── Cabeçalho ────────────────────────────────────────────────────────────
    doc.fontSize(18).fillColor('#1565c0')
       .text('Relatório de Vistoria', { align: 'center' });
    doc.moveDown(0.4);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1565c0').lineWidth(2).stroke();
    doc.moveDown(0.6);

    doc.fontSize(14).fillColor('#222')
       .text(unidade?.nome || '—', { align: 'center' });
    if (empresa?.nome) {
      doc.fontSize(11).fillColor('#555')
         .text(empresa.nome, { align: 'center' });
    }
    if (unidade?.endereco) {
      doc.fontSize(10).fillColor('#888')
         .text(unidade.endereco, { align: 'center' });
    }
    doc.moveDown(1);

    // ── Ficha da vistoria ────────────────────────────────────────────────────
    const campo = (label, valor) => {
      doc.fontSize(10)
         .fillColor('#555').text(label, { continued: true })
         .fillColor('#222').text(`  ${valor}`);
    };
    campo('Data de criação:', dataCriacao);
    if (dataFinaliz) campo('Data de finalização:', dataFinaliz);
    if (dataPublic)  campo('Data de publicação:',  dataPublic);
    campo('Status:',               STATUS_LABEL[data.status] || data.status);
    campo('Analista responsável:', analista?.nome || '—');
    campo('Total de ocorrências:', String(ocorrencias.length));

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').lineWidth(1).stroke();
    doc.moveDown(0.8);

    // ── Ocorrências ──────────────────────────────────────────────────────────
    doc.fontSize(13).fillColor('#1565c0').text('Ocorrências');
    doc.moveDown(0.5);

    if (ocorrencias.length === 0) {
      doc.fontSize(11).fillColor('#aaa').text('Nenhuma ocorrência registrada.');
    } else {
      for (const oc of ocorrencias) {
        // Nova página se estiver perto do fim
        if (doc.y > 690) doc.addPage();

        const color = OC_STATUS_COLOR[oc.status] || '#444';

        doc.fontSize(11).fillColor(color)
           .text(`#${oc.numero_ocorrencia}  ${OC_STATUS_LABEL[oc.status] || oc.status}`);
        doc.fontSize(11).fillColor('#222').text(oc.descricao);

        if (oc.recomendacao) {
          doc.fontSize(10).fillColor('#555')
             .text(`Recomendação: ${oc.recomendacao}`);
        }

        const origemData = [
          `Origem: ${oc.origem}`,
          oc.criado_em ? new Date(oc.criado_em).toLocaleDateString('pt-BR') : null
        ].filter(Boolean).join('  ·  ');
        doc.fontSize(9).fillColor('#aaa').text(origemData);

        // Fotos lado a lado
        const temFotos = oc.foto1buf || oc.foto2buf;
        if (temFotos) {
          const fW = 220, fH = 155;
          if (doc.y + fH + 20 > 750) doc.addPage();

          const fy = doc.y + 8;

          if (oc.foto1buf) {
            try { doc.image(oc.foto1buf, 50, fy, { width: fW, height: fH }); } catch { /* imagem inválida */ }
          }
          if (oc.foto2buf) {
            try { doc.image(oc.foto2buf, 50 + fW + 16, fy, { width: fW, height: fH }); } catch { /* imagem inválida */ }
          }

          // Avança y manualmente após imagens (PDFKit não avança com coordenadas explícitas)
          doc.text('', 50, fy + fH + 10);
        }

        doc.moveDown(0.4);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eee').lineWidth(0.5).stroke();
        doc.moveDown(0.6);
      }
    }

    // ── Rodapé ───────────────────────────────────────────────────────────────
    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#bbb')
       .text(
         `Gerado em ${new Date().toLocaleString('pt-BR')} · Sistema de Vistoria Online`,
         { align: 'center' }
       );

    doc.end();

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar relatório PDF' });
    }
  }
});

// ─────────────────────────────────────────
// GET /api/vistorias/:id/pdf/pendencias
// Relatório de Pendências — só ocorrências atencao + critico
// ─────────────────────────────────────────
router.get('/vistorias/:id/pdf/pendencias', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: perfil, error: perfilError } = await supabase
      .from('perfis').select('perfil').eq('id', req.user.id).single();
    if (perfilError || !perfil) {
      return res.status(403).json({ error: 'Perfil de usuário não encontrado' });
    }

    const { data, error } = await supabase
      .from('vistorias')
      .select(`
        *,
        unidades (id, nome, endereco, empresas(id, nome)),
        perfis (id, nome),
        ocorrencias (
          id, numero_ocorrencia, descricao, status, recomendacao,
          foto_1_url, foto_2_url, origem, criado_em
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Vistoria não encontrada' });
    if (perfil.perfil === 'usuario' && data.status !== 'publicada') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Filtra só pendências (atencao + critico)
    const pendencias = await Promise.all(
      (data.ocorrencias || [])
        .filter(oc => ['atencao', 'critico'].includes(oc.status))
        .sort((a, b) => a.numero_ocorrencia - b.numero_ocorrencia)
        .map(async (oc) => {
          let foto1buf = null;
          let foto2buf = null;
          if (oc.foto_1_url) {
            const { data: s1 } = await supabase.storage.from('fotos').createSignedUrl(oc.foto_1_url, 300);
            if (s1?.signedUrl) foto1buf = await fetchImageBuffer(s1.signedUrl);
          }
          if (oc.foto_2_url) {
            const { data: s2 } = await supabase.storage.from('fotos').createSignedUrl(oc.foto_2_url, 300);
            if (s2?.signedUrl) foto2buf = await fetchImageBuffer(s2.signedUrl);
          }
          return { ...oc, foto1buf, foto2buf };
        })
    );

    const unidade     = data.unidades;
    const empresa     = unidade?.empresas;
    const analista    = data.perfis;
    const dataCriacao = data.data_criacao ? new Date(data.data_criacao).toLocaleDateString('pt-BR') : '—';

    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pendencias-${id.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    // ── Cabeçalho ────────────────────────────────────────────────
    doc.fontSize(18).fillColor('#c62828').text('Relatório de Pendências', { align: 'center' });
    doc.moveDown(0.4);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#c62828').lineWidth(2).stroke();
    doc.moveDown(0.6);

    doc.fontSize(14).fillColor('#222').text(unidade?.nome || '—', { align: 'center' });
    if (empresa?.nome) doc.fontSize(11).fillColor('#555').text(empresa.nome, { align: 'center' });
    if (unidade?.endereco) doc.fontSize(10).fillColor('#888').text(unidade.endereco, { align: 'center' });
    doc.moveDown(1);

    const campo = (label, valor) => {
      doc.fontSize(10).fillColor('#555').text(label, { continued: true }).fillColor('#222').text(`  ${valor}`);
    };
    campo('Data de criação:', dataCriacao);
    campo('Status da vistoria:', STATUS_LABEL[data.status] || data.status);
    campo('Analista responsável:', analista?.nome || '—');
    campo('Total de pendências:', String(pendencias.length));

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').lineWidth(1).stroke();
    doc.moveDown(0.8);

    // ── Pendências ───────────────────────────────────────────────
    doc.fontSize(13).fillColor('#c62828').text('Pendências');
    doc.moveDown(0.5);

    if (pendencias.length === 0) {
      doc.fontSize(11).fillColor('#aaa').text('Nenhuma pendência encontrada. Vistoria sem itens de atenção ou críticos.');
    } else {
      for (const oc of pendencias) {
        if (doc.y > 690) doc.addPage();

        const color = OC_STATUS_COLOR[oc.status] || '#444';
        doc.fontSize(11).fillColor(color)
           .text(`#${oc.numero_ocorrencia}  ${OC_STATUS_LABEL[oc.status] || oc.status}`);
        doc.fontSize(11).fillColor('#222').text(oc.descricao);
        if (oc.recomendacao) {
          doc.fontSize(10).fillColor('#555').text(`Recomendação: ${oc.recomendacao}`);
        }
        const origemData = [`Origem: ${oc.origem}`, oc.criado_em ? new Date(oc.criado_em).toLocaleDateString('pt-BR') : null]
          .filter(Boolean).join('  ·  ');
        doc.fontSize(9).fillColor('#aaa').text(origemData);

        const temFotos = oc.foto1buf || oc.foto2buf;
        if (temFotos) {
          const fW = 220, fH = 155;
          if (doc.y + fH + 20 > 750) doc.addPage();
          const fy = doc.y + 8;
          if (oc.foto1buf) { try { doc.image(oc.foto1buf, 50, fy, { width: fW, height: fH }); } catch { /* ignore */ } }
          if (oc.foto2buf) { try { doc.image(oc.foto2buf, 50 + fW + 16, fy, { width: fW, height: fH }); } catch { /* ignore */ } }
          doc.text('', 50, fy + fH + 10);
        }

        doc.moveDown(0.4);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eee').lineWidth(0.5).stroke();
        doc.moveDown(0.6);
      }
    }

    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#bbb')
       .text(`Gerado em ${new Date().toLocaleString('pt-BR')} · Sistema de Vistoria Online`, { align: 'center' });

    doc.end();

  } catch (err) {
    console.error('Erro ao gerar PDF de pendências:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao gerar relatório de pendências' });
  }
});

export default router;
