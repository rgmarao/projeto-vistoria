import express from 'express';
import PDFDocument from 'pdfkit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ── Dimensões e constantes de layout ─────────────────────────────────────────
const PAGE_W    = 595.28;
const PAGE_H    = 841.89;
const M         = 50;          // margem lateral
const HDR_H     = 72;          // altura do cabeçalho repetido
const FTR_H     = 28;          // altura do rodapé repetido
const CONT_X    = M;
const CONT_W    = PAGE_W - M * 2;
const BODY_TOP  = HDR_H + 14;  // top margin do conteúdo
const BODY_BOT  = PAGE_H - FTR_H - 14; // limite inferior do conteúdo

// Colunas da ocorrência
const L_W  = 185;  // largura da coluna de texto
const GAP  = 14;
const R_X  = CONT_X + L_W + GAP;
const R_W  = CONT_W - L_W - GAP;  // largura da coluna de fotos ≈ 246pt

// Cores
const NAVY  = '#1b3a6b';
const BLUE  = '#1565c0';
const RED   = '#c62828';
const MUTED = '#888888';
const SUB   = '#555555';
const TEXT  = '#222222';
const C_OK  = '#388e3c';
const C_AT  = '#f57c00';
const C_CR  = '#d32f2f';

const OC_STATUS_COLOR = { ok: C_OK, atencao: C_AT, critico: C_CR };
const OC_STATUS_LABEL = { ok: 'OK', atencao: 'Atenção', critico: 'Crítico' };
const STATUS_LABEL    = { em_andamento: 'Em andamento', finalizada: 'Finalizada', publicada: 'Publicada' };

// ── Logo VistorIA (fallback) ──────────────────────────────────────────────────
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

function hline(doc, y, color = '#e0e0e0', w = 0.5) {
  doc.save().moveTo(CONT_X, y).lineTo(CONT_X + CONT_W, y)
     .strokeColor(color).lineWidth(w).stroke().restore();
}

// ── Cabeçalho de página ───────────────────────────────────────────────────────
function drawHeader(doc, { logoBuf, empresa, unidade, dataVistoria, analista }) {
  const Y = 16;
  if (logoBuf) {
    try { doc.image(logoBuf, CONT_X, Y, { fit: [110, 38], align: 'left', valign: 'center' }); }
    catch { /* logo inválido */ }
  }

  const tx = CONT_X + 120;
  const tw = CONT_W - 120;
  let ty = Y;

  if (empresa) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY)
       .text(empresa, tx, ty, { width: tw, align: 'right' });
    ty += 12;
  }
  doc.font('Helvetica').fontSize(8.5).fillColor(TEXT)
     .text(unidade, tx, ty, { width: tw, align: 'right' });
  ty += 11;
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
     .text(`Data: ${dataVistoria}`, tx, ty, { width: tw, align: 'right' });
  ty += 10;
  if (analista) {
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
       .text(`Analista: ${analista}`, tx, ty, { width: tw, align: 'right' });
  }
  hline(doc, HDR_H, NAVY, 1);
}

// ── Rodapé de página ──────────────────────────────────────────────────────────
function drawFooter(doc, pageNum, total, subtitle) {
  const y = PAGE_H - FTR_H;
  hline(doc, y, '#cccccc', 0.5);
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
     .text(subtitle, CONT_X, y + 7, { width: CONT_W * 0.65, align: 'left' });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
     .text(`Pág. ${pageNum} de ${total}`, CONT_X, y + 7, { width: CONT_W, align: 'right' });
}

function applyHeaderFooter(doc, headerData, subtitle) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    drawHeader(doc, headerData);
    drawFooter(doc, i + 1, range.count, subtitle);
  }
}

// ── Busca e prepara buffers de fotos ─────────────────────────────────────────
async function prepFotos(ocorrencias) {
  return Promise.all(
    (ocorrencias || []).map(async oc => {
      let foto1buf = null, foto2buf = null;
      if (oc.foto_1_url) {
        const { data: s } = await supabase.storage.from('fotos').createSignedUrl(oc.foto_1_url, 300);
        if (s?.signedUrl) foto1buf = await fetchImageBuffer(s.signedUrl);
      }
      if (oc.foto_2_url) {
        const { data: s } = await supabase.storage.from('fotos').createSignedUrl(oc.foto_2_url, 300);
        if (s?.signedUrl) foto2buf = await fetchImageBuffer(s.signedUrl);
      }
      return { ...oc, foto1buf, foto2buf };
    })
  );
}

