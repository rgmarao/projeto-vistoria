import express from 'express';
import PDFDocument from 'pdfkit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ── Constantes de layout ──────────────────────────────────────────────────────
const PAGE_W     = 595.28;
const MARGIN_H   = 50;       // margens laterais
const HDR_H      = 75;       // altura reservada para o cabeçalho
const FTR_H      = 30;       // altura reservada para o rodapé
const CONTENT_X  = MARGIN_H;
const CONTENT_W  = PAGE_W - MARGIN_H * 2;

const BRAND_NAVY  = '#1b3a6b';
const BRAND_BLUE  = '#1565c0';
const COLOR_RED   = '#c62828';
const COLOR_OK    = '#388e3c';
const COLOR_WARN  = '#f57c00';
const COLOR_CRIT  = '#d32f2f';
const COLOR_MUTED = '#888888';
const COLOR_TEXT  = '#222222';
const COLOR_SUB   = '#555555';

const STATUS_LABEL    = { em_andamento: 'Em andamento', finalizada: 'Finalizada', publicada: 'Publicada' };
const OC_STATUS_LABEL = { ok: 'OK', atencao: 'Atenção', critico: 'Crítico' };
const OC_STATUS_COLOR = { ok: COLOR_OK, atencao: COLOR_WARN, critico: COLOR_CRIT };

// ── Logo do VistorIA (fallback) ───────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
let vistoriaLogoBuf;
try { vistoriaLogoBuf = readFileSync(join(__dirname, '../../public/img/logo-vistoria.png')); }
catch { vistoriaLogoBuf = null; }

// ── Utilitários ───────────────────────────────────────────────────────────────
async function fetchImageBuffer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch { return null; }
}

function drawHLine(doc, y, color = '#e0e0e0', width = 0.5) {
  doc.save()
     .moveTo(CONTENT_X, y).lineTo(CONTENT_X + CONTENT_W, y)
     .strokeColor(color).lineWidth(width).stroke()
     .restore();
}

// ── Cabeçalho de página ───────────────────────────────────────────────────────
// Chamado para cada página após todo o conteúdo ser gerado (bufferPages: true)
function drawPageHeader(doc, logoBuf, empresa, unidade, dataVistoria, analista) {
  const Y_TOP  = 18;
  const LOGO_H = 36;
  const LOGO_W = 120;

  // Logo à esquerda
  if (logoBuf) {
    try {
      doc.image(logoBuf, CONTENT_X, Y_TOP, { fit: [LOGO_W, LOGO_H], align: 'left', valign: 'center' });
    } catch { /* logo inválido — silencia */ }
  }

  // Bloco de texto à direita
  const textX = CONTENT_X + LOGO_W + 16;
  const textW = CONTENT_W - LOGO_W - 16;
  let ty = Y_TOP;

  if (empresa) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND_NAVY)
       .text(empresa, textX, ty, { width: textW, align: 'right' });
    ty += 13;
  }

  doc.font('Helvetica').fontSize(8.5).fillColor(COLOR_TEXT)
     .text(unidade, textX, ty, { width: textW, align: 'right' });
  ty += 12;

  doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED)
     .text(`Data: ${dataVistoria}`, textX, ty, { width: textW, align: 'right' });
  ty += 10;

  if (analista) {
    doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED)
       .text(`Analista: ${analista}`, textX, ty, { width: textW, align: 'right' });
  }

  // Linha separadora abaixo do cabeçalho
  drawHLine(doc, HDR_H, BRAND_NAVY, 1);
}

// ── Rodapé de página ──────────────────────────────────────────────────────────
function drawPageFooter(doc, pageNum, totalPages, reportTitle) {
  const PAGE_H  = 841.89;
  const lineY   = PAGE_H - FTR_H;
  const textY   = lineY + 8;

  drawHLine(doc, lineY, '#cccccc', 0.5);

  doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED)
     .text(reportTitle, CONTENT_X, textY, { width: CONTENT_W * 0.6, align: 'left' });

  doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED)
     .text(`Página ${pageNum} de ${totalPages}`, CONTENT_X, textY, { width: CONTENT_W, align: 'right' });
}

// ── Aplica cabeçalho + rodapé em todas as páginas ─────────────────────────────
function applyHeaderFooter(doc, headerData, reportTitle) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    drawPageHeader(doc,
      headerData.logoBuf,
      headerData.empresa,
      headerData.unidade,
      headerData.dataVistoria,
      headerData.analista
    );
    drawPageFooter(doc, i + 1, range.count, reportTitle);
  }
}

