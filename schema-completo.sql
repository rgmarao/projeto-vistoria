-- ============================================================
-- VistorIA — Schema Completo DDL
-- Banco: Supabase (PostgreSQL)
-- Gerado em: 2026-04-12
--
-- Instruções de uso:
--   Execute este script no SQL Editor do Supabase (painel web).
--   Quebre em blocos menores se o editor reclamar de tamanho.
--   Ordem obrigatória: extensões → funções → tabelas (respeitar FKs)
--     → índices → RLS → triggers → storage.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. EXTENSÕES
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─────────────────────────────────────────────────────────────
-- 2. FUNÇÕES AUXILIARES
-- ─────────────────────────────────────────────────────────────

-- Atualiza atualizado_em automaticamente em qualquer UPDATE
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 3. TABELAS
-- ─────────────────────────────────────────────────────────────

-- ── empresas ─────────────────────────────────────────────────
CREATE TABLE empresas (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text        NOT NULL,
  cnpj          text,
  logo_url      text,                          -- path no bucket "fotos"
  ativo         boolean     NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz
);

-- ── unidades ─────────────────────────────────────────────────
CREATE TABLE unidades (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid        NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
  nome          text        NOT NULL,
  endereco      text,
  logo_url      text,                          -- path no bucket "fotos" (prefixo: unidades/{id}/)
  ativo         boolean     NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz
);

-- ── perfis ───────────────────────────────────────────────────
-- id é o mesmo UUID do Supabase Auth (auth.users)
CREATE TABLE perfis (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          text        NOT NULL,
  perfil        text        NOT NULL DEFAULT 'usuario'
                            CHECK (perfil IN ('admin', 'analista', 'usuario')),
  ativo         boolean     NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz
);

-- ── usuario_unidades ─────────────────────────────────────────
-- Vincula usuários (perfil "usuario") às unidades que podem visualizar
CREATE TABLE usuario_unidades (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES perfis(id)   ON DELETE CASCADE,
  unidade_id  uuid NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  UNIQUE (usuario_id, unidade_id)
);

-- ── areas ────────────────────────────────────────────────────
CREATE TABLE areas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id  uuid        NOT NULL REFERENCES unidades(id) ON DELETE RESTRICT,
  nome        text        NOT NULL,
  ordem       integer     NOT NULL DEFAULT 10,
  ativo       boolean     NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- ── itens_verificacao ────────────────────────────────────────
