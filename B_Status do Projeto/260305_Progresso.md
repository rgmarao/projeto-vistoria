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