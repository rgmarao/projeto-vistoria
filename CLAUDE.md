# CLAUDE.md — Memória Persistente do Projeto VistorIA

> Este arquivo é lido no início de toda nova sessão. Contém o contexto completo do projeto para que não seja necessário reexplicar nada.

## INSTRUÇÃO PARA NOVA SESSÃO

**Ao iniciar qualquer sessão, ANTES de qualquer ação, perguntar:**

> "Olá! Antes de começar — vamos trabalhar em **desenvolvimento (branch `dev`)** ou em **produção (branch `main`)**?"

Após a resposta, executar `git checkout dev` ou `git checkout main` conforme indicado e confirmar o branch ativo.

---

## 1. SOBRE O PROJETO

**VistorIA** — Sistema de Vistoria Online. Aplicação web + PWA mobile-first para realização de vistorias técnicas em campo. Segmentos: aterro sanitário, mineração, imobiliário e outros.

- **Web (analista/admin):** interface Tabler Bootstrap para criação, acompanhamento e publicação de vistorias.
- **App (PWA):** interface mobile offline-first (IndexedDB) para vistoriadores em campo, com sincronização posterior.
- **Relatórios:** geração de PDF com PDFKit (relatório completo + relatório de pendências).

---

## 2. STACK TECNOLÓGICA

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js com ES Modules (`"type": "module"`) |
| Framework | Express.js v5 |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (JWT via Bearer token) |
| Upload de fotos | Multer (memória) + Supabase Storage (bucket: `fotos`) |
| Upload de logos | Multer (memória) + Supabase Storage (bucket: `fotos`, prefixo `unidades/`) |
| PDF | PDFKit v0.18 |
| Frontend Web | HTML + CSS + JS vanilla (sem framework) |
| UI Web | Tabler Bootstrap (analista/admin) |
| App Mobile | HTML + CSS + JS vanilla (PWA offline-first) |
| Persistência offline | IndexedDB via `public/js/db.js` |
| Plataforma | Replit |
| Porta padrão | `5000` (env: `PORT`) |

> **Nota:** O `package.json` contém dependências React/Vite/Drizzle que são **resquícios do template Replit** e **não são usadas** na aplicação. O projeto usa Express puro com HTML estático.

---

## 3. ESTRUTURA DE PASTAS

```
projeto-vistoria/
├── index.js                    # Entry point — app.listen(PORT || 5000)
├── package.json                # type: module; scripts: dev, start, build
├── CLAUDE.md                   # Este arquivo
├── .replit / replit.nix        # Configuração Replit
├── push-to-github.sh           # Script utilitário de push
├── pull-from-github.sh         # Script utilitário de pull
│
├── src/
│   ├── app.js                  # Express app, mounting de rotas, middlewares globais
│   ├── config/
│   │   └── supabase.js         # Cliente Supabase (SUPABASE_URL + SUPABASE_SERVICE_KEY)
│   ├── middlewares/
│   │   └── auth.js             # requireAuth — valida Bearer token via supabase.auth.getUser()
│   └── routes/
│       ├── auth.js             # /api/auth — login, logout, register, reset-password, me
│       ├── vistorias.js        # /api/vistorias — CRUD + finalizar, publicar, reabrir, checklist
│       ├── ocorrencias.js      # /api/vistorias/:id/ocorrencias + /api/ocorrencias/:id
│       ├── fotos.js            # /api/ocorrencias/:id/fotos — upload/delete (Multer)
│       ├── areas.js            # /api/unidades/:id/areas + /api/areas/:id + /api/area-itens/:id
│       ├── itens.js            # /api/itens — itens de verificação globais
│       ├── empresas.js         # /api/empresas — CRUD
│       ├── unidades.js         # /api/unidades — CRUD + logo upload
│       ├── planosAcao.js       # /api/planos-acao — CRUD + tarefas + aprovar
│       ├── perfis.js           # /api/perfis — CRUD + vínculo com unidades
│       ├── usuarios.js         # /api/usuarios — listagem e gestão
│       └── relatorios.js       # /api/vistorias/:id/pdf + /pdf/pendencias (PDFKit)
│
└── public/                     # Servido como estático pelo Express
    ├── index.html              # Login (redireciona por perfil)
    ├── manifest.json           # PWA manifest (start_url: /app/index.html)
    ├── sw.js                   # Service Worker (cache offline)
    ├── img/
    │   └── logo-vistoria.png   # Logo VistorIA (também usada no PDF)
    ├── css/
    │   └── style.css           # Estilos globais web
    ├── js/
    │   ├── api.js              # Cliente HTTP (apiFetch + apiFetchForm + exports por módulo)
    │   ├── plano-acao.js       # Lógica da página /analista/plano-acao.html
    │   └── db.js               # IndexedDB: stores checklists + vistorias; uuid(); dataURLtoBlob()
    ├── admin/                  # Painel administrativo (Tabler)
    │   ├── index.html          # Dashboard admin
    │   ├── empresas.html       # CRUD empresas
    │   ├── unidades.html       # CRUD unidades
    │   ├── estrutura.html      # Gestão de áreas e itens
    │   ├── itens.html          # Gestão de itens globais
    │   └── usuarios.html       # Gestão de usuários
    ├── analista/               # Painel do analista (Tabler)
    │   ├── index.html          # Dashboard analista
    │   ├── vistorias.html      # Listagem de vistorias
    │   ├── vistoria.html       # Detalhe/edição de vistoria (inclui PDF, reabrir, publicar, botão Plano de Ação)
    │   ├── plano-acao.html     # Plano de Ação por vistoria (?vistoria_id= ou ?id=)
    │   └── minhas-tarefas.html # Tarefas do usuário logado (todos os perfis)
    └── app/                    # PWA mobile-first
        ├── index.html          # Tela de login do app
        ├── home.html           # Home: lista unidades, sync bar, menu avatar
        ├── vistoria.html       # Formulário de vistoria offline (areas→itens→ocorrências)
        └── app.css             # Estilos customizados do app
```

