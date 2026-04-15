-- ─────────────────────────────────────────────────────────────────────────────
-- Melhoria 3 — Semáforos Flexíveis
-- Adiciona coluna JSONB `configuracao_semaforos` em `empresas` e `unidades`.
--
-- Estrutura do JSONB:
-- {
--   "ok":      { "label": "OK",      "visivel": true },
--   "atencao": { "label": "Atenção", "visivel": true },
--   "critico": { "label": "Crítico", "visivel": true }
-- }
--
-- Herança: defaults ← empresa ← unidade
-- NULL = usa a configuração herdada (defaults ou empresa)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS configuracao_semaforos JSONB;

ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS configuracao_semaforos JSONB;

-- Força reload do schema no PostgREST
NOTIFY pgrst, 'reload schema';
