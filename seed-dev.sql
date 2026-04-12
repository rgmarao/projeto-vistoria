-- ============================================================
-- VistorIA DEV — Seed de Dados para Testes
-- ============================================================
-- Execute no SQL Editor do Supabase DEV (eiklerbtysfazgmhvkef)
-- Pode rodar tudo de uma vez ou em blocos na ordem abaixo.
--
-- USUÁRIOS CRIADOS (senha: Dev@123 para todos)
-- ┌──────────────────────────────────┬────────────────────────────┬──────────┐
-- │ UUID                             │ Email                      │ Perfil   │
-- ├──────────────────────────────────┼────────────────────────────┼──────────┤
-- │ a0000000-0000-0000-0000-000000000001 │ admin@vistoria-dev.com     │ admin    │
-- │ a0000000-0000-0000-0000-000000000002 │ analista@vistoria-dev.com  │ analista │
-- │ a0000000-0000-0000-0000-000000000003 │ usuario@vistoria-dev.com   │ usuario  │
-- └──────────────────────────────────┴────────────────────────────┴──────────┘
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- BLOCO 1 — Usuários no Supabase Auth
-- ─────────────────────────────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@vistoria-dev.com',
  crypt('Dev@123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"nome":"Admin Teste"}',
  false, '', '', '', ''
),
(
  'a0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'analista@vistoria-dev.com',
  crypt('Dev@123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"nome":"Analista Teste"}',
  false, '', '', '', ''
),
(
  'a0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'usuario@vistoria-dev.com',
  crypt('Dev@123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"nome":"Usuario Teste"}',
  false, '', '', '', ''
);

-- Identidades (necessário para login funcionar)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  created_at, updated_at, last_sign_in_at
) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@vistoria-dev.com","email_verified":true}',
  'email', 'admin@vistoria-dev.com',
  now(), now(), now()
),
(
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  '{"sub":"a0000000-0000-0000-0000-000000000002","email":"analista@vistoria-dev.com","email_verified":true}',
  'email', 'analista@vistoria-dev.com',
  now(), now(), now()
),
(
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000003',
  '{"sub":"a0000000-0000-0000-0000-000000000003","email":"usuario@vistoria-dev.com","email_verified":true}',
  'email', 'usuario@vistoria-dev.com',
  now(), now(), now()
);


-- ─────────────────────────────────────────────────────────────
-- BLOCO 2 — Perfis (tabela pública)
-- ─────────────────────────────────────────────────────────────

INSERT INTO perfis (id, nome, perfil, ativo, criado_em) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Admin Teste',
  'admin',
  true,
  now()
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Analista Teste',
  'analista',
  true,
  now()
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Usuario Teste',
  'usuario',
  true,
  now()
);


-- ─────────────────────────────────────────────────────────────
-- BLOCO 3 — Empresa e Unidade
-- ─────────────────────────────────────────────────────────────

INSERT INTO empresas (id, nome, cnpj, ativo, criado_em) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'Empresa Teste DEV',
  '00.000.000/0001-00',
  true,
  now()
);

INSERT INTO unidades (id, empresa_id, nome, endereco, ativo, criado_em) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Unidade Teste DEV',
  'Rua de Teste, 123 — São Paulo/SP',
  true,
  now()
);


-- ─────────────────────────────────────────────────────────────
-- BLOCO 4 — Vínculo: Usuario Teste ↔ Unidade Teste
-- ─────────────────────────────────────────────────────────────

INSERT INTO usuario_unidades (id, usuario_id, unidade_id) VALUES
(
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001'
);


-- ─────────────────────────────────────────────────────────────
-- BLOCO 5 — Áreas da Unidade Teste
-- ─────────────────────────────────────────────────────────────

INSERT INTO areas (id, unidade_id, nome, ordem, ativo, criado_em) VALUES
(
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Área Comum',
  10,
  true,
  now()
),
(
  'd0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'Estrutura',
  20,
  true,
  now()
),
(
  'd0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'Instalações Elétricas',
  30,
  true,
  now()
);


-- ─────────────────────────────────────────────────────────────
-- BLOCO 6 — Itens de Verificação
-- ─────────────────────────────────────────────────────────────

INSERT INTO itens_verificacao (id, descricao, ativo, criado_em) VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'Limpeza e conservação geral',
  true, now()
),
(
  'e0000000-0000-0000-0000-000000000002',
  'Iluminação adequada',
  true, now()
),
(
  'e0000000-0000-0000-0000-000000000003',
  'Rachaduras ou trincas visíveis',
  true, now()
),
(
  'e0000000-0000-0000-0000-000000000004',
  'Infiltrações ou umidade',
  true, now()
),
(
  'e0000000-0000-0000-0000-000000000005',
  'Quadro elétrico em boas condições',
  true, now()
),
(
  'e0000000-0000-0000-0000-000000000006',
  'Tomadas e interruptores funcionando',
  true, now()
);


-- ─────────────────────────────────────────────────────────────
-- BLOCO 7 — Associação Áreas ↔ Itens
-- ─────────────────────────────────────────────────────────────

INSERT INTO area_itens (id, area_id, item_id, ordem) VALUES
-- Área Comum
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 10),
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 20),
-- Estrutura
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 10),
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 20),
-- Instalações Elétricas
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000005', 10),
(gen_random_uuid(), 'd0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000006', 20);


-- ─────────────────────────────────────────────────────────────
-- FIM DO SEED
-- ─────────────────────────────────────────────────────────────
-- Resumo do que foi criado:
--   3 usuários (admin / analista / usuario) — senha: Dev@123
--   1 empresa  → 1 unidade
--   3 áreas    → 6 itens de verificação (2 por área)
--   usuario@vistoria-dev.com vinculado à Unidade Teste DEV
-- ─────────────────────────────────────────────────────────────
