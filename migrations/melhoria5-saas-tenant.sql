-- ============================================================
-- Melhoria 5 — Fundação SaaS / Multi-tenant
-- Rodar no SQL Editor do Supabase (ambiente DEV primeiro)
-- ============================================================

-- 1. Criar tabela contas
CREATE TABLE IF NOT EXISTS contas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  plano       text        NOT NULL DEFAULT 'basico'
                CHECK (plano IN ('basico', 'profissional', 'enterprise')),
  ativo       boolean     NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz
);

-- 2. Trigger atualizado_em para contas (reutiliza função existente)
DROP TRIGGER IF EXISTS trg_contas_atualizado_em ON contas;
CREATE TRIGGER trg_contas_atualizado_em
  BEFORE UPDATE ON contas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- 3. Adicionar conta_id em empresas (nullable para migração suave)
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES contas(id) ON DELETE SET NULL;

-- 4. Adicionar conta_id em perfis (nullable para migração suave)
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES contas(id) ON DELETE SET NULL;

-- 5. Atualizar constraint de perfil para incluir super_admin e gestor
--    (gestor foi adicionado na Melhoria 4 mas pode estar faltando em alguns envs)
ALTER TABLE perfis DROP CONSTRAINT IF EXISTS perfis_perfil_check;
ALTER TABLE perfis ADD CONSTRAINT perfis_perfil_check
  CHECK (perfil IN ('super_admin', 'admin', 'analista', 'gestor', 'usuario'));

-- 6. Criar conta padrão para migrar dados existentes
INSERT INTO contas (id, nome, slug, plano)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Conta Padrão', 'padrao', 'basico')
ON CONFLICT (id) DO NOTHING;

-- 7. Migrar empresas existentes para a conta padrão
UPDATE empresas
SET conta_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE conta_id IS NULL;

-- 8. Migrar perfis existentes para a conta padrão
--    (super_admin fica com conta_id = NULL — acesso cross-tenant)
UPDATE perfis
SET conta_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE conta_id IS NULL
  AND perfil != 'super_admin';

-- 9. Reload do cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Verificação pós-migração
-- ============================================================
-- SELECT count(*) FROM empresas WHERE conta_id IS NULL;  -- deve ser 0
-- SELECT count(*) FROM perfis   WHERE conta_id IS NULL AND perfil != 'super_admin';  -- deve ser 0
-- SELECT * FROM contas;