CREATE TABLE itens_verificacao (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao   text        NOT NULL,
  ativo       boolean     NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- ── area_itens ───────────────────────────────────────────────
-- Junção M:N entre areas e itens_verificacao
CREATE TABLE area_itens (
  id       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id  uuid    NOT NULL REFERENCES areas(id)            ON DELETE CASCADE,
  item_id  uuid    NOT NULL REFERENCES itens_verificacao(id) ON DELETE RESTRICT,
  ordem    integer NOT NULL DEFAULT 10,
  UNIQUE (area_id, item_id)
);

-- ── estrutura_versoes ────────────────────────────────────────
-- Snapshot imutável da estrutura areas→itens de uma unidade,
-- vinculado à vistoria no momento da sua criação.
CREATE TABLE estrutura_versoes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id  uuid        NOT NULL REFERENCES unidades(id) ON DELETE RESTRICT,
  criado_por  uuid        NOT NULL REFERENCES perfis(id)   ON DELETE RESTRICT,
  estrutura   jsonb       NOT NULL DEFAULT '[]',            -- array de areas com itens aninhados
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- ── vistorias ────────────────────────────────────────────────
CREATE TABLE vistorias (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id          uuid        NOT NULL REFERENCES unidades(id)          ON DELETE RESTRICT,
  criado_por          uuid        NOT NULL REFERENCES perfis(id)            ON DELETE RESTRICT,
  estrutura_versao_id uuid        REFERENCES estrutura_versoes(id)          ON DELETE SET NULL,
  status              text        NOT NULL DEFAULT 'em_andamento'
                                  CHECK (status IN ('em_andamento', 'finalizada', 'publicada')),
  data_criacao        timestamptz NOT NULL DEFAULT now(),
  data_finalizacao    timestamptz,
  data_publicacao     timestamptz,
  atualizado_em       timestamptz
);

-- ── ocorrencias ──────────────────────────────────────────────
CREATE TABLE ocorrencias (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vistoria_id        uuid        NOT NULL REFERENCES vistorias(id)          ON DELETE CASCADE,
  area_id            uuid        REFERENCES areas(id)                       ON DELETE SET NULL,  -- NULLABLE
  item_id            uuid        REFERENCES itens_verificacao(id)           ON DELETE SET NULL,  -- NULLABLE
  numero_ocorrencia  integer     NOT NULL,
  descricao          text        NOT NULL,
  status             text        NOT NULL DEFAULT 'ok'
                                 CHECK (status IN ('ok', 'atencao', 'critico')),
  recomendacao       text,                                  -- só para 'atencao' e 'critico'
  origem             text        NOT NULL DEFAULT 'vistoria'
                                 CHECK (origem IN ('vistoria', 'morador', 'web', 'app')),
  foto_1_url         text,                                  -- path no bucket "fotos"
  foto_2_url         text,                                  -- path no bucket "fotos"
  criado_em          timestamptz NOT NULL DEFAULT now(),
  atualizado_em      timestamptz,
  UNIQUE (vistoria_id, numero_ocorrencia)
);


-- ─────────────────────────────────────────────────────────────
-- 4. ÍNDICES
-- ─────────────────────────────────────────────────────────────

-- empresas
CREATE INDEX idx_empresas_ativo        ON empresas (ativo);
CREATE INDEX idx_empresas_nome         ON empresas (nome);

-- unidades
CREATE INDEX idx_unidades_empresa_id   ON unidades (empresa_id);
CREATE INDEX idx_unidades_ativo        ON unidades (ativo);
CREATE INDEX idx_unidades_nome         ON unidades (nome);

-- perfis
CREATE INDEX idx_perfis_perfil         ON perfis (perfil);
CREATE INDEX idx_perfis_ativo          ON perfis (ativo);

-- usuario_unidades
CREATE INDEX idx_uu_usuario_id         ON usuario_unidades (usuario_id);
CREATE INDEX idx_uu_unidade_id         ON usuario_unidades (unidade_id);

-- areas
CREATE INDEX idx_areas_unidade_id      ON areas (unidade_id);
CREATE INDEX idx_areas_unidade_ativo   ON areas (unidade_id, ativo);
CREATE INDEX idx_areas_ordem           ON areas (unidade_id, ordem);

-- itens_verificacao
CREATE INDEX idx_itens_ativo           ON itens_verificacao (ativo);
CREATE INDEX idx_itens_descricao       ON itens_verificacao (descricao);

-- area_itens
CREATE INDEX idx_area_itens_area_id    ON area_itens (area_id);
CREATE INDEX idx_area_itens_item_id    ON area_itens (item_id);
CREATE INDEX idx_area_itens_ordem      ON area_itens (area_id, ordem);

-- estrutura_versoes
CREATE INDEX idx_ev_unidade_id         ON estrutura_versoes (unidade_id);
CREATE INDEX idx_ev_criado_em          ON estrutura_versoes (unidade_id, criado_em DESC);

-- vistorias
CREATE INDEX idx_vistorias_unidade_id  ON vistorias (unidade_id);
CREATE INDEX idx_vistorias_criado_por  ON vistorias (criado_por);
CREATE INDEX idx_vistorias_status      ON vistorias (status);
CREATE INDEX idx_vistorias_criacao     ON vistorias (data_criacao DESC);

-- ocorrencias
CREATE INDEX idx_oc_vistoria_id        ON ocorrencias (vistoria_id);
CREATE INDEX idx_oc_area_id            ON ocorrencias (area_id)  WHERE area_id  IS NOT NULL;
CREATE INDEX idx_oc_item_id            ON ocorrencias (item_id)  WHERE item_id  IS NOT NULL;
CREATE INDEX idx_oc_status             ON ocorrencias (status);
CREATE INDEX idx_oc_numero             ON ocorrencias (vistoria_id, numero_ocorrencia);


-- ─────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────
-- IMPORTANTE: o backend usa SUPABASE_SERVICE_KEY (service_role),
-- que bypassa o RLS automaticamente. As políticas abaixo protegem
-- acessos diretos via anon/authenticated key (ex: Supabase Dashboard,
-- chamadas diretas ao PostgREST com token de usuário).
-- ─────────────────────────────────────────────────────────────

ALTER TABLE empresas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis            ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_unidades  ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_verificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_itens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE estrutura_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vistorias         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias       ENABLE ROW LEVEL SECURITY;

-- ── empresas: leitura pública autenticada; escrita só admin ──
CREATE POLICY "empresas_select"
  ON empresas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "empresas_insert"
  ON empresas FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

CREATE POLICY "empresas_update"
  ON empresas FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

CREATE POLICY "empresas_delete"
  ON empresas FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

-- ── unidades ─────────────────────────────────────────────────
CREATE POLICY "unidades_select"
  ON unidades FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "unidades_insert"
  ON unidades FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

CREATE POLICY "unidades_update"
  ON unidades FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

-- ── perfis ───────────────────────────────────────────────────
CREATE POLICY "perfis_select"
  ON perfis FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "perfis_insert"
  ON perfis FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
    OR auth.uid() = id   -- auto-criação no registro
  );