---

## 4. VARIÁVEIS DE AMBIENTE

```
SUPABASE_URL          # URL do projeto Supabase (https://xxx.supabase.co)
SUPABASE_SERVICE_KEY  # Chave de serviço (service_role, acesso total)
PORT                  # Porta do servidor (padrão: 5000)
```

> No Replit, as variáveis ficam em **Secrets** (não em `.env`). Localmente, usar `.env` com `dotenv`.

---

## 4.1 AMBIENTES E BRANCHES

### Ambientes

| Ambiente | Replit | Supabase | Branch Git |
|----------|--------|----------|-----------|
| Produção | `projeto-vistoria` | `awebfejydsabfnsxnksx.supabase.co` | `main` |
| Desenvolvimento | `vistoria-dev` | `eiklerbtysfazgmhvkef.supabase.co` | `dev` |

> Cada Replit tem seus próprios Secrets apontando para o Supabase correto. **NUNCA** alterar Secrets para apontar para o ambiente errado.

### Estratégia de Branches

```
main:  ──●──●──────────────────●──●──── (produção + correções rápidas)
            \                 ↗
dev:         ──●──●──●──●──●──  (novas funcionalidades)
```

| Cenário | Branch | Onde testa | Quando vai pra main |
|---------|--------|-----------|---------------------|
| Nova funcionalidade | `dev` | Replit vistoria-dev | Quando testado e aprovado |
| Correção rápida em produção | `main` | Replit projeto-vistoria | Imediatamente |

### Promoção DEV → PROD

```bash
git checkout main
git merge dev
git push origin main
# Depois, no Replit produção: git pull origin main
```

### Usuários de teste (apenas DEV)

| Email | Senha | Perfil |
|-------|-------|--------|
| `admin@vistoria-dev.com` | `Dev@123` | admin |
| `analista@vistoria-dev.com` | `Dev@123` | analista |
| `usuario@vistoria-dev.com` | `Dev@123` | usuario |

---

## 5. BANCO DE DADOS — TABELAS E CAMPOS

### `empresas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| nome | text | NOT NULL |
| cnpj | text | NULLABLE |
| logo_url | text | Path no bucket `fotos` (NULLABLE) |
| ativo | boolean | default true |
| criado_em | timestamptz | NOT NULL |
| atualizado_em | timestamptz | NULLABLE, setado pelo trigger |

### `unidades`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| empresa_id | uuid FK → empresas | NOT NULL |
| nome | text | NOT NULL |
| endereco | text | NULLABLE |
| logo_url | text | Path no bucket `fotos` (prefixo `unidades/{id}/`) |
| ativo | boolean | default true |
| criado_em | timestamptz | NOT NULL |
| atualizado_em | timestamptz | NULLABLE, setado pelo trigger |

### `perfis`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | FK → auth.users(id), mesmo UUID do Supabase Auth |
| nome | text | Nome completo do usuário, NOT NULL |
| perfil | text | CHECK: 'admin' \| 'analista' \| 'usuario' \| 'gestor', default 'usuario' |
| ativo | boolean | default true |
| criado_em | timestamptz | NOT NULL |
| atualizado_em | timestamptz | NULLABLE, setado pelo trigger |

> **Login** retorna `{ user: { id, email, nome, role }, token }`. O campo `nome` vem da tabela `perfis`, não do Supabase Auth metadata.

### `usuario_unidades`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| usuario_id | uuid FK → perfis | |
| unidade_id | uuid FK → unidades | |

> Vincula usuários (perfil `usuario`) às unidades que podem visualizar.

