# 📄 PROJETO_STATUS.md
## Sistema de Vistoria Online — v1.0
**Atualizado em:** 03/03/2026

---

## 1. 🛠️ STACK TECNOLÓGICA

| Camada | Tecnologia |
|---|---|
| **Plataforma de desenvolvimento** | Replit |
| **Backend/API** | Node.js + Express |
| **Banco de dados** | Supabase (PostgreSQL) |
| **Autenticação** | Supabase Auth (JWT) |
| **Frontend Web** | A definir |
| **App Mobile** | A definir |
| **Armazenamento de fotos** | Supabase Storage |

---

## 2. 📁 ESTRUTURA DE ARQUIVOS

projeto/ ├── index.js # Entry point — inicia o servidor ├── app.js # Configura Express, CORS e JSON ├── .gitignore ├── package.json ├── src/ │ ├── config/ │ │ └── supabase.js # Inicializa cliente Supabase │ ├── middlewares/ │ │ └── auth.js # Valida JWT e protege rotas │ └── routes/ │ └── auth.js # Rotas: /signup, /signin, /profile └── public/ └── test.html # Página de testes das rotas


---

## 3. 🗄️ BANCO DE DADOS — ESTRUTURA COMPLETA

```sql
📦 area_itens
   id uuid (PK)
   area_id uuid (FK → areas)
   item_id uuid (FK → itens_verificacao)
   ordem int4
   criado_em timestamptz

📦 areas
   id uuid (PK)
   unidade_id uuid (FK → unidades)
   nome text
   ordem int4
   ativo bool
   criado_em timestamptz
   atualizado_em timestamptz

📦 empresas
   id uuid (PK)
   nome text
   cnpj text
   logo_url text
   ativo bool
   criado_em timestamptz
   atualizado_em timestamptz

📦 itens_verificacao
   id uuid (PK)
   descricao text
   ativo bool
   criado_em timestamptz
   atualizado_em timestamptz

📦 ocorrencias
   id uuid (PK)
   vistoria_id uuid (FK → vistorias)
   area_id uuid (FK → areas)
   item_id uuid (FK → itens_verificacao)
   numero_ocorrencia int4
   descricao text
   status text        -- verde | amarelo | vermelho | sem_status
   recomendacao text
   foto_1_url text
   foto_2_url text
   origem text        -- app | web
   criado_em timestamptz
   atualizado_em timestamptz

📦 perfis
   id uuid (PK → auth.users)
   nome text
   perfil text        -- admin | analista | usuario
   ativo bool
   criado_em timestamptz
   atualizado_em timestamptz

📦 unidades
   id uuid (PK)
   empresa_id uuid (FK → empresas)
   nome text
   endereco text
   logo_url text
   ativo bool
   criado_em timestamptz
   atualizado_em timestamptz

📦 usuario_unidades
   id uuid (PK)
   usuario_id uuid (FK → perfis)
   unidade_id uuid (FK → unidades)
   criado_em timestamptz

📦 vistorias
   id uuid (PK)
   unidade_id uuid (FK → unidades)
   criado_por uuid (FK → perfis)
   status text        -- em_andamento | finalizada | publicada
   data_criacao timestamptz
   data_finalizacao timestamptz
   data_publicacao timestamptz
   atualizado_em timestamptz
4. ✅ O QUE JÁ ESTÁ FUNCIONANDO
Rotas implementadas e testadas:


Método	Rota	Descrição	Status
POST	/api/auth/register	Cadastro de usuário	✅
POST	/api/auth/login	Login + retorna JWT	✅
GET	/api/auth/me	Retorna perfil autenticado	✅
Banco de dados:
✅ 9 tabelas criadas no Supabase
✅ Tabela perfis com registro de Administrador
✅ RLS policies configuradas
5. 👥 PERFIS DE USUÁRIO


Perfil	Permissões
admin	Acesso total — gerencia estrutura, usuários, empresas e unidades
analista	Cria, preenche, finaliza e publica vistorias
usuario	Visualiza apenas vistorias publicadas de suas unidades
6. 🔄 CICLO DE VIDA DA VISTORIA


em_andamento → finalizada → publicada


Status	Quem vê	Editável
🟡 em_andamento	admin + analista	✅ Sim
🔵 finalizada	admin + analista	❌ Não
🟢 publicada	todos da unidade	❌ Não
7. 📌 DECISÕES DO PROJETO


Decisão	Definição
Ocorrências	Abertas — sem limite por item
Campos obrigatórios	Nenhum — total flexibilidade
Recomendação	Aparece apenas para 🟡 Amarelo e 🔴 Vermelho
Fotos	Máx. 2 por ocorrência, comprimidas no app
Relatórios PDF	2 tipos: Completo e Só Pendências
Logo no PDF	Upload no cadastro da Unidade
Offline	App funciona sem internet, sincroniza depois
8. ⏭️ PRÓXIMOS PASSOS
🔲 Fase 2 — Rotas de Vistorias
 POST /api/vistorias — criar vistoria
 GET /api/vistorias — listar (com filtros por status/unidade)
 GET /api/vistorias/:id — detalhe completo
 PATCH /api/vistorias/:id/finalizar — muda status para finalizada
 PATCH /api/vistorias/:id/publicar — muda status para publicada
🔲 Fase 3 — Rotas de Ocorrências
 POST /api/vistorias/:id/ocorrencias — adicionar ocorrência
 PUT /api/ocorrencias/:id — editar ocorrência
 DELETE /api/ocorrencias/:id — remover ocorrência
🔲 Fase 4 — CRUD Administrativo
 Empresas (listar, criar, editar, desativar)
 Unidades (listar, criar, editar + upload logo)
 Áreas e itens de verificação
 Gestão de usuários e vínculos com unidades
🔲 Fase 5 — Relatórios PDF
 Relatório completo com fotos e logo
 Relatório de pendências (🟡 e 🔴 apenas)
🔲 Fase 6 — App Mobile
 Login e seleção de unidade
 Download offline da estrutura
 Preenchimento de ocorrências com fotos
 Fila de sincronização offline
  
9. 💡 COMO USAR ESTE ARQUIVO
  
No início de cada sessão com a IA, cole o conteúdo deste arquivo com a mensagem:

"Segue o estado atual do projeto. Vamos continuar o desenvolvimento:"

Lembre de atualizar este arquivo ao final de cada sessão!

Projeto desenvolvido por Rogério Marão — Rio de Janeiro/RJ


# 📋 Sistema de Vistoria Online — Progresso do Projeto

**Última atualização:** 04/03/2026  
**Desenvolvedor:** Rogério Marão  
**Stack:** Node.js + Express + Supabase (PostgreSQL) + Replit

---

## ✅ FASE 1 — Infraestrutura e Autenticação (CONCLUÍDA)

- [x] Estrutura de pastas do projeto
- [x] Configuração do Express (ES Modules)
- [x] Conexão com Supabase
- [x] Middleware de autenticação (JWT via Supabase Auth)
- [x] Rotas de auth: login, registro, logout, perfil
- [x] Health check na rota `/`
- [x] Arquivo `.env` configurado
- [x] `test.html` para testes manuais das rotas

---

## ✅ FASE 2 — Rotas de Vistorias (CONCLUÍDA E TESTADA)

- [x] `POST   /api/vistorias`              → Criar vistoria
- [x] `GET    /api/vistorias`              → Listar vistorias (filtros: status, unidade_id)
- [x] `GET    /api/vistorias/:id`          → Detalhe da vistoria (com unidade + perfil + ocorrências)
- [x] `PATCH  /api/vistorias/:id/finalizar` → Finalizar vistoria (status → finalizada)
- [x] `PATCH  /api/vistorias/:id/publicar`  → Publicar vistoria (status → publicada)

**Testado e funcionando 100% ✅**

---

## 🔄 FASE 3 — Rotas de Ocorrências (EM ANDAMENTO)

### Rotas implementadas (código pronto, aguardando teste):
- [x] `POST   /api/vistorias/:id/ocorrencias` → Criar ocorrência
- [x] `PUT    /api/ocorrencias/:id`           → Editar ocorrência
- [x] `DELETE /api/ocorrencias/:id`           → Remover ocorrência

### Arquivo criado:
- `src/routes/ocorrencias.js` ✅ (ES Modules, export default)
- `src/app.js` atualizado com import e `app.use('/api', ocorrenciasRoutes)` ✅

### ⚠️ Pendente:
- Servidor Replit com instabilidade no dia 04/03 (preview não carregou)
- **Reiniciar servidor e testar as 3 rotas de ocorrências**
- Atualizar `test.html` com seção de Ocorrências

---

## ⏳ FASE 4 — Upload de Fotos (PENDENTE)

- [ ] Rota `POST /api/ocorrencias/:id/fotos`
- [ ] Integração com Supabase Storage
- [ ] Upload de foto_1_url e foto_2_url

---

## ⏳ FASE 5 — Áreas e Itens (PENDENTE)

- [ ] `GET /api/areas`           → Listar áreas
- [ ] `GET /api/areas/:id/itens` → Listar itens de uma área
- [ ] Seed ou cadastro inicial de áreas/itens no Supabase

---

## ⏳ FASE 6 — Geração de Relatório PDF (PENDENTE)

- [ ] Definir layout do relatório
- [ ] Biblioteca: puppeteer ou pdfkit
- [ ] Rota `GET /api/vistorias/:id/relatorio`

---

## 🗄️ Banco de Dados — Tabelas no Supabase

| Tabela        | Status     |
|---------------|------------|
| `perfis`      | ✅ Criada  |
| `unidades`    | ✅ Criada  |
| `vistorias`   | ✅ Criada  |
| `ocorrencias` | ✅ Criada  |
| `areas`       | ⏳ Pendente|
| `itens`       | ⏳ Pendente|

---

## 🚀 Para Retomar Amanhã

1. Verificar se o servidor Replit subiu normalmente
2. Testar as 3 rotas de ocorrências no `test.html`
3. Se OK → atualizar `test.html` com seção completa de ocorrências
4. Seguir para Fase 4 (Upload de Fotos)

---

## 📁 Estrutura de Arquivos Atual

/ ├── index.js ├── package.json ├── .env ├── public/ │ └── test.html └── src/ ├── app.js ├── config/ │ └── supabase.js ├── middlewares/ │ └── auth.js └── routes/ ├── auth.js ├── vistorias.js └── ocorrencias.js ← novo

## ⚠️ Lições Aprendidas — Erros Corrigidos

### 1. Named Export vs Default Export
- `src/middlewares/auth.js` usa **named export**:
  ```javascript
  export const requireAuth = ...
