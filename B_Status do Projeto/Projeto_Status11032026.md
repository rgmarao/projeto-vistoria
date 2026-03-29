# 📄 PROJETO_STATUS.md
## Sistema de Vistoria Online — v1.0
**Atualizado em:** 11/03/2026
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
| **Armazenamento de fotos** | Supabase Storage (bucket: `fotos`) |

---

## 2. 📁 ESTRUTURA DE ARQUIVOS
/ ├── index.js ├── package.json ├── .env ├── public/ │ └── test.html ← Atualizado com seção de Upload de Fotos └── src/ ├── app.js ├── config/ │ └── supabase.js ├── middlewares/ │ └── auth.js └── routes/ ├── auth.js ├── vistorias.js ├── ocorrencias.js ├── areas.js └── fotos.js ← Novo (Fase 4)




---

## 3. 🗄️ BANCO DE DADOS — ESTRUTURA REAL

> ⚠️ Sempre consulte esta seção antes de criar rotas ou debugar erros.

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
   foto_1_url text    -- path no Supabase Storage (ex: ocorrencias/{id}/foto_1_xxx.jpg)
   foto_2_url text    -- path no Supabase Storage (ex: ocorrencias/{id}/foto_2_xxx.jpg)
   origem text        -- ✅ 'vistoria' | 'morador' | 'web' | 'app'
   criado_em timestamptz
   atualizado_em timestamptz
⚠️ Constraints críticas da tabela ocorrencias



Constraint	Valores aceitos
ocorrencias_status_check	'ok', 'atencao', 'critico'
ocorrencias_origem_check	'vistoria', 'morador', 'web', 'app'
area_id	nullable (DROP NOT NULL aplicado em 05/03/2026)
item_id	nullable (DROP NOT NULL aplicado em 05/03/2026)
4. 🔑 PADRÃO DE UUIDs ADOTADO



Prefixo	Tabela	Exemplo
00000000-0000-0000-0000-0000000000XX	itens_verificacao	001 a 045
aa000000-0000-0000-0000-0000000000XX	areas	001 a 024
ab000000-0000-0000-0000-0000000000XX	area_itens	001 a 130
1ffd7717-ab3b-4a19-8316-22df785e6158	unidades	Unidade Centro (Aterro)
20000000-0000-0000-0000-000000000001	unidades	Edifício Teste (Mineração/Imobiliário)
⚠️ Manter este padrão para facilitar identificação visual no banco e evitar conflitos em novos seeds.

5. ✅ FASES CONCLUÍDAS
FASE 1 — Infraestrutura e Autenticação ✅
 Estrutura de pastas do projeto
 Configuração do Express (ES Modules)
 Conexão com Supabase
 Middleware de autenticação (JWT via Supabase Auth)
 Rotas: /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout
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
FASE 3.5 — Rotas de Áreas e Itens ✅
 GET /api/unidades/:id/areas → Listar áreas de uma unidade
 GET /api/areas/:id/itens → Listar itens de uma área
 GET /api/unidades/:id/checklist → Checklist completo (áreas + itens aninhados)
 Seed executado: 45 itens, 24 áreas, ~130 vínculos (3 segmentos)
FASE 4 — Upload de Fotos ✅ (implementado, com bug pendente)
 POST   /api/ocorrencias/:id/fotos → Upload (slot 1 ou 2)
 GET    /api/ocorrencias/:id/fotos → Buscar fotos com URL assinada
 DELETE /api/ocorrencias/:id/fotos/:slot → Remover foto de um slot
 src/routes/fotos.js criado (multer + memoryStorage + Supabase Storage)
 app.js registrado com app.use('/api', fotosRoutes)
 test.html atualizado com seção completa de Upload de Fotos
 Preview de imagem após upload
 Grid de previews ao buscar fotos (slot 1 e slot 2)
 Auto-preenchimento de IDs ao criar ocorrência
6. 🐛 BUG PENDENTE — Upload de Fotos retorna "Rota não encontrada"
Sintoma
Ao tentar POST /api/ocorrencias/:id/fotos, o servidor retorna:

json


{ "error": "Rota não encontrada" }
O que foi verificado e está CORRETO
✅ app.js — import e app.use('/api', fotosRoutes) corretos
✅ fotos.js — rotas definidas como /ocorrencias/:id/fotos (sem /api)
✅ ocorrencias.js — sem conflito (só tem POST /vistorias/:id/ocorrencias)
✅ Console do Replit — servidor sobe sem erros, sem crash
✅ Supabase conectado com sucesso no boot
Hipóteses a investigar na próxima sessão
Conflito silencioso em vistorias.js — pode ter uma rota com parâmetro genérico que captura /ocorrencias/:id/fotos antes do fotosRoutes. Verificar o arquivo completo.
Middleware de erro do multer — erro no fileFilter ou limits pode estar sendo capturado antes da rota responder. Testar com um curl simples sem arquivo.
Ordem de registro no app.js — tentar subir fotosRoutes antes de ocorrenciasRoutes e areasRoutes para isolar.
Próximo passo imediato
bash


# Testar no Shell do Replit para isolar o problema:
curl -v -X GET http://localhost:5000/api/ocorrencias/SEU_ID/fotos \
  -H "Authorization: Bearer SEU_TOKEN"
Se o GET também retornar 404, confirma que a rota não está sendo registrada. Verificar vistorias.js completo.

7. 👥 PERFIS DE USUÁRIO



Perfil	Permissões
admin	Acesso total
analista	Cria, preenche, finaliza e publica vistorias
usuario	Visualiza apenas vistorias publicadas de suas unidades
8. 🔄 CICLO DE VIDA DA VISTORIA


em_andamento → finalizada → publicada