// ── Bloco de ocorrência ───────────────────────────────────────────────────────
function renderOcorrencia(doc, oc, editavel = false) {
  // Verifica espaço
  const estimativa = (oc.foto1buf || oc.foto2buf) ? 220 : 80;
  if (doc.y + estimativa > 841.89 - FTR_H - 20) doc.addPage();

  const color = OC_STATUS_COLOR[oc.status] || COLOR_SUB;
  const label = OC_STATUS_LABEL[oc.status] || oc.status || 'Sem status';

  // Linha de status + número
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_MUTED)
     .text(`Ocorrência ${oc.numero_ocorrencia}`, CONTENT_X, doc.y, { continued: true })
     .font('Helvetica-Bold').fontSize(9).fillColor(color)
     .text(`   ${label}`, { align: 'left' });

  // Descrição
  if (oc.descricao) {
    doc.font('Helvetica').fontSize(10).fillColor(COLOR_TEXT)
       .text(oc.descricao, CONTENT_X, doc.y + 3, { width: CONTENT_W });
  }

  // Recomendação
  if (oc.recomendacao) {
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_MUTED)
       .text('RECOMENDAÇÕES', CONTENT_X, doc.y);
    doc.font('Helvetica').fontSize(9.5).fillColor(COLOR_SUB)
       .text(oc.recomendacao, CONTENT_X, doc.y + 2, { width: CONTENT_W });
  }

  // Fotos
  if (oc.foto1buf || oc.foto2buf) {
    const fW = 220, fH = 150;
    if (doc.y + fH + 20 > 841.89 - FTR_H - 10) doc.addPage();
    const fy = doc.y + 8;

    if (oc.foto1buf) {
      try { doc.image(oc.foto1buf, CONTENT_X, fy, { width: fW, height: fH }); } catch { /* ignore */ }
    }
    if (oc.foto2buf) {
      try { doc.image(oc.foto2buf, CONTENT_X + fW + 14, fy, { width: fW, height: fH }); } catch { /* ignore */ }
    }
    doc.text('', CONTENT_X, fy + fH + 10);
  }

  doc.moveDown(0.4);
  drawHLine(doc, doc.y, '#eeeeee', 0.5);
  doc.moveDown(0.6);
}

