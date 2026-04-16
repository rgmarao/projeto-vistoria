-- ============================================================
-- Melhoria 5.1 — Catálogo de itens em dois níveis
-- Itens/grupos globais (conta_id NULL) + itens por tenant
-- Rodar no SQL Editor do Supabase (DEV primeiro)
-- ============================================================

-- 1. Adicionar conta_id em itens_verificacao
ALTER TABLE itens_verificacao
  ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES contas(id) ON DELETE SET NULL;

-- 2. Adicionar conta_id em grupos_verificacao
ALTER TABLE grupos_verificacao
  ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES contas(id) ON DELETE SET NULL;

-- Os itens/grupos existentes ficam com conta_id = NULL
-- e passam a ser o catálogo global (visível a todos os tenants)

-- 3. Reload do cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Verificação pós-migração
-- ============================================================
-- SELECT count(*) FROM itens_verificacao WHERE conta_id IS NULL;  -- todos globais
-- SELECT count(*) FROM grupos_verificacao WHERE conta_id IS NULL;  -- todos globais