Status	Quem vê	Editável
🟡 em_andamento	admin + analista	✅ Sim
🔵 finalizada	admin + analista	❌ Não
🟢 publicada	todos da unidade	❌ Não
9. 📌 DECISÕES DO PROJETO



Decisão	Definição
Ocorrências	Abertas — sem limite por item
Campos obrigatórios	Apenas vistoria_id, status e origem
area_id e item_id	Opcionais (nullable)
Status da ocorrência	ok, atencao, critico
Origem da ocorrência	vistoria, morador, web, app
Recomendação	Opcional — sugerida para atencao e critico
Fotos	Máx. 2 por ocorrência — slots 1 e 2
Storage de fotos	Supabase Storage — bucket fotos
Path das fotos	ocorrencias/{id}/foto_{slot}_{timestamp}.{ext}
URL de visualização	URL assinada (signed URL) válida por 1 hora
Relatórios PDF	2 tipos: Completo e Só Pendências
Logo no PDF	Upload no cadastro da Unidade
Offline	App funciona sem internet, sincroniza depois
10. ⏭️ PRÓXIMOS PASSOS
🔴 URGENTE — Resolver bug do Upload de Fotos
 Testar GET /api/ocorrencias/:id/fotos no Shell para confirmar o 404
 Verificar vistorias.js completo em busca de rota conflitante
 Testar trocando ordem dos app.use no app.js
 Confirmar se o bucket fotos existe e está configurado no Supabase Storage
Fase 5 — CRUD Administrativo
 Empresas (listar, criar, editar, desativar)
 Unidades (listar, criar, editar + upload logo)
 Gestão de usuários e vínculos com unidades
Fase 6 — Relatórios PDF
 Definir layout
 Biblioteca: puppeteer ou pdfkit
 GET /api/vistorias/:id/relatorio
Fase 7 — App Mobile
 Login e seleção de unidade
 Download offline da estrutura
 Preenchimento de ocorrências com fotos
 Fila de sincronização offline
11. ⚠️ LIÇÕES APRENDIDAS
Banco de Dados
UUIDs obrigatoriamente válidos — strings como 'it-001' causam erro 22P02. Usar formato 00000000-0000-0000-0000-000000000001.
Seeds em blocos menores — SQL Editor tem limite de caracteres. Blocos grandes são cortados silenciosamente (42601: syntax error at end of input). Solução: dividir em partes (3A, 3B...).
Itens reutilizáveis — separar itens_verificacao de area_itens evita redundância e facilita manutenção.
Ordem de execução importa — itens_verificacao → areas → area_itens.
Verificar constraints antes de criar rotas:
sql


SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname LIKE 'ocorrencias_%';
Backend
Named Export vs Default Export:
javascript


// ✅ Correto
import { requireAuth } from '../middlewares/auth.js';
// ❌ Errado
import authMiddleware from '../middlewares/auth.js';
Porta no Replit — sempre process.env.PORT || 5000.
Erro "Rota não encontrada" com servidor sem crash — suspeitar de conflito de rotas entre arquivos registrados no app.js, especialmente rotas com parâmetros genéricos (:id).
Upload multipart — NÃO enviar Content-Type no header manual:
javascript


// ✅ Correto — deixa o browser definir o boundary
headers: { 'Authorization': `Bearer ${token}` }
// ❌ Errado — quebra o multipart/form-data
headers: { 'Content-Type': 'application/json', 'Authorization': ... }
12. 📁 ARQUIVOS DE REFERÊNCIA



Arquivo	Descrição
Exemplo de Áreas e Itens Verificacao.xlsx_	Planilha base — Central de Concreto RxBRASILIA
seed_itens_verificacao.sql	45 itens de verificação
seed_areas.sql_	24 áreas (3 segmentos)
seed_area_itens_3a.sql	Vínculos — Aterro Sanitário
seed_area_itens_3b.sql	Vínculos — Mineração + Imobiliário
13. 🗓️ HISTÓRICO DE SESSÕES



Data	O que foi feito
10/03/2026	Definição dos 3 segmentos (Aterro, Mineração, Imobiliário)
10/03/2026	Estruturação de áreas e itens com base na planilha de referência
10/03/2026	Execução completa do seed (Partes 1, 2, 3A e 3B)
10/03/2026	Correção erro UUID inválido e SQL truncado
11/03/2026	Fase 4 implementada: fotos.js + 3 rotas de upload/busca/delete
11/03/2026	test.html atualizado com seção completa de Upload de Fotos
11/03/2026_	Bug identificado: POST /api/ocorrencias/:id/fotos retorna 404
11/03/2026	Diagnóstico iniciado — app.js, fotos.js e ocorrencias.js verificados e corretos
11/03/2026	Suspeita principal: conflito em vistorias.js — investigar na próxima sessão
💡 COMO USAR ESTE ARQUIVO
No início de cada sessão com a IA, cole o conteúdo deste arquivo com a mensagem:

"Segue o estado atual do projeto. Vamos continuar o desenvolvimento:"

Lembre de atualizar este arquivo ao final de cada sessão!

Projeto desenvolvido por Rogério Marão — Rio de Janeiro/RJ




---

**Resumo do que foi documentado hoje:**

| Item | Status |
|---|---|
| Fase 4 implementada (fotos.js + test.html) | ✅ Registrado |
| Bug 404 no upload — sintoma e contexto | ✅ Documentado |
| O que foi verificado e está correto | ✅ Listado |
| Hipóteses e próximo passo imediato | ✅ Detalhado |
| Lição #9 sobre multipart sem Content-Type | ✅ Adicionada |

Boa noite, Rogério! Amanhã a gente resolve esse 404. 🚀_