### `vistorias`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| unidade_id | uuid FK → unidades | NOT NULL |
| criado_por | uuid FK → perfis | Analista responsável, NOT NULL |
| estrutura_versao_id | uuid FK → estrutura_versoes | NULLABLE — snapshot vinculado na criação |
| status | text | CHECK: 'em_andamento' \| 'finalizada' \| 'publicada', default 'em_andamento' |
| data_criacao | timestamptz | NOT NULL |
| data_finalizacao | timestamptz | NULLABLE |
| data_publicacao | timestamptz | NULLABLE |
| atualizado_em | timestamptz | NULLABLE, setado pelo trigger |

### `ocorrencias`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| vistoria_id | uuid FK → vistorias | |
| area_id | uuid FK → areas **NULLABLE** | |
| item_id | uuid FK → itens_verificacao **NULLABLE** | |
| numero_ocorrencia | integer | Auto-incrementa por vistoria |
| descricao | text | |
| status | text | CHECK: 'ok' \| 'atencao' \| 'critico' |
| recomendacao | text | |
| origem | text | CHECK: 'vistoria' \| 'morador' \| 'web' \| 'app' |
| foto_1_url | text | Path no bucket `fotos` (prefixo `ocorrencias/{id}/`) |
| foto_2_url | text | Path no bucket `fotos` (prefixo `ocorrencias/{id}/`) |
| criado_em | timestamptz | NOT NULL |
| atualizado_em | timestamptz | NULLABLE, setado pelo trigger |

**Constraints:**
- `ocorrencias_status_check`: valores permitidos: `'ok'`, `'atencao'`, `'critico'`
- `ocorrencias_origem_check`: valores permitidos: `'vistoria'`, `'morador'`, `'web'`, `'app'`
- `area_id` e `item_id` são **NULLABLE** (ocorrência pode existir sem área/item)
- UNIQUE `(vistoria_id, numero_ocorrencia)`

### `areas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| unidade_id | uuid FK → unidades | NOT NULL |
| nome | text | NOT NULL |
| ordem | integer | Ordenação na exibição, default 10 |
| ativo | boolean | default true |
| criado_em | timestamptz | NOT NULL |

### `itens_verificacao`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| descricao | text | |
| grupo_id | uuid FK → grupos_verificacao | NULLABLE, ON DELETE SET NULL |
| ativo | boolean | default true |
| criado_em | timestamptz | |

### `grupos_verificacao`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| nome | text | NOT NULL |
| ativo | boolean | default true |
| criado_em | timestamptz | NOT NULL |

> Rótulo/categoria para itens de verificação (ex.: "Segurança do Trabalho", "Infraestrutura"). FK em `itens_verificacao.grupo_id`. No futuro SaaS será escopado por empresa/conta.

### `area_itens`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| area_id | uuid FK → areas | NOT NULL |
| item_id | uuid FK → itens_verificacao | NOT NULL |
| ordem | integer | Ordenação na exibição, default 10 |

> Tabela de junção M:N entre `areas` e `itens_verificacao`. UNIQUE `(area_id, item_id)`. Cada linha representa um item disponível em uma área específica de uma unidade.

### `estrutura_versoes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| unidade_id | uuid FK → unidades | NOT NULL |
| criado_por | uuid FK → perfis | Admin que publicou a estrutura |
| estrutura | jsonb | Snapshot da estrutura `areas→itens` no momento da publicação |
| criado_em | timestamptz | NOT NULL |

> Snapshot imutável da estrutura de uma unidade. Quando uma vistoria é criada, o campo `estrutura_versao_id` na tabela `vistorias` é vinculado à última versão publicada — garantindo que a vistoria reflita a estrutura vigente na época, mesmo que a estrutura mude depois.

### `planos_acao`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| vistoria_id | uuid FK → vistorias | UNIQUE — um plano por vistoria |
| criado_por | uuid FK → perfis | Quem criou o plano |
| titulo | text | NOT NULL, default 'Plano de Ação' |
| observacoes | text | NULLABLE |
| status | text | CHECK: 'aberto' \| 'concluido' \| 'cancelado', default 'aberto' |
| criado_em | timestamptz | NOT NULL |
| atualizado_em | timestamptz | NULLABLE |

### `plano_acao_itens`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| plano_id | uuid FK → planos_acao | ON DELETE CASCADE |
| ocorrencia_id | uuid FK → ocorrencias | NULLABLE — ON DELETE SET NULL |
| descricao | text | NOT NULL |
| criado_em | timestamptz | NOT NULL |

### `plano_acao_tarefas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| item_id | uuid FK → plano_acao_itens | ON DELETE CASCADE |
| descricao | text | NOT NULL |
| responsavel_id | uuid FK → perfis | NULLABLE — ON DELETE SET NULL |
| prazo | date | NULLABLE |
| status | text | CHECK: 'pendente' \| 'em_andamento' \| 'concluida' \| 'aprovada', default 'pendente' |
| aprovado_por | uuid FK → perfis | NULLABLE |
| aprovado_em | timestamptz | NULLABLE |
| criado_em | timestamptz | NOT NULL |
| atualizado_em | timestamptz | NULLABLE |

