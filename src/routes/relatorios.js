import express from 'express';
import PDFDocument from 'pdfkit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// ── Dimensões de página (A4 em pontos) ───────────────────────────────────────
const PAGE_W   = 595.28;
const PAGE_H   = 841.89;
const M        = 45;           // margens laterais
const HDR_H    = 75;           // altura reservada para cabeçalho
const FTR_H    = 30;           // altura reservada para rodapé
const CONT_X   = M;
const CONT_W   = PAGE_W - M * 2;
const BODY_TOP = HDR_H + 12;
const BODY_BOT = PAGE_H - FTR_H - 10;

// Colunas para o bloco de ocorrência
const PHOTO_W  = 113;          // ≈ 4 cm por foto
const PHOTO_GAP = 7;           // gap entre as duas fotos
const TXT_GAP  = 12;           // gap entre texto e fotos
const TXT_W    = CONT_W - PHOTO_W * 2 - PHOTO_GAP - TXT_GAP;  // ≈ 249 pt
const P1_X     = CONT_X + TXT_W + TXT_GAP;
const P2_X     = P1_X + PHOTO_W + PHOTO_GAP;
const PHOTO_H  = 150;          // altura máxima de cada foto (fit preserva proporção)
const STRIP_H  = 16;           // altura da tarja de ocorrência

// Cores
const NAVY    = '#1b3a6b';
const BLUE    = '#1565c0';
const RED     = '#c62828';
const TEXT    = '#1a1a1a';
const MUTED   = '#666666';
const C_OK    = '#388e3c';
const C_AT    = '#e65100';
const C_CR    = '#c62828';
const BG_OK   = '#e8f5e9';
const BG_AT   = '#fff3e0';
const BG_CR   = '#ffebee';

const OC_STATUS_COLOR  = { ok: C_OK,  atencao: C_AT,  critico: C_CR  };
const OC_STRIP_BG      = { ok: BG_OK, atencao: BG_AT, critico: BG_CR };
const OC_STATUS_SUFFIX = { ok: '', atencao: ' - ATENÇÃO', critico: ' - CRÍTICO' };
const STATUS_LABEL     = { em_andamento: 'Em andamento', finalizada: 'Finalizada', publicada: 'Publicada' };

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

function hline(doc, y, color = '#cccccc', w = 0.75) {
  doc.save()
     .moveTo(CONT_X, y).lineTo(CONT_X + CONT_W, y)
     .strokeColor(color).lineWidth(w).stroke()
     .restore();
}

// ── Cabeçalho de página ───────────────────────────────────────────────────────
function drawHeader(doc, { logoBuf, empresa, unidade, dataVistoria, analista }) {
  const LOGO_Y = 14;
  const LOGO_H = 42;
  const LOGO_W = 120;

  if (logoBuf) {
    try { doc.image(logoBuf, CONT_X, LOGO_Y, { fit: [LOGO_W, LOGO_H], align: 'left', valign: 'center' }); }
    catch { /* logo inválido */ }
  }

  // Bloco de texto à direita — tudo em TEXT (preto), espaçamento generoso
  const tx = CONT_X + LOGO_W + 10;
  const tw = CONT_W - LOGO_W - 10;

  // Empresa: bold, navy
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(NAVY)
     .text(empresa || '', tx, LOGO_Y, { width: tw, align: 'right' });

  // Unidade, data, analista: regular, preto, 1.5× espaçamento
  const lineH = 13;
  doc.font('Helvetica').fontSize(8.5).fillColor(TEXT)
     .text(unidade, tx, LOGO_Y + 14, { width: tw, align: 'right' });
  doc.font('Helvetica').fontSize(8.5).fillColor(TEXT)
     .text(`Data: ${dataVistoria}`, tx, LOGO_Y + 14 + lineH, { width: tw, align: 'right' });
  if (analista) {
    doc.font('Helvetica').fontSize(8.5).fillColor(TEXT)
       .text(`Analista: ${analista}`, tx, LOGO_Y + 14 + lineH * 2, { width: tw, align: 'right' });
  }

  hline(doc, HDR_H, NAVY, 1.2);
}

// ── Rodapé de página ──────────────────────────────────────────────────────────
function drawFooter(doc) {
  const y = PAGE_H - FTR_H;
  hline(doc, y, NAVY, 1.2);
}

function applyHeaderFooter(doc, headerData) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    drawHeader(doc, headerData);
    drawFooter(doc);
  }
}

// ── Busca fotos ───────────────────────────────────────────────────────────────
async function prepFotos(ocorrencias) {
  return Promise.all((ocorrencias || []).map(async oc => {
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
  }));
}

