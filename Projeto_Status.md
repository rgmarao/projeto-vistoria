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