---

## 6. PERFIS DE USUÁRIO E PERMISSÕES

| Perfil | Permissões |
|--------|-----------|
| `admin` | Acesso total a todas as rotas e recursos |
| `analista` | Cria, preenche, finaliza e publica vistorias; cria e gerencia planos de ação; gera PDFs |
| `gestor` | Visualiza planos de ação onde tem tarefas; atualiza status das suas tarefas; aprova tarefas concluídas |
| `usuario` | Visualiza **apenas** vistorias com status `publicada` de suas unidades vinculadas |

---

## 7. MAPA COMPLETO DE ROTAS DA API

### Auth (`/api/auth`)
| Método | Rota | Auth | Perfil | Descrição | Status |
|--------|------|------|--------|-----------|--------|
| POST | `/api/auth/login` | ❌ | — | Login email/senha, retorna token + user (com nome) | ✅ |
| POST | `/api/auth/logout` | ✅ | todos | Encerra sessão | ✅ |
| POST | `/api/auth/register` | ❌ | — | Cadastra novo usuário | ✅ |
| POST | `/api/auth/reset-password` | ❌ | — | Envia email de recuperação | ✅ |
| GET | `/api/auth/me` | ✅ | todos | Retorna dados do usuário logado | ✅ |

### Vistorias (`/api/vistorias`)
| Método | Rota | Auth | Perfil | Descrição | Status |
|--------|------|------|--------|-----------|--------|
| GET | `/api/vistorias` | ✅ | todos | Lista vistorias (filtros: status, unidade_id) | ✅ |
| GET | `/api/vistorias/:id` | ✅ | todos | Detalhe completo | ✅ |
| GET | `/api/vistorias/:id/checklist` | ✅ | todos | Estrutura areas→itens→ocorrências | ✅ |
| POST | `/api/vistorias` | ✅ | admin, analista | Cria nova vistoria | ✅ |
| PATCH | `/api/vistorias/:id/finalizar` | ✅ | admin, analista | `em_andamento` → `finalizada` | ✅ |
| PATCH | `/api/vistorias/:id/publicar` | ✅ | admin, analista | `finalizada` → `publicada` | ✅ |
| PATCH | `/api/vistorias/:id/reabrir` | ✅ | admin, analista | `finalizada` → `em_andamento` | ✅ |

### Ocorrências
| Método | Rota | Auth | Perfil | Descrição | Status |
|--------|------|------|--------|-----------|--------|
| POST | `/api/vistorias/:id/ocorrencias` | ✅ | admin, analista | Cria ocorrência | ✅ |
| PUT | `/api/ocorrencias/:id` | ✅ | admin, analista | Atualiza ocorrência | ✅ |
| DELETE | `/api/ocorrencias/:id` | ✅ | admin, analista | Remove ocorrência | ✅ |

### Fotos
| Método | Rota | Auth | Perfil | Descrição | Status |
|--------|------|------|--------|-----------|--------|
| GET | `/api/ocorrencias/:id/fotos` | ✅ | todos | Retorna `{ path, url }` com Signed URLs (1h) | ✅ |
| POST | `/api/ocorrencias/:id/fotos` | ✅ | admin, analista | Upload foto (form: `foto` + `slot`=1\|2) | ✅ |
| DELETE | `/api/ocorrencias/:id/fotos/:slot` | ✅ | admin, analista | Remove foto do slot (1 ou 2) | ✅ |

### Áreas e Itens
| Método | Rota | Auth | Descrição | Status |
|--------|------|------|-----------|--------|
| GET | `/api/unidades/:id/areas` | ✅ | Lista áreas (`?incluir_inativas=true`) | ✅ |
| GET | `/api/unidades/:id/checklist` | ✅ | Estrutura completa para app offline | ✅ |
| GET | `/api/areas/:id/itens` | ✅ | Itens de uma área | ✅ |
| POST | `/api/unidades/:id/areas` | ✅ | Cria área | ✅ |
| POST | `/api/areas/:id/itens` | ✅ | Associa item à área | ✅ |
| PUT | `/api/areas/:id` | ✅ | Edita área | ✅ |
| PATCH | `/api/areas/:id/ativar` | ✅ | Ativa área | ✅ |
| PATCH | `/api/areas/:id/desativar` | ✅ | Desativa área | ✅ |
| DELETE | `/api/areas/:id` | ✅ | Remove área (falha se tiver itens) | ✅ |
| DELETE | `/api/area-itens/:id` | ✅ | Remove vínculo item↔área | ✅ |
| PATCH | `/api/unidades/:id/areas/reordenar` | ✅ | Batch update `ordem` das áreas (drag-and-drop) | ✅ |
| PATCH | `/api/areas/:id/itens/reordenar` | ✅ | Batch update `ordem` dos itens da área (drag-and-drop) | ✅ |