CREATE POLICY "perfis_update"
  ON perfis FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

-- ── usuario_unidades ─────────────────────────────────────────
CREATE POLICY "uu_select"
  ON usuario_unidades FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "uu_all_admin"
  ON usuario_unidades FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

-- ── areas ────────────────────────────────────────────────────
CREATE POLICY "areas_select"
  ON areas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "areas_write_admin"
  ON areas FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

-- ── itens_verificacao ────────────────────────────────────────
CREATE POLICY "itens_select"
  ON itens_verificacao FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "itens_write_admin"
  ON itens_verificacao FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

-- ── area_itens ───────────────────────────────────────────────
CREATE POLICY "area_itens_select"
  ON area_itens FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "area_itens_write_admin"
  ON area_itens FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

-- ── estrutura_versoes ────────────────────────────────────────
CREATE POLICY "ev_select"
  ON estrutura_versoes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil IN ('admin', 'analista')
    )
  );

CREATE POLICY "ev_insert_admin"
  ON estrutura_versoes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil = 'admin')
  );

-- ── vistorias ────────────────────────────────────────────────
-- Admin/analista: veem todas
-- Usuario: veem apenas publicadas de suas unidades
CREATE POLICY "vistorias_select_admin_analista"
  ON vistorias FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil IN ('admin', 'analista')
    )
  );

CREATE POLICY "vistorias_select_usuario"
  ON vistorias FOR SELECT TO authenticated
  USING (
    status = 'publicada'
    AND EXISTS (
      SELECT 1
        FROM perfis p
        JOIN usuario_unidades uu ON uu.usuario_id = p.id
       WHERE p.id = auth.uid()
         AND p.perfil = 'usuario'
         AND uu.unidade_id = vistorias.unidade_id
    )
  );

CREATE POLICY "vistorias_insert"
  ON vistorias FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil IN ('admin', 'analista')
    )
  );

CREATE POLICY "vistorias_update"
  ON vistorias FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil IN ('admin', 'analista')
    )
  );

-- ── ocorrencias ──────────────────────────────────────────────
CREATE POLICY "ocorrencias_select_admin_analista"
  ON ocorrencias FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil IN ('admin', 'analista')
    )
  );

CREATE POLICY "ocorrencias_select_usuario"
  ON ocorrencias FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM vistorias v
        JOIN usuario_unidades uu ON uu.unidade_id = v.unidade_id
        JOIN perfis p ON p.id = uu.usuario_id
       WHERE v.id = ocorrencias.vistoria_id
         AND v.status = 'publicada'
         AND p.id = auth.uid()
         AND p.perfil = 'usuario'
    )
  );

CREATE POLICY "ocorrencias_insert"
  ON ocorrencias FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil IN ('admin', 'analista')
    )
  );

CREATE POLICY "ocorrencias_update"
  ON ocorrencias FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil IN ('admin', 'analista')
    )
  );

CREATE POLICY "ocorrencias_delete"
  ON ocorrencias FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis WHERE id = auth.uid() AND perfil IN ('admin', 'analista')
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 6. TRIGGERS
-- ─────────────────────────────────────────────────────────────
-- Mantêm atualizado_em em sincronia mesmo que o código não o defina.
-- O backend já seta manualmente, mas o trigger é a rede de segurança.

CREATE TRIGGER trg_empresas_atualizado_em
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_unidades_atualizado_em
  BEFORE UPDATE ON unidades
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_perfis_atualizado_em
  BEFORE UPDATE ON perfis
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_vistorias_atualizado_em
  BEFORE UPDATE ON vistorias
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE TRIGGER trg_ocorrencias_atualizado_em
  BEFORE UPDATE ON ocorrencias
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();


-- ─────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────
-- ATENÇÃO: existe apenas UM bucket chamado "fotos".
-- Ele armazena tanto as fotos das ocorrências quanto os logos
-- de unidades/empresas. O CLAUDE.md mencionava um bucket "logos"
-- separado, mas o código usa somente "fotos" para tudo.
--
-- Estrutura de paths dentro do bucket:
--   ocorrencias/{ocorrencia_id}/foto_{slot}_{timestamp}.{ext}
--   unidades/{unidade_id}/logo_{timestamp}.{ext}
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos',
  'fotos',
  false,                                        -- privado: acesso via Signed URLs (1h)
  10485760,                                     -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage (bucket: fotos)
CREATE POLICY "fotos_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'fotos');

CREATE POLICY "fotos_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos');

CREATE POLICY "fotos_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fotos');

CREATE POLICY "fotos_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fotos');


-- ─────────────────────────────────────────────────────────────
-- FIM DO SCHEMA
-- ─────────────────────────────────────────────────────────────