// ── Busca estrutura agrupada ──────────────────────────────────────────────────
async function fetchEstrutura(visId, unidadeId, filtro = null) {
  const { data: areas } = await supabase
    .from('areas')
    .select('id, nome, ordem, area_itens(id, item_id, ordem, itens_verificacao(id, descricao))')
    .eq('unidade_id', unidadeId).eq('ativo', true).order('ordem');

  let q = supabase.from('ocorrencias').select('*').eq('vistoria_id', visId).order('numero_ocorrencia');
  if (filtro) q = q.in('status', filtro);
  const { data: ocs } = await q;

  const ocsComFotos = await prepFotos(ocs || []);

  const ocMap = {};
  for (const oc of ocsComFotos) {
    const k = `${oc.area_id}_${oc.item_id}`;
    if (!ocMap[k]) ocMap[k] = [];
    ocMap[k].push(oc);
  }

  return (areas || []).map(area => ({
    area_id:    area.id,
    area_nome:  area.nome,
    area_ordem: area.ordem,
    itens: (area.area_itens || [])
      .sort((a, b) => a.ordem - b.ordem)
      .map(ai => ({
        item_id:   ai.item_id,
        descricao: ai.itens_verificacao?.descricao || '',
        ocs:       ocMap[`${area.id}_${ai.item_id}`] || []
      }))
      .filter(item => item.ocs.length > 0)
  })).filter(area => area.itens.length > 0);
}

// ── Renderiza uma ocorrência ──────────────────────────────────────────────────
function renderOc(doc, oc) {
  const color    = OC_STATUS_COLOR[oc.status] || MUTED;
  const stripBg  = OC_STRIP_BG[oc.status]    || '#f5f5f5';
  const suffix   = OC_STATUS_SUFFIX[oc.status] ?? '';
  const ocLabel  = `OCORRÊNCIA ${oc.numero_ocorrencia}${suffix}`;
  const hasRec   = oc.recomendacao && ['atencao', 'critico'].includes(oc.status);

  // Estima altura mínima: tarja + algum texto + foto
  const minH = STRIP_H + PHOTO_H + 30;
  if (doc.y + minH > BODY_BOT) doc.addPage();

  // ── Tarja colorida (largura total) ────────────────────────────────────────
  const stripY = doc.y;
  doc.rect(CONT_X, stripY, CONT_W, STRIP_H).fill(stripBg);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(color)
     .text(ocLabel, CONT_X + 6, stripY + (STRIP_H - 8.5) / 2, { width: CONT_W - 12 });

  const contentY = stripY + STRIP_H + 8;

  // ── Coluna de texto (esquerda) ────────────────────────────────────────────
  // Rótulo "Descrição"
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED)
     .text('Descrição', CONT_X, contentY, { width: TXT_W });
  let ty = contentY + 12; // pequeno espaçamento abaixo do rótulo

  if (oc.descricao) {
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT)
       .text(oc.descricao, CONT_X, ty, { width: TXT_W, lineGap: 2 });
    ty = doc.y;
  }

  if (hasRec) {
    ty += 8; // espaço entre descrição e rótulo recomendações
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED)
       .text('Recomendações', CONT_X, ty, { width: TXT_W });
    ty += 12; // pequeno espaçamento abaixo do rótulo
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT)
       .text(oc.recomendacao, CONT_X, ty, { width: TXT_W, lineGap: 2 });
    ty = doc.y;
  }

  const leftEnd = ty + 8;

  // ── Fotos lado a lado (colunas direita) ───────────────────────────────────
  if (oc.foto1buf) {
    try { doc.image(oc.foto1buf, P1_X, contentY, { fit: [PHOTO_W, PHOTO_H] }); } catch { /* ignore */ }
  }
  if (oc.foto2buf) {
    try { doc.image(oc.foto2buf, P2_X, contentY, { fit: [PHOTO_W, PHOTO_H] }); } catch { /* ignore */ }
  }

  // Avança para abaixo da coluna mais longa — clampado a BODY_BOT para não
  // criar página em branco quando PDFKit detecta cursor além do limite
  const photoEnd = (oc.foto1buf || oc.foto2buf) ? contentY + PHOTO_H + 8 : contentY;
  const endY     = Math.min(Math.max(leftEnd, photoEnd) + 10, BODY_BOT - 4);

  doc.text('', CONT_X, endY);
  if (doc.y + 20 < BODY_BOT) doc.moveDown(0.3);
}