### Estrutura — Versões (`/api/unidades/:id/estrutura`)
| Método | Rota | Auth | Perfil | Descrição | Status |
|--------|------|------|--------|-----------|--------|
| POST | `/api/unidades/:id/estrutura/publicar` | ✅ | admin | Grava snapshot da estrutura atual como nova versão | ✅ |
| GET | `/api/unidades/:id/estrutura/versoes/ultima` | ✅ | todos | Retorna metadados da última versão publicada | ✅ |

### Itens de Verificação (`/api/itens`)
| Método | Rota | Auth | Descrição | Status |
|--------|------|------|-----------|--------|
| GET | `/api/itens` | ✅ | Lista todos (`?ativo=`, `?grupo_id=`); retorna `grupo_nome` flat | ✅ |
| POST | `/api/itens` | ✅ | Cria item global (body aceita `grupo_id`) | ✅ |
| PUT | `/api/itens/:id` | ✅ | Edita descrição e/ou `grupo_id` | ✅ |
| PATCH | `/api/itens/:id/ativar` | ✅ | Ativa | ✅ |
| PATCH | `/api/itens/:id/desativar` | ✅ | Desativa | ✅ |

### Grupos de Verificação (`/api/grupos`)
| Método | Rota | Auth | Descrição | Status |
|--------|------|------|-----------|--------|
| GET | `/api/grupos` | ✅ | Lista todos (`?ativo=true\|false`) | ✅ |
| POST | `/api/grupos` | ✅ | Cria grupo (body: `{ nome }`) | ✅ |
| PUT | `/api/grupos/:id` | ✅ | Edita nome | ✅ |
| PATCH | `/api/grupos/:id/ativar` | ✅ | Ativa | ✅ |
| PATCH | `/api/grupos/:id/desativar` | ✅ | Desativa | ✅ |
| DELETE | `/api/grupos/:id` | ✅ | Remove grupo (falha se tiver itens associados) | ✅ |

### Empresas (`/api/empresas`)
| Método | Rota | Auth | Descrição | Status |
|--------|------|------|-----------|--------|
| GET | `/api/empresas` | ✅ | Lista (`?ativo=`) | ✅ |
| GET | `/api/empresas/:id` | ✅ | Detalhe | ✅ |
| POST | `/api/empresas` | ✅ | Cria | ✅ |
| PUT | `/api/empresas/:id` | ✅ | Edita | ✅ |
| PATCH | `/api/empresas/:id/ativar` | ✅ | Ativa | ✅ |
| PATCH | `/api/empresas/:id/desativar` | ✅ | Desativa | ✅ |

### Unidades (`/api/unidades`)
| Método | Rota | Auth | Descrição | Status |
|--------|------|------|-----------|--------|
| GET | `/api/unidades` | ✅ | Lista (`?empresa_id=`, `?ativo=`) | ✅ |
| GET | `/api/unidades/:id` | ✅ | Detalhe | ✅ |
| POST | `/api/unidades` | ✅ | Cria (FormData, campo `logo`) | ✅ |
| PUT | `/api/unidades/:id` | ✅ | Edita (FormData, campo `logo`) | ✅ |
| PATCH | `/api/unidades/:id/ativar` | ✅ | Ativa | ✅ |
| PATCH | `/api/unidades/:id/desativar` | ✅ | Desativa | ✅ |
| DELETE | `/api/unidades/:id/logo` | ✅ | Remove logo | ✅ |

### Perfis (`/api/perfis`)
| Método | Rota | Auth | Descrição | Status |
|--------|------|------|-----------|--------|
| GET | `/api/perfis` | ✅ | Lista (`?ativo=`) | ✅ |
| GET | `/api/perfis/:id` | ✅ | Detalhe + unidades vinculadas | ✅ |
| GET | `/api/perfis/:id/unidades` | ✅ | Unidades do perfil | ✅ |
| POST | `/api/perfis` | ✅ | Cria perfil | ✅ |
| POST | `/api/perfis/:id/unidades` | ✅ | Vincula unidade ao perfil | ✅ |
| PUT | `/api/perfis/:id` | ✅ | Edita perfil | ✅ |
| PATCH | `/api/perfis/:id/ativar` | ✅ | Ativa | ✅ |
| PATCH | `/api/perfis/:id/desativar` | ✅ | Desativa | ✅ |
| DELETE | `/api/perfis/:id/unidades/:unidade_id` | ✅ | Desvincula unidade | ✅ |

### Relatórios PDF
| Método | Rota | Auth | Descrição | Status |
|--------|------|------|-----------|--------|
| GET | `/api/vistorias/:id/pdf` | ✅ | Relatório completo (download) | ✅ |
| GET | `/api/vistorias/:id/pdf/pendencias` | ✅ | Relatório de pendências (atencao+critico) | ✅ |