// ── Busca estrutura agrupada: areas → itens → ocorrências ────────────────────
async function fetchEstrutura(visId, unidadeId, filtro = null) {
  // Áreas com itens
  const { data: areas } = await supabase
    .from('areas')
    .select('id, nome, ordem, area_itens(id, item_id, ordem, itens_verificacao(id, descricao))')
    .eq('unidade_id', unidadeId)
    .eq('ativo', true)
    .order('ordem');

  // Ocorrências flat
  let query = supabase.from('ocorrencias').select('*').eq('vistoria_id', visId).order('numero_ocorrencia');
  if (filtro) query = query.in('status', filtro);
  const { data: ocs } = await query;

  // Prepara fotos
  const ocsComFotos = await prepFotos(ocs || []);

  // Indexa por area_id + item_id
  const ocMap = {};
  for (const oc of ocsComFotos) {
    const k = `${oc.area_id}_${oc.item_id}`;
    if (!ocMap[k]) ocMap[k] = [];
    ocMap[k].push(oc);
  }

  // Monta estrutura hierárquica
  return (areas || []).map(area => ({
    area_id:   area.id,
    area_nome: area.nome,
    itens: (area.area_itens || [])
      .sort((a, b) => a.ordem - b.ordem)
      .map(ai => ({
        item_id:   ai.item_id,
        descricao: ai.itens_verificacao?.descricao || '',
        ocs:       ocMap[`${area.id}_${ai.item_id}`] || []
      }))
      .filter(item => item.ocs.length > 0)  // só itens com ocorrências
  })).filter(area => area.itens.length > 0); // só áreas com itens
}

// ── Renderiza uma ocorrência: texto esquerda, fotos direita ──────────────────
function renderOc(doc, oc) {
  const color    = OC_STATUS_COLOR[oc.status] || '#aaaaaa';
  const fotos    = [oc.foto1buf, oc.foto2buf].filter(Boolean);
  const FOTO_H   = 160; // altura máxima de cada foto (fit preserva proporção)
  const estimH   = Math.max(
    70 + (oc.recomendacao && ['atencao','critico'].includes(oc.status) ? 50 : 0),
    fotos.length * (FOTO_H + 8)
  );

  if (doc.y + estimH + 20 > BODY_BOT) doc.addPage();

  const startY = doc.y;

  // ── Coluna esquerda ────────────────────────────────────────
  // "OCORRÊNCIA N" com cor do status
  doc.font('Helvetica').fontSize(9).fillColor(color)
     .text(`OCORRÊNCIA ${oc.numero_ocorrencia}`, CONT_X, startY, { width: L_W });

  let ty = startY + 14;

  // Rótulo "Descrição"
  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
     .text('Descrição', CONT_X, ty, { width: L_W });
  ty += 11;

  if (oc.descricao) {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT)
       .text(oc.descricao, CONT_X, ty, { width: L_W });
    ty = doc.y + 6;
  }

  if (oc.recomendacao && ['atencao', 'critico'].includes(oc.status)) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED)
       .text('Recomendações', CONT_X, ty, { width: L_W });
    ty += 11;
    doc.font('Helvetica').fontSize(9).fillColor(TEXT)
       .text(oc.recomendacao, CONT_X, ty, { width: L_W });
    ty = doc.y + 4;
  }

  const leftEnd = ty;

  // ── Coluna direita: fotos ──────────────────────────────────
  // Quadrado colorido de status no canto superior direito
  doc.rect(R_X + R_W - 12, startY + 1, 11, 11).fill(color);

  let photoY = startY;
  for (const buf of fotos) {
    if (photoY + FOTO_H > BODY_BOT) {
      doc.addPage();
      photoY = BODY_TOP;
    }
    try {
      doc.image(buf, R_X, photoY, { fit: [R_W, FOTO_H] });
    } catch { /* foto inválida */ }
    photoY += FOTO_H + 8;
  }

  // Avança cursor para abaixo da coluna mais longa
  const endY = Math.max(leftEnd, photoY) + 10;
  doc.text('', CONT_X, endY);
  hline(doc, doc.y, '#e8eaf0', 0.5);
  doc.moveDown(0.6);
}