// ── Renderiza estrutura completa ──────────────────────────────────────────────
function renderEstrutura(doc, estrutura) {
  for (const area of estrutura) {
    if (doc.y + 55 > BODY_BOT) doc.addPage();

    // Área: nome em maiúsculas, navy, bold
    doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY)
       .text(area.area_nome.toUpperCase(), CONT_X, doc.y, { width: CONT_W });
    doc.moveDown(0.5);

    for (const item of area.itens) {
      if (doc.y + 35 > BODY_BOT) doc.addPage();

      // Item: uppercase, bold, preto
      doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT)
         .text(item.descricao.toUpperCase(), CONT_X, doc.y, { width: CONT_W });
      doc.moveDown(0.5);

      for (const oc of item.ocs) renderOc(doc, oc);

      if (doc.y + 20 < BODY_BOT) doc.moveDown(0.4);
    }

    if (doc.y + 20 < BODY_BOT) doc.moveDown(0.8);
  }
}

// ── Ficha de dados (capa) ─────────────────────────────────────────────────────
function renderFicha(doc, fields) {
  for (const [label, valor] of fields) {
    if (valor == null) continue;
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT)
       .text(label, CONT_X, y, { width: 165 });
    doc.font('Helvetica').fontSize(10).fillColor(TEXT)
       .text(String(valor), CONT_X + 170, y, { width: CONT_W - 170 });
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

    const unidade      = data.unidades;
    const empresa      = unidade?.empresas;
    const analista     = data.perfis;
    const dataVistoria = data.data_criacao ? new Date(data.data_criacao).toLocaleDateString('pt-BR') : '—';

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

    // ── Capa ────────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY)
       .text('Relatório de Vistoria', { align: 'center' });
    doc.moveDown(0.4);
    hline(doc, doc.y, NAVY, 1.5);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(14).fillColor(TEXT)
       .text(unidade?.nome || '—', { align: 'center' });
    if (empresa?.nome) {
      doc.font('Helvetica').fontSize(11).fillColor(TEXT).text(empresa.nome, { align: 'center' });
    }
    if (unidade?.endereco) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(unidade.endereco, { align: 'center' });
    }
    doc.moveDown(1.5);

    renderFicha(doc, [
      ['Data da vistoria:',     dataVistoria],
      ['Analista responsável:', analista?.nome],
      ['Total de ocorrências:', String(totalOcs)]
    ]);

    doc.moveDown(1.5);
    hline(doc, doc.y, '#bbbbbb', 0.75);
    doc.moveDown(1.5);

    // ── Corpo ────────────────────────────────────────────────────────────────
    if (estrutura.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor(MUTED).text('Nenhuma ocorrência registrada.');
    } else {
      renderEstrutura(doc, estrutura);
    }

    // ── Cabeçalho + rodapé ───────────────────────────────────────────────────
    applyHeaderFooter(doc, { logoBuf, empresa: empresa?.nome, unidade: unidade?.nome || '—', dataVistoria, analista: analista?.nome });
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

    doc.font('Helvetica-Bold').fontSize(20).fillColor(RED)
       .text('Relatório de Pendências', { align: 'center' });
    doc.moveDown(0.4);
    hline(doc, doc.y, RED, 1.5);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(14).fillColor(TEXT)
       .text(unidade?.nome || '—', { align: 'center' });
    if (empresa?.nome) {
      doc.font('Helvetica').fontSize(11).fillColor(TEXT).text(empresa.nome, { align: 'center' });
    }
    if (unidade?.endereco) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(unidade.endereco, { align: 'center' });
    }
    doc.moveDown(1.5);

    renderFicha(doc, [
      ['Data da vistoria:',     dataVistoria],
      ['Analista responsável:', analista?.nome],
      ['Total de pendências:',  String(totalPend)]
    ]);

    doc.moveDown(1.5);
    hline(doc, doc.y, '#bbbbbb', 0.75);
    doc.moveDown(1.5);

    if (estrutura.length === 0) {
      doc.font('Helvetica').fontSize(11).fillColor(MUTED)
         .text('Nenhuma pendência encontrada. Vistoria sem itens de atenção ou críticos.');
    } else {
      renderEstrutura(doc, estrutura);
    }

    applyHeaderFooter(doc, { logoBuf, empresa: empresa?.nome, unidade: unidade?.nome || '—', dataVistoria, analista: analista?.nome });
    doc.flushPages();
    doc.end();

  } catch (err) {
    console.error('Erro ao gerar PDF de pendências:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao gerar relatório de pendências' });
  }
});

export default router;