---

## 8. CICLO DE VIDA DA VISTORIA

```
em_andamento  ──finalizar──►  finalizada  ──publicar──►  publicada
                                   │
                               ◄──reabrir
```

| Status | Quem vê | Quem edita ocorrências |
|--------|---------|------------------------|
| `em_andamento` | admin, analista | admin, analista |
| `finalizada` | admin, analista | ninguém (somente reabrir) |
| `publicada` | admin, analista, **usuario** (suas unidades) | ninguém |

---

## 9. REGRAS DE NEGÓCIO

- Ocorrências só podem ser criadas/editadas em vistorias `em_andamento`
- `recomendacao` é sugerida pelo sistema quando status = `atencao` ou `critico`; exibida na UI analista/web com label "RECOMENDAÇÕES" em uppercase muted
- Fotos: máx **2 por ocorrência** (slots 1 e 2), máx **10MB**, formatos: JPEG, PNG, WEBP
- Ao sobrescrever foto: a foto antiga é removida do Storage antes do novo upload
- URLs de fotos são **Signed URLs** válidas por **1 hora** (nunca armazenar URL permanente)
- GET de fotos sempre retorna objeto `{ path, url }` — nunca `null` direto
- `numero_ocorrencia` auto-incrementa por vistoria (max existente + 1)
- `area_id` e `item_id` são NULLABLE — ocorrências livres são permitidas
- **itemPreenchido** (app): aceita qualquer dado — status OU texto OU foto1 OU foto2
- **Sync app→servidor**: qualquer ocorrência com qualquer dado preenchido deve ser sincronizada

---

## 10. DECISÕES TÉCNICAS E CONVENÇÕES

### app.js — Ordem de montagem de rotas
```js
// CRÍTICO: fotosRoutes DEVE vir ANTES de vistoriasRoutes
// (Multer é middleware; se vistoriasRoutes vier primeiro, pode capturar a rota)
app.use('/api', fotosRoutes);         // genérica — por último entre as específicas
app.use('/api', ocorrenciasRoutes);
app.use('/api', areasRoutes);
app.use('/api', relatoriosRoutes);
```

### Upload de arquivos (FormData)
- **NUNCA** definir `Content-Type` manualmente ao enviar FormData
- O browser define automaticamente com o `boundary` correto
- `apiFetchForm()` em `public/js/api.js` existe para isso

### ES Modules
- Todo arquivo usa `import/export` (sem `require`)
- `package.json` tem `"type": "module"`
- Para `__dirname`: `const __dirname = dirname(fileURLToPath(import.meta.url))`

### PDF (PDFKit)
- Sempre usar `bufferPages: true` para permitir cabeçalho/rodapé retroativo
- Padrão: `doc.switchToPage(i)` → desenhar header/footer → `doc.flushPages()` → `doc.end()`
- **Armadilha crítica:** `doc.text()` no rodapé pode ultrapassar `doc.page.maxY()` e criar páginas extras. Fix: zerar `doc.page.margins.bottom = 0` antes do texto do rodapé, restaurar depois
- Dimensões A4: `PAGE_W=595.28`, `PAGE_H=841.89` (pontos)
- Margens laterais: `M=45`. Header height: `HDR_H=75`. Footer height: `FTR_H=30`
- Layout de ocorrência: texto esquerda (249pt) + foto1 (113pt) + foto2 (113pt) lado a lado

### Dialogs customizados
- Todos os `alert()` e `confirm()` nativos foram substituídos por `dialogo()` promise-based
- Função `dialogo(msg, { cancelar: false })` retorna `Promise<boolean>`
- O elemento `<div id="app-dialog">` deve existir no HTML de cada página que usa `dialogo()`
- Estilo: overlay `rgba(0,0,0,.4)`, card branco com header navy `#1b3a6b`, inline styles (não Tabler)

### Autenticação no frontend
- Token: `localStorage.getItem('token')`
- User: `JSON.parse(localStorage.getItem('user'))` — objeto `{ id, email, nome, role }`
- `role` = perfil do usuário (`admin`, `analista`, `usuario`)
- `api.js` injeta `Authorization: Bearer <token>` automaticamente

---

## 11. STATUS DO DESENVOLVIMENTO