// ── Renderiza estrutura completa de áreas → itens → ocorrências ──────────────
function renderEstrutura(doc, estrutura) {
  for (const area of estrutura) {
    // Nova página se espaço insuficiente para cabeçalho de área
    if (doc.y + 60 > BODY_BOT) doc.addPage();

    // ── Cabeçalho de área ──────────────────────────────────────
    hline(doc, doc.y, NAVY, 1.5);
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY)
       .text(area.area_nome.toUpperCase(), CONT_X, doc.y, { width: CONT_W });
    doc.moveDown(0.6);

    for (const item of area.itens) {
      if (doc.y + 40 > BODY_BOT) doc.addPage();

      // ── Item de verificação ────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT)
         .text(item.descricao, CONT_X, doc.y, { width: CONT_W });
      doc.moveDown(0.5);

      for (const oc of item.ocs) renderOc(doc, oc);

      doc.moveDown(0.4);
    }

    doc.moveDown(0.6);
  }
}

// ── Ficha de cabeçalho da vistoria (primeira página) ─────────────────────────
function renderFicha(doc, fields) {
  for (const [label, valor] of fields) {
    if (!valor) continue;
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
       .text(label, CONT_X, y, { width: 160 });
    doc.font('Helvetica').fontSize(9).fillColor(TEXT)
       .text(String(valor), CONT_X + 165, y, { width: CONT_W - 165 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/vistorias/:id/pdf — Relatório Completo
// ─────────────────────────────────────────────────────────────────────────────
router.get('/vistorias/:id/pdf', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: perfil } = await supabase.from('perfis').select('perfil').eq('id', req.user.id).single();
    if (!perfil) return res.status(403).json({ error: 'Perfil não encontrado' });

    const { data, error } = await supabase
      .from('vistorias')
      .select('*, unidades(id, nome, endereco, logo_url, empresas(id, nome)), perfis(id, nome)')
      .eq('id', id).single();

    if (error || !data) return res.status(404).json({ error: 'Vistoria não encontrada' });
    if (perfil.perfil === 'usuario' && data.status !== 'publicada')
      return res.status(403).json({ error: 'Acesso negado' });

    const unidade     = data.unidades;
    const empresa     = unidade?.empresas;
    const analista    = data.perfis;
    const dataVistoria = data.data_criacao ? new Date(data.data_criacao).toLocaleDateString('pt-BR') : '—';

    // Logo
    let logoBuf = vistoriaLogoBuf;
    if (unidade?.logo_url) {
      const { data: s } = await supabase.storage.from('logos').createSignedUrl(unidade.logo_url, 300);
      if (s?.signedUrl) { const b = await fetchImageBuffer(s.signedUrl); if (b) logoBuf = b; }
    }

    const estrutura = await fetchEstrutura(id, unidade.id);
    const totalOcs  = estrutura.reduce((s, a) => s + a.itens.reduce((si, i) => si + i.ocs.length, 0), 0);

    const doc = new PDFDocument({
      size: 'A4', bufferPages: true,
      margins: { top: BODY_TOP, bottom: PAGE_H - BODY_BOT, left: M, right: M }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vistoria-${id.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    // ── Título e ficha ──────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(18).fillColor(NAVY)
       .text('Relatório de Vistoria', { align: 'center' });
    doc.moveDown(0.3);
    hline(doc, doc.y, NAVY, 2);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(14).fillColor(TEXT)
       .text(unidade?.nome || '—', { align: 'center' });
    if (empresa?.nome) {
      doc.font('Helvetica').fontSize(11).fillColor(SUB).text(empresa.nome, { align: 'center' });
    }
    if (unidade?.endereco) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(unidade.endereco, { align: 'center' });
    }
    doc.moveDown(1.2);

    renderFicha(doc, [
      ['Data da vistoria:',     dataVistoria],
      ['Analista responsável:', analista?.nome],
      ['Total de ocorrências:', String(totalOcs)]
    ]);

    doc.moveDown(1);
    hline(doc, doc.y, '#cccccc', 1);
    doc.moveDown(1);

    // ── Corpo: áreas → itens → ocorrências ─────────────────────────────────
    if (estrutura.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor(MUTED).text('Nenhuma ocorrência registrada.');
    } else {
      renderEstrutura(doc, estrutura);
    }

    // ── Cabeçalho + rodapé em todas as páginas ──────────────────────────────
    applyHeaderFooter(doc,
      { logoBuf, empresa: empresa?.nome, unidade: unidade?.nome || '—', dataVistoria, analista: analista?.nome },
      `Relatório de Vistoria · ${new Date().toLocaleDateString('pt-BR')}`
    );

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

    const { data: perfil } = await supabase.from('perfis').select('perfil').eq('id', req.user.id).single();
    if (!perfil) return res.status(403).json({ error: 'Perfil não encontrado' });

    const { data, error } = await supabase
      .from('vistorias')
      .select('*, unidades(id, nome, endereco, logo_url, empresas(id, nome)), perfis(id, nome)')
      .eq('id', id).single();

    if (error || !data) return res.status(404).json({ error: 'Vistoria não encontrada' });
    if (perfil.perfil === 'usuario' && data.status !== 'publicada')
      return res.status(403).json({ error: 'Acesso negado' });

    const unidade      = data.unidades;
    const empresa      = unidade?.empresas;
    const analista     = data.perfis;
    const dataVistoria = data.data_criacao ? new Date(data.data_criacao).toLocaleDateString('pt-BR') : '—';

    let logoBuf = vistoriaLogoBuf;
    if (unidade?.logo_url) {
      const { data: s } = await supabase.storage.from('logos').createSignedUrl(unidade.logo_url, 300);
      if (s?.signedUrl) { const b = await fetchImageBuffer(s.signedUrl); if (b) logoBuf = b; }
    }

    const estrutura = await fetchEstrutura(id, unidade.id, ['atencao', 'critico']);
    const totalPend  = estrutura.reduce((s, a) => s + a.itens.reduce((si, i) => si + i.ocs.length, 0), 0);

    const doc = new PDFDocument({
      size: 'A4', bufferPages: true,
      margins: { top: BODY_TOP, bottom: PAGE_H - BODY_BOT, left: M, right: M }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pendencias-${id.slice(0, 8)}.pdf"`);
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(18).fillColor(RED)
       .text('Relatório de Pendências', { align: 'center' });
    doc.moveDown(0.3);
    hline(doc, doc.y, RED, 2);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(14).fillColor(TEXT)
       .text(unidade?.nome || '—', { align: 'center' });
    if (empresa?.nome) {
      doc.font('Helvetica').fontSize(11).fillColor(SUB).text(empresa.nome, { align: 'center' });
    }
    if (unidade?.endereco) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(unidade.endereco, { align: 'center' });
    }
    doc.moveDown(1.2);

    renderFicha(doc, [
      ['Data da vistoria:',     dataVistoria],
      ['Analista responsável:', analista?.nome],
      ['Total de pendências:',  String(totalPend)]
    ]);

    doc.moveDown(1);
    hline(doc, doc.y, '#cccccc', 1);
    doc.moveDown(1);

    if (estrutura.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor(MUTED)
         .text('Nenhuma pendência encontrada. Vistoria sem itens de atenção ou críticos.');
    } else {
      renderEstrutura(doc, estrutura);
    }

    applyHeaderFooter(doc,
      { logoBuf, empresa: empresa?.nome, unidade: unidade?.nome || '—', dataVistoria, analista: analista?.nome },
      `Relatório de Pendências · ${new Date().toLocaleDateString('pt-BR')}`
    );

    doc.flushPages();
    doc.end();
  } catch (err) {
    console.error('Erro ao gerar PDF de pendências:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao gerar relatório de pendências' });
  }
});

export default router;
