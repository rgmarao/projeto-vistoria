-- ─────────────────────────────────────────────────────────────────────────────
-- Melhoria 4 — Plano de Ação
-- Cria as tabelas planos_acao, plano_acao_itens e plano_acao_tarefas.
-- Adiciona o perfil 'gestor' à constraint de perfis.
--
-- Fluxo de uso:
--   1. Analista/admin cria um Plano de Ação para uma vistoria finalizada/publicada.
--   2. Seleciona ocorrências (atencao/critico) ou adiciona itens livres.
--   3. Para cada item, adiciona tarefas com responsável, prazo e descrição.
--   4. Responsável atualiza status: pendente → em_andamento → concluida.
--   5. Gestor ou admin aprova: concluida → aprovada.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Atualizar perfil check em perfis (adicionar 'gestor')
ALTER TABLE perfis DROP CONSTRAINT IF EXISTS perfis_perfil_check;
ALTER TABLE perfis
  ADD CONSTRAINT perfis_perfil_check
  CHECK (perfil IN ('admin', 'analista', 'usuario', 'gestor'));

-- 2. Tabela planos_acao (um plano por vistoria, único)
CREATE TABLE IF NOT EXISTS planos_acao (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vistoria_id   uuid NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  criado_por    uuid NOT NULL REFERENCES perfis(id),
  titulo        text NOT NULL DEFAULT 'Plano de Ação',
  observacoes   text,
  status        text NOT NULL DEFAULT 'aberto'
                CHECK (status IN ('aberto', 'concluido', 'cancelado')),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz,
  UNIQUE (vistoria_id)
);

-- 3. Tabela plano_acao_itens (cada item = uma ocorrência ou item livre)
CREATE TABLE IF NOT EXISTS plano_acao_itens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id      uuid NOT NULL REFERENCES planos_acao(id) ON DELETE CASCADE,
  ocorrencia_id uuid REFERENCES ocorrencias(id) ON DELETE SET NULL,
  descricao     text NOT NULL,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabela plano_acao_tarefas (tarefas por item)
CREATE TABLE IF NOT EXISTS plano_acao_tarefas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        uuid NOT NULL REFERENCES plano_acao_itens(id) ON DELETE CASCADE,
  descricao      text NOT NULL,
  responsavel_id uuid REFERENCES perfis(id) ON DELETE SET NULL,
  prazo          date,
  status         text NOT NULL DEFAULT 'pendente'
                 CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'aprovada')),
  aprovado_por   uuid REFERENCES perfis(id) ON DELETE SET NULL,
  aprovado_em    timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz
);

-- 5. Trigger atualizado_em para planos_acao
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_planos_acao_atualizado_em ON planos_acao;
CREATE TRIGGER trg_planos_acao_atualizado_em
  BEFORE UPDATE ON planos_acao
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

DROP TRIGGER IF EXISTS trg_plano_acao_tarefas_atualizado_em ON plano_acao_tarefas;
CREATE TRIGGER trg_plano_acao_tarefas_atualizado_em
  BEFORE UPDATE ON plano_acao_tarefas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- 6. Forçar reload do schema no PostgREST
NOTIFY pgrst, 'reload schema';