### Concluído
- **Fase 1:** Infraestrutura, Express, Supabase, Auth JWT
- **Fase 2:** CRUD Vistorias (criar, listar, detalhar, finalizar, publicar, reabrir)
- **Fase 3:** CRUD Ocorrências (criar, editar, deletar + número auto-incremento)
- **Fase 3.5:** Áreas e Itens — estrutura areas→area_itens→itens_verificacao; seed com 3 segmentos (Aterro Sanitário, Mineração, Imobiliário)
- **Fase 4:** Upload de Fotos (2 slots, 10MB, signed URLs, remoção ao sobrescrever)
- **Fase 5 parcial:** Admin web — empresas, unidades, estrutura, itens, usuários (HTML existente, funcionalidade parcial)
- **Fase 6:** Relatórios PDF — completo + pendências, cabeçalho/rodapé repetido, layout 2 colunas texto+fotos, agrupamento por área→item
- **App PWA:** Home (unidades, sync), Vistoria offline (areas→itens→ocorrências→fotos), Sincronização com API
- **UX:** Dialogs customizados VistorIA, menu avatar com nome/email/limpar cache/sair, reabrir vistoria (web + app)
- **Melhoria 1:** Drag-and-drop de áreas e itens (SortableJS) — grip handles, batch reorder via PATCH `/reordenar`
- **Melhoria 2:** Grupos de verificação como entidade FK (tabela `grupos_verificacao`) — CRUD completo em `/admin/grupos.html`, select em itens, filtro por grupo, preparado para SaaS (escopo por empresa no futuro)
- **Melhoria 3:** Semáforos Flexíveis — herança empresa → unidade via JSONB `configuracao_semaforos`; labels/visibilidade customizáveis; refletido no PDF e no app mobile
- **Melhoria 4:** Plano de Ação — tabelas `planos_acao`, `plano_acao_itens`, `plano_acao_tarefas`; novo perfil `gestor`; páginas `analista/plano-acao.html` e `analista/minhas-tarefas.html`; botão na vistoria finalizada/publicada; aprovação por gestor/admin

### Pendente (plano de Melhorias)

- **Melhoria 5 — Fundação SaaS / Multi-tenant:**
  - Nova tabela `contas` (id, nome, slug, plano, ativo, criado_em)
  - FK `conta_id` em `empresas` e `perfis` (ambas NULLABLE inicialmente para migração suave)
  - Novo perfil `super_admin` — acesso cross-tenant, gerencia contas
  - Middleware `src/middlewares/tenant.js` — extrai `conta_id` do perfil logado e injeta em todas as queries
  - Self-service: `/registro.html` cria conta + usuário admin num só fluxo
  - Painel `/super-admin/` — listar contas, ativar/desativar, trocar plano
  - Migration: criar tabela `contas`, adicionar FK, migrar dados existentes → conta padrão `id=1`
  - Estratégia: não quebrar dados existentes — conta padrão recebe tudo que tiver `conta_id = NULL`

- **Melhoria 6 — i18n (multilíngue):** tabelas `idiomas` e `traducoes`; API `/api/traducoes`; `public/js/i18n.js` com `t(key)` e `translatePage()`. Adoção incremental por data-attributes. Idiomas iniciais: pt_br, en.

### Pendente (outros, fora do plano)
- **Fase 5 completa:** CRUD Administrativo robusto (gestão de usuários, permissões)
- **Fase 7:** App Mobile nativo (React Native / Expo) — offline-first com sincronização avançada
- **Fase 8:** Novos segmentos de checklist (Central de Concreto Usinado, outros)
- **Melhorias PDF:** assinatura digital, marca d'água, geração assíncrona para relatórios grandes
- **Notificações:** push notifications para moradores (perfil `usuario`)

### Workflow de deploy (confirmado em sessão)
- Desenvolvimento em branch feature `claude/...` → merge `--no-ff` para `dev` → push → usuário faz `git pull origin dev` no Replit `vistoria-dev`
- Após validação DEV, user promove `dev → main` e faz `git pull` no Replit produção
- Migrações SQL: usuário roda manualmente no SQL Editor do Supabase DEV antes de testar
- Após alterar schema no Supabase (FKs novas): rodar `NOTIFY pgrst, 'reload schema';` para forçar reload do PostgREST

---

## 12. ARMADILHAS CONHECIDAS (LIÇÕES APRENDIDAS)

### UUIDs sempre válidos
- Seeds SQL devem usar UUIDs reais (`gen_random_uuid()` ou UUIDs fixos no formato correto)
- **NUNCA** usar strings como `'it-001'`, `'area-01'` — causam erros de tipo no Supabase

### Seeds SQL — limite do editor
- O SQL Editor do Supabase tem limite de tamanho
- Sempre quebrar seeds grandes em blocos menores (ex: por segmento ou por tabela)

### Ordem de rotas no app.js
- `fotosRoutes` usa Multer como middleware e deve ser registrado ANTES de `vistoriasRoutes`
- Se a ordem estiver errada, uploads podem falhar silenciosamente

### Content-Type em uploads
- **NUNCA** setar `Content-Type: multipart/form-data` manualmente
- O browser precisa setar com o `boundary` correto — se forçado manualmente, quebra o parse

### Porta no Replit
- Sempre usar `process.env.PORT || 5000`
- O Replit mapeia a porta 5000 externamente; hardcodar outra porta quebra o preview