// ── Busca e prepara ocorrências (URLs assinadas + buffers) ────────────────────
async function prepararOcorrencias(ocorrencias) {
  return Promise.all(
    (ocorrencias || [])
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
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vistorias/:id/pdf — Relatório Completo
// ─────────────────────────────────────────────────────────────────────────────
router.get('/vistorias/:id/pdf', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: perfil, error: perfilError } = await supabase
      .from('perfis').select('perfil').eq('id', req.user.id).single();
    if (perfilError || !perfil) return res.status(403).json({ error: 'Perfil não encontrado' });

    const { data, error } = await supabase
      .from('vistorias')
      .select(`
        *,
        unidades (id, nome, endereco, logo_url, empresas(id, nome)),
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

    const unidade     = data.unidades;
    const empresa     = unidade?.empresas;
    const analista    = data.perfis;
    const dataCriacao = data.data_criacao    ? new Date(data.data_criacao).toLocaleDateString('pt-BR')    : '—';
    const dataFinaliz = data.data_finalizacao ? new Date(data.data_finalizacao).toLocaleDateString('pt-BR') : null;
    const dataPublic  = data.data_publicacao  ? new Date(data.data_publicacao).toLocaleDateString('pt-BR')  : null;

    // Logo da unidade (ou fallback VistorIA)
    let logoBuf = vistoriaLogoBuf;
    if (unidade?.logo_url) {
      const { data: signed } = await supabase.storage.from('logos').createSignedUrl(unidade.logo_url, 300);
      if (signed?.signedUrl) {
        const buf = await fetchImageBuffer(signed.signedUrl);
        if (buf) logoBuf = buf;
      }
    }

    const ocorrencias = await prepararOcorrencias(data.ocorrencias);

    // ── Monta o PDF ─────────────────────────────────────────────────────────
    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: { top: HDR_H + 12, bottom: FTR_H + 15, left: MARGIN_H, right: MARGIN_H }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vistoria-${id.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    // ── Capa / ficha da vistoria ─────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(18).fillColor(BRAND_NAVY)
       .text('Relatório de Vistoria', { align: 'center' });
    doc.moveDown(0.3);
    drawHLine(doc, doc.y, BRAND_NAVY, 2);
    doc.moveDown(0.8);

    // Nome da unidade + empresa
    doc.font('Helvetica-Bold').fontSize(15).fillColor(COLOR_TEXT)
       .text(unidade?.nome || '—', { align: 'center' });
    if (empresa?.nome) {
      doc.font('Helvetica').fontSize(11).fillColor(COLOR_SUB)
         .text(empresa.nome, { align: 'center' });
    }
    if (unidade?.endereco) {
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED)
         .text(unidade.endereco, { align: 'center' });
    }
    doc.moveDown(1.2);

    // Ficha
    const campo = (label, valor) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_MUTED)
         .text(label, CONTENT_X, doc.y, { width: 150, continued: false });
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_TEXT)
         .text(valor, CONTENT_X + 155, doc.y - doc.currentLineHeight(), { width: CONTENT_W - 155 });
    };
    campo('Data de criação:',     dataCriacao);
    if (dataFinaliz) campo('Data de finalização:', dataFinaliz);
    if (dataPublic)  campo('Data de publicação:',  dataPublic);
    campo('Status:',               STATUS_LABEL[data.status] || data.status);
    campo('Analista responsável:', analista?.nome || '—');
    campo('Total de ocorrências:', String(ocorrencias.length));

    doc.moveDown(1);
    drawHLine(doc, doc.y, '#cccccc', 1);
    doc.moveDown(1);

    // ── Lista de ocorrências ─────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(12).fillColor(BRAND_BLUE)
       .text('Ocorrências', CONTENT_X, doc.y);
    doc.moveDown(0.6);

    if (ocorrencias.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor(COLOR_MUTED)
         .text('Nenhuma ocorrência registrada.');
    } else {
      for (const oc of ocorrencias) renderOcorrencia(doc, oc);
    }

    // ── Aplica cabeçalho e rodapé em todas as páginas ────────────────────────
    applyHeaderFooter(doc, {
      logoBuf,
      empresa:     empresa?.nome || '',
      unidade:     unidade?.nome || '—',
      dataVistoria: dataCriacao,
      analista:    analista?.nome || '—'
    }, `Relatório de Vistoria · Gerado em ${new Date().toLocaleDateString('pt-BR')}`);

    doc.flushPages();
    doc.end();

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao gerar relatório PDF' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vistorias/:id/pdf/pendencias — Relatório de Pendências
// ─────────────────────────────────────────────────────────────────────────────
router.get('/vistorias/:id/pdf/pendencias', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: perfil, error: perfilError } = await supabase
      .from('perfis').select('perfil').eq('id', req.user.id).single();
    if (perfilError || !perfil) return res.status(403).json({ error: 'Perfil não encontrado' });

    const { data, error } = await supabase
      .from('vistorias')
      .select(`
        *,
        unidades (id, nome, endereco, logo_url, empresas(id, nome)),
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

    const unidade     = data.unidades;
    const empresa     = unidade?.empresas;
    const analista    = data.perfis;
    const dataCriacao = data.data_criacao ? new Date(data.data_criacao).toLocaleDateString('pt-BR') : '—';

    // Logo
    let logoBuf = vistoriaLogoBuf;
    if (unidade?.logo_url) {
      const { data: signed } = await supabase.storage.from('logos').createSignedUrl(unidade.logo_url, 300);
      if (signed?.signedUrl) {
        const buf = await fetchImageBuffer(signed.signedUrl);
        if (buf) logoBuf = buf;
      }
    }

    const pendencias = await prepararOcorrencias(
      (data.ocorrencias || []).filter(oc => ['atencao', 'critico'].includes(oc.status))
    );

    // ── Monta o PDF ─────────────────────────────────────────────────────────
    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: { top: HDR_H + 12, bottom: FTR_H + 15, left: MARGIN_H, right: MARGIN_H }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pendencias-${id.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    // ── Capa ─────────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(18).fillColor(COLOR_RED)
       .text('Relatório de Pendências', { align: 'center' });
    doc.moveDown(0.3);
    drawHLine(doc, doc.y, COLOR_RED, 2);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(15).fillColor(COLOR_TEXT)
       .text(unidade?.nome || '—', { align: 'center' });
    if (empresa?.nome) {
      doc.font('Helvetica').fontSize(11).fillColor(COLOR_SUB)
         .text(empresa.nome, { align: 'center' });
    }
    if (unidade?.endereco) {
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED)
         .text(unidade.endereco, { align: 'center' });
    }
    doc.moveDown(1.2);

    const campo = (label, valor) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_MUTED)
         .text(label, CONTENT_X, doc.y, { width: 150 });
      doc.font('Helvetica').fontSize(9).fillColor(COLOR_TEXT)
         .text(valor, CONTENT_X + 155, doc.y - doc.currentLineHeight(), { width: CONTENT_W - 155 });
    };
    campo('Data da vistoria:',     dataCriacao);
    campo('Status:',               STATUS_LABEL[data.status] || data.status);
    campo('Analista responsável:', analista?.nome || '—');
    campo('Total de pendências:',  String(pendencias.length));

    doc.moveDown(1);
    drawHLine(doc, doc.y, '#cccccc', 1);
    doc.moveDown(1);

    // ── Pendências ───────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR_RED)
       .text('Itens com Pendências', CONTENT_X, doc.y);
    doc.moveDown(0.6);

    if (pendencias.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor(COLOR_MUTED)
         .text('Nenhuma pendência encontrada. Vistoria sem itens de atenção ou críticos.');
    } else {
      for (const oc of pendencias) renderOcorrencia(doc, oc);
    }

    // ── Aplica cabeçalho e rodapé ────────────────────────────────────────────
    applyHeaderFooter(doc, {
      logoBuf,
      empresa:     empresa?.nome || '',
      unidade:     unidade?.nome || '—',
      dataVistoria: dataCriacao,
      analista:    analista?.nome || '—'
    }, `Relatório de Pendências · Gerado em ${new Date().toLocaleDateString('pt-BR')}`);

    doc.flushPages();
    doc.end();

  } catch (err) {
    console.error('Erro ao gerar PDF de pendências:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao gerar relatório de pendências' });
  }
});

export default router;