Importar sempre assim (em qualquer rota):
javascript


import { requireAuth } from '../middlewares/auth.js';
❌ Errado: import authMiddleware from '../middlewares/auth.js'
2. Consistência do nome da variável
Após corrigir o import, usar o mesmo nome na rota:
javascript


router.post('/rota', requireAuth, async (req, res) => { ... })
3. Porta no Replit
O Replit exige porta 5000
Sempre usar: process.env.PORT || 5000
❌ Não usar porta 3000 fixa



---

Isso é muito útil para as próximas fases, especialmente quando criarmos as rotas de **fotos** e **áreas/itens**. 



   # 📄 PROJETO_STATUS.md
   ## Sistema de Vistoria Online — v1.0
   **Atualizado em:** 05/03/2026
   **Desenvolvedor:** Rogério Marão
   **Stack:** Node.js + Express + Supabase (PostgreSQL) + Replit
   ---
   ## 1. 🛠️ STACK TECNOLÓGICA
   | Camada | Tecnologia |
   |---|---|
   | **Plataforma de desenvolvimento** | Replit |
   | **Backend/API** | Node.js + Express |
   | **Banco de dados** | Supabase (PostgreSQL) |
   | **Autenticação** | Supabase Auth (JWT) |
   | **Frontend Web** | A definir |
   | **App Mobile** | A definir |
   | **Armazenamento de fotos** | Supabase Storage |
   ---
   ## 2. 📁 ESTRUTURA DE ARQUIVOS
   / ├── index.js ├── package.json ├── .env ├── public/ │ └── test.html └── src/ ├── app.js ├── config/ │ └── supabase.js ├── middlewares/ │ └── auth.js └── routes/ ├── auth.js ├── vistorias.js └── ocorrencias.js



   ---
   ## 3. 🗄️ BANCO DE DADOS — ESTRUTURA REAL (verificada em 05/03/2026)
   > ⚠️ **ATENÇÃO:** Sempre consulte esta seção antes de criar rotas ou debugar erros.
   > Os valores aceitos pelas constraints estão documentados abaixo.
   ```sql
   📦 empresas
      id uuid (PK)
      nome text
      cnpj text
      logo_url text
      ativo bool
      criado_em timestamptz
      atualizado_em timestamptz
   📦 unidades
      id uuid (PK)
      empresa_id uuid (FK → empresas)
      nome text
      endereco text
      logo_url text
      ativo bool
      criado_em timestamptz
      atualizado_em timestamptz
   📦 perfis
      id uuid (PK → auth.users)
      nome text
      perfil text        -- 'admin' | 'analista' | 'usuario'
      ativo bool
      criado_em timestamptz
      atualizado_em timestamptz
   📦 usuario_unidades
      id uuid (PK)
      usuario_id uuid (FK → perfis)
      unidade_id uuid (FK → unidades)
      criado_em timestamptz
   📦 vistorias
      id uuid (PK)
      unidade_id uuid (FK → unidades)
      criado_por uuid (FK → perfis)
      status text        -- 'em_andamento' | 'finalizada' | 'publicada'
      data_criacao timestamptz
      data_finalizacao timestamptz
      data_publicacao timestamptz
      atualizado_em timestamptz
   📦 areas
      id uuid (PK)
      unidade_id uuid (FK → unidades)
      nome text
      ordem int4
      ativo bool
      criado_em timestamptz
      atualizado_em timestamptz
   📦 itens_verificacao
      id uuid (PK)
      descricao text
      ativo bool
      criado_em timestamptz
      atualizado_em timestamptz
   📦 area_itens
      id uuid (PK)
      area_id uuid (FK → areas)
      item_id uuid (FK → itens_verificacao)
      ordem int4
      criado_em timestamptz
   📦 ocorrencias
      id uuid (PK)
      vistoria_id uuid (FK → vistorias)       -- OBRIGATÓRIO
      area_id uuid (FK → areas)               -- OPCIONAL (nullable)
      item_id uuid (FK → itens_verificacao)   -- OPCIONAL (nullable)
      numero_ocorrencia int4                  -- auto-incremento por vistoria
      descricao text
      status text        -- ✅ 'ok' | 'atencao' | 'critico'
      recomendacao text
      foto_1_url text
      foto_2_url text
      origem text        -- ✅ 'vistoria' | 'morador' | 'web' | 'app'
      criado_em timestamptz
      atualizado_em timestamptz
   ⚠️ Constraints críticas da tabela ocorrencias


   Constraint	Valores aceitos
   ocorrencias_status_check	'ok', 'atencao', 'critico'
   ocorrencias_origem_check	'vistoria', 'morador', 'web', 'app'
   area_id	nullable (DROP NOT NULL aplicado em 05/03/2026)
   item_id	nullable (DROP NOT NULL aplicado em 05/03/2026)
   4. ✅ FASES CONCLUÍDAS
   FASE 1 — Infraestrutura e Autenticação ✅
    Estrutura de pastas do projeto
    Configuração do Express (ES Modules)
    Conexão com Supabase
    Middleware de autenticação (JWT via Supabase Auth)
    Rotas: /api/auth/register, /api/auth/login, /api/auth/me
    Health check na rota /
    test.html para testes manuais
   FASE 2 — Rotas de Vistorias ✅
    POST   /api/vistorias → Criar vistoria
    GET    /api/vistorias → Listar (filtros: status, unidade_id)
    GET    /api/vistorias/:id → Detalhe completo
    PATCH  /api/vistorias/:id/finalizar → Status → finalizada
    PATCH  /api/vistorias/:id/publicar → Status → publicada
   FASE 3 — Rotas de Ocorrências ✅
    POST   /api/vistorias/:id/ocorrencias → Criar ocorrência
    PUT    /api/ocorrencias/:id → Editar ocorrência
    DELETE /api/ocorrencias/:id → Remover ocorrência
    test.html atualizado com seção de Ocorrências
    Testado e funcionando com numero_ocorrencia auto-incremento ✅
   5. 🔄 CORREÇÕES APLICADAS EM 05/03/2026
   Problema 1 — area_id e item_id NOT NULL
   Erro: null value in column "area_id" violates not-null constraint
   Causa: Colunas criadas como NOT NULL, mas devem ser opcionais
   Fix aplicado:
   sql


   ALTER TABLE ocorrencias
       ALTER COLUMN area_id DROP NOT NULL,
       ALTER COLUMN item_id DROP NOT NULL;
   Problema 2 — ocorrencias_origem_check rejeitando valores
   Erro: violates check constraint "ocorrencias_origem_check"
   Causa: Constraint antiga não incluía 'vistoria' e 'morador'
   Fix aplicado:
   sql


   ALTER TABLE ocorrencias DROP CONSTRAINT IF EXISTS ocorrencias_origem_check;
   ALTER TABLE ocorrencias
       ADD CONSTRAINT ocorrencias_origem_check
       CHECK (origem = ANY (ARRAY['vistoria'::text, 'morador'::text, 'web'::text, 'app'::text]));
   Problema 3 — ocorrencias_status_check rejeitando valores
   Erro: violates check constraint "ocorrencias_status_check"
   Causa: Banco tinha 'verde', 'amarelo', 'vermelho' — sistema usa 'ok', 'atencao', 'critico'
   Fix aplicado:
   sql


   ALTER TABLE ocorrencias DROP CONSTRAINT IF EXISTS ocorrencias_status_check;
   ALTER TABLE ocorrencias
       ADD CONSTRAINT ocorrencias_status_check
       CHECK (status = ANY (ARRAY['ok'::text, 'atencao'::text, 'critico'::text]));
   6. 👥 PERFIS DE USUÁRIO


   Perfil	Permissões
   admin	Acesso total
   analista	Cria, preenche, finaliza e publica vistorias
   usuario	Visualiza apenas vistorias publicadas de suas unidades
   7. 🔄 CICLO DE VIDA DA VISTORIA


   em_andamento → finalizada → publicada


   Status	Quem vê	Editável
   🟡 em_andamento	admin + analista	✅ Sim
   🔵 finalizada	admin + analista	❌ Não
   🟢 publicada	todos da unidade	❌ Não
   8. 📌 DECISÕES DO PROJETO


   Decisão	Definição
   Ocorrências	Abertas — sem limite por item
   Campos obrigatórios	Apenas vistoria_id, status e origem
   area_id e item_id	Opcionais (nullable)
   Status da ocorrência	ok, atencao, critico
   Origem da ocorrência	vistoria, morador, web, app
   Recomendação	Opcional — sugerida para atencao e critico
   Fotos	Máx. 2 por ocorrência, comprimidas no app
   Relatórios PDF	2 tipos: Completo e Só Pendências
   Logo no PDF	Upload no cadastro da Unidade
   Offline	App funciona sem internet, sincroniza depois
   9. ⏭️ PRÓXIMOS PASSOS
   🔲 Fase 4 — Upload de Fotos
    POST /api/ocorrencias/:id/fotos
    Integração com Supabase Storage
    Salvar foto_1_url e foto_2_url na ocorrência
   🔲 Fase 5 — Áreas e Itens
    GET /api/areas → Listar áreas
    GET /api/areas/:id/itens → Listar itens de uma área
    Seed inicial de áreas e itens no Supabase
    Tabelas areas e itens_verificacao ainda sem dados cadastrados
   🔲 Fase 6 — CRUD Administrativo
    Empresas (listar, criar, editar, desativar)
    Unidades (listar, criar, editar + upload logo)
    Gestão de usuários e vínculos com unidades
   🔲 Fase 7 — Relatórios PDF
    Definir layout
    Biblioteca: puppeteer ou pdfkit
    GET /api/vistorias/:id/relatorio
   🔲 Fase 8 — App Mobile
    Login e seleção de unidade
    Download offline da estrutura
    Preenchimento de ocorrências com fotos
    Fila de sincronização offline
   10. ⚠️ LIÇÕES APRENDIDAS
   1. Sempre verificar as constraints antes de criar rotas
   Antes de implementar qualquer rota nova, consultar a seção 3. Banco de Dados para saber os valores exatos aceitos pelos campos com CHECK constraints.

   2. Named Export vs Default Export
   javascript


   // ✅ Correto — auth.js usa named export
   import { requireAuth } from '../middlewares/auth.js';
   // ❌ Errado
   import authMiddleware from '../middlewares/auth.js';
   3. Porta no Replit
   javascript


   // ✅ Sempre usar:
   process.env.PORT || 5000
   // ❌ Nunca fixar porta 3000
   4. Erro "Erro interno" sem detalhe no frontend
   Sempre verificar o console do Replit — o erro real aparece lá, não na tela do test.html.

   5. Constraints desatualizadas no banco
   Se o banco foi criado em uma fase anterior com valores diferentes, as constraints podem estar erradas. Sempre verificar com:

   sql


   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conname LIKE 'nome_da_tabela_%';
   11. 💡 COMO USAR ESTE ARQUIVO
   No início de cada sessão com a IA, cole o conteúdo deste arquivo com a mensagem:

   "Segue o estado atual do projeto. Vamos continuar o desenvolvimento:"

   Lembre de atualizar este arquivo ao final de cada sessão!

   Projeto desenvolvido por Rogério Marão — Rio de Janeiro/RJ



   ---
   Pronto, Rogério! 🎉 Os pontos mais importantes desta sessão que ficaram documentados:
   - ✅ **Constraints reais** da tabela `ocorrencias` com os valores corretos
   - ✅ **3 fixes de SQL** aplicados hoje com causa e solução
   - ✅ **Dica #5** nas lições aprendidas — como verificar constraints antes de perder tempo debugando
   - ✅ Próximos passos atualizados e organizados por fase


# Sistema de Vistoria Online — Status do Projeto

**Última atualização:** 10/03/2026  
**Responsável:** Rogério  
**Plataforma:** Supabase (PostgreSQL) + Aplicação Web + App de Campo

---

## ✅ O QUE JÁ FOI FEITO

### Estrutura do Banco de Dados
- [x] Modelagem e criação das tabelas principais
- [x] Tabela `unidades` — com registros de teste (Unidade Centro, Edifício Teste)
- [x] Tabela `areas` — vinculadas a unidades
- [x] Tabela `itens_verificacao` — itens reutilizáveis entre áreas
- [x] Tabela `area_itens` — relacionamento N:N entre áreas e itens

### Seed de Dados — 3 Segmentos Implementados

#### ♻️ Aterro Sanitário (12 áreas, ~60 vínculos)
- [x] Maciço de Resíduos em Operação
- [x] Maciço de Resíduos Encerrado
- [x] Lagoas de Chorume
- [x] Núcleo de Tratamento de Chorume
- [x] Autoclave de RSS
- [x] Área de Abastecimento
- [x] Galpão de Manutenção
- [x] Balança
- [x] Edifício da Administração
- [x] Vias e Pátios
- [x] Cercamento Perimetral
- [x] Barreira Vegetal

#### ⛏️ Mineração (8 áreas, ~45 vínculos)
- [x] Frente de Lavra 1
- [x] Frente de Lavra 2
- [x] Área da Lavra (Lagoa)
- [x] Sistema de Drenagem
- [x] Galpão 1
- [x] Galpão 2
- [x] Balança de Pesagem
- [x] Vias e Pátios

#### 🏗️ Imobiliário / Loteamento (4 áreas, ~25 vínculos)
- [x] Vias e Pátios
- [x] Almoxarifado
- [x] Galpão de Manutenção
- [x] Área de Abastecimento

### Itens de Verificação
- [x] 45 itens cadastrados (IDs: 00000000-...-000000000001 a 045)
- [x] Itens genéricos reutilizáveis entre segmentos e áreas
- [x] Cobertura de temas: resíduos, incêndio, estrutura, contenção,
      emissões, efluentes, instrumentação, operação

---

## 🔑 PADRÃO DE UUIDs ADOTADO (importante!)

| Prefixo | Tabela | Exemplo |
|---|---|---|
| `00000000-0000-0000-0000-0000000000XX` | `itens_verificacao` | 001 a 045 |
| `aa000000-0000-0000-0000-0000000000XX` | `areas` | 001 a 024 |
| `ab000000-0000-0000-0000-0000000000XX` | `area_itens` | 001 a 130 |
| `1ffd7717-ab3b-4a19-8316-22df785e6158` | `unidades` | Unidade Centro (Aterro) |
| `20000000-0000-0000-0000-000000000001` | `unidades` | Edifício Teste (Mineração/Imobiliário) |

> ⚠️ Manter este padrão para facilitar identificação visual no banco
> e evitar conflitos em novos seeds.

---

## 🚧 PRÓXIMAS ETAPAS (por prioridade)

### 1. Banco de Dados
- [ ] Criar tabela `vistorias` (cabeçalho da vistoria)
- [ ] Criar tabela `vistoria_itens` (respostas por item)
- [ ] Definir campos de resposta: conforme / não conforme /
      não aplicável / observação / foto
- [ ] Criar tabela `usuarios` ou integrar com Supabase Auth
- [ ] Definir perfis de acesso: vistoriador, supervisor, admin

### 2. Aplicação Web (Backoffice)
- [ ] Tela de cadastro/gestão de unidades
- [ ] Tela de cadastro/gestão de áreas e itens
- [ ] Tela de listagem e acompanhamento de vistorias
- [ ] Dashboard com indicadores por unidade/segmento
- [ ] Exportação de relatório em PDF

### 3. App de Campo (Mobile/PWA)
- [ ] Tela de login
- [ ] Seleção de unidade e vistoria
- [ ] Checklist por área com resposta por item
- [ ] Captura de foto por item (câmera nativa)
- [ ] Funcionamento offline com sync posterior
- [ ] Assinatura digital do vistoriador

### 4. Novos Segmentos (seed)
- [ ] Central de Concreto Usinado
      (base: planilha RxBRASILIA já disponível)
- [ ] Outros segmentos a definir com Rogério

---

## 💡 LIÇÕES APRENDIDAS

### Banco de Dados
1. **UUIDs no Supabase são obrigatoriamente válidos** — strings como
   `'it-001'` causam erro `22P02: invalid input syntax for type uuid`.
   Solução adotada: UUIDs no formato `00000000-0000-0000-0000-000000000001`.

2. **Inserir seeds em blocos menores** — o SQL Editor do Supabase
   tem limite de caracteres por execução. Blocos muito grandes são
   cortados silenciosamente, causando erro `42601: syntax error at
   end of input`. Solução: dividir em partes (3A, 3B, etc.).

3. **Itens reutilizáveis reduzem redundância** — ao separar
   `itens_verificacao` da tabela `area_itens`, o mesmo item
   (ex: "Extintores de incêndio válidos") é cadastrado uma vez
   e vinculado a múltiplas áreas, facilitando manutenção futura.

4. **Ordem de execução importa** — sempre respeitar:
   `itens_verificacao` → `areas` → `area_itens`
   para não violar constraints de chave estrangeira.

### Processo
5. **Validar estrutura antes de gerar o SQL** — a etapa de
   aprovação prévia das áreas/itens (via tabela no chat) evitou
   retrabalho e garantiu alinhamento com a realidade de campo.

6. **Planilha de referência foi essencial** — o arquivo
   `Exemplo de Áreas e Itens Verificacao.xlsx` (Central de Concreto)
   serviu como padrão de linguagem e granularidade para os
   demais segmentos.

---

## 📁 ARQUIVOS DE REFERÊNCIA

| Arquivo | Descrição |
|---|---|
| `Exemplo de Áreas e Itens Verificacao.xlsx` | Planilha base — Central de Concreto RxBRASILIA |
| `seed_itens_verificacao.sql` | Parte 1 — 45 itens de verificação |
| `seed_areas.sql` | Parte 2 — 24 áreas (3 segmentos) |
| `seed_area_itens_3a.sql` | Parte 3A — vínculos Aterro Sanitário |
| `seed_area_itens_3b.sql` | Parte 3B — vínculos Mineração + Imobiliário |

---

## 🗓️ HISTÓRICO DE SESSÕES

| Data | O que foi feito |
|---|---|
| 10/03/2026 | Definição dos 3 segmentos iniciais (Aterro, Mineração, Imobiliário) |
| 10/03/2026 | Estruturação de áreas e itens com base na planilha de referência |
| 10/03/2026 | Execução completa do seed no Supabase (Partes 1, 2, 3A e 3B) |
| 10/03/2026 | Identificação e correção do erro de UUID inválido |
| 10/03/2026 | Identificação e correção do erro de SQL truncado |