### PDFKit — páginas extras/fantasma
- **Causa:** `doc.text()` executado quando `doc.y > doc.page.maxY()` auto-cria nova página, mesmo dentro de `switchToPage()`
- **Diagnóstico:** remover texto do rodapé — se páginas extras somem, é o texto do footer
- **Fix:** `doc.page.margins.bottom = 0` antes de escrever no rodapé; restaurar depois
- **Causa raiz:** `margins.bottom` afeta `maxY()`. Com `margins.bottom = PAGE_H - BODY_BOT ≈ 40`, o `maxY()` fica em ~802pt — qualquer texto em y>802 cria nova página

### PDFKit — prefixo duplicado em nomes de área
- Se o nome da área já contém o número (ex: "01 - PRÉDIO"), não adicionar `padStart` prefix
- Verificar o dado real do banco antes de formatar

### Login — campo `nome` ausente
- O Supabase Auth não retorna `nome` nos metadados por padrão
- O campo `nome` vem da tabela `perfis`, não do `user_metadata`
- A rota `/api/auth/login` deve fazer SELECT na tabela `perfis` após autenticar

### Replit — deploy de mudanças
- Após commit/push, o Replit **não aplica automaticamente**
- O usuário deve fazer `git pull` + reiniciar o servidor no Replit manualmente

### Número de ocorrência — sem `#`
- Exibir como "Ocorrência 1" (não "#1" nem "#Ocorrência 1")
- Aplicar tanto na web (`analista/vistoria.html`) quanto no PDF (`relatorios.js`)

### Storage — bucket único `fotos`
- Existe apenas **um** bucket chamado `fotos` (não há bucket `logos`)
- Logos de unidades ficam em `fotos` com prefixo `unidades/{unidade_id}/`
- Fotos de ocorrências ficam em `fotos` com prefixo `ocorrencias/{ocorrencia_id}/`
- O CLAUDE.md anterior mencionava um bucket `logos` separado — isso estava errado

### estrutura_versoes — snapshot imutável
- Ao criar uma vistoria, o sistema vincula automaticamente a última versão de estrutura publicada via `estrutura_versao_id`
- Se não houver versão publicada, `estrutura_versao_id` fica `null` e o checklist usa a estrutura ao vivo
- Essa tabela foi adicionada após as fases iniciais e não constava no CLAUDE.md original

### HTML escape em `onclick` com `JSON.stringify`
- **Bug:** `onclick="editar('${id}', ${JSON.stringify(nome)})"` quebra porque `JSON.stringify` injeta `"` literal que fecha o atributo HTML prematuramente — o onclick vira JS inválido e o clique não dispara
- **Fix:** `${JSON.stringify(nome).replace(/"/g, '&quot;')}` — o HTML parser decodifica `&quot;` → `"` antes do JS rodar
- Sintoma: criar funciona (botão simples) mas editar/excluir não reagem ao clique
- Sempre usar esse padrão em qualquer `onclick` com string do banco

### Supabase — cache de schema PostgREST
- Após criar/alterar FK ou tabela no SQL Editor, o PostgREST mantém schema em cache e pode não reconhecer a nova relação imediatamente
- Sintoma: queries com join (`.select('tabela_fk(col)')`) retornam erro "Could not find relationship in schema cache"
- **Fix:** rodar `NOTIFY pgrst, 'reload schema';` no SQL Editor — reload instantâneo sem reiniciar nada

### Supabase — erro "Auth session missing!"
- **Causa:** JWT do Supabase expira em 1h (default); requisições ao backend chamam `supabase.auth.getUser(token)` que retorna essa mensagem quando o token é inválido/expirado
- Sintoma: usuário trabalha por um tempo, aí de repente alguma rota retorna esse erro enquanto outras já-carregadas seguem OK
- **Fix imediato:** logout + login renova o token
- **Fix definitivo (futuro):** implementar `supabase.auth.refreshSession()` no frontend, ou aumentar JWT expiry no Supabase Dashboard (Authentication → Settings)

### Replit — Preview às vezes mostra "Start application artifact encountered an error"
- Nem sempre o servidor está caído — o Preview do Replit é flaky e pode perder conexão com o processo Node saudável
- Sempre confirmar na aba **Console** se aparece `✅ Servidor rodando na porta 5000` antes de assumir crash
- Alternativa: acessar direto pela URL pública `{...}.replit.dev` mostrada no topo do Console

### GET /api/vistorias/:id — resposta diferente dos demais endpoints
- **Todos** os endpoints retornam `{ ok: true, data: {...} }`, **exceto** `GET /api/vistorias/:id`
- Esse endpoint retorna `{ vistoria: { ...data, ocorrencias: [...] } }` (formato legado)
- Sintoma: `rv.data` é `undefined` ao chamar `vistorias.detalhe(id)` — usar `rv.vistoria` 
- Não corrigir o formato do endpoint para não quebrar `analista/vistoria.html` que já depende de `rv.vistoria`
