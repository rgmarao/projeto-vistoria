PROJETO_STATUS.md
Sistema de Vistoria Online — v1.0
Atualizado em: 16/03/2026 Desenvolvedor: Rogério Marão Stack: Node.js + Express + Supabase (PostgreSQL) + Replit

1. 🛠️ STACK TECNOLÓGICA



Camada	Tecnologia
Plataforma de desenvolvimento	Replit
Backend/API	Node.js + Express
Banco de dados	Supabase (PostgreSQL)
Autenticação	Supabase Auth (JWT)
Frontend Web	A definir
App Mobile	A definir
Armazenamento de fotos	Supabase Storage (bucket: fotos)
2. 📁 ESTRUTURA DE ARQUIVOS


/
├── index.js
├── package.json
├── .env
├── public/
│   └── test.html          ← Atualizado com todas as seções
└── src/
    ├── app.js
    ├── config/
    │   └── supabase.js
    ├── middlewares/
    │   └── auth.js
    └── routes/
        ├── auth.js
        ├── vistorias.js   ← Corrigido: URLs assinadas nas ocorrências
        ├── ocorrencias.js
        ├── areas.js
        └── fotos.js       ← Corrigido: GET retorna { path, url } sempre
3. 🗄️ BANCO DE DADOS — ESTRUTURA REAL
⚠️ Sempre consulte esta seção antes de criar rotas ou debugar erros.

sql


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
   foto_1_url text    -- path no Storage: ocorrencias/{id}/foto_1_xxx.ext
   foto_2_url text    -- path no Storage: ocorrencias/{id}/foto_2_xxx.ext
   origem text        -- ✅ 'vistoria' | 'morador' | 'web' | 'app'
   criado_em timestamptz
   atualizado_em timestamptz
⚠️ Constraints críticas — tabela ocorrencias



Constraint	Valores aceitos
ocorrencias_status_check	'ok', 'atencao', 'critico'
ocorrencias_origem_check	'vistoria', 'morador', 'web', 'app'
area_id	nullable (DROP NOT NULL aplicado em 05/03/2026)
item_id	nullable (DROP NOT NULL aplicado em 05/03/2026)
Para verificar constraints:

sql


SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname LIKE 'ocorrencias_%';
4. 🔑 PADRÃO DE UUIDs ADOTADO



Prefixo	Tabela	Intervalo
00000000-0000-0000-0000-0000000000XX	itens_verificacao	001 a 045
aa000000-0000-0000-0000-0000000000XX	areas	001 a 024
ab000000-0000-0000-0000-0000000000XX	area_itens	001 a 130
1ffd7717-ab3b-4a19-8316-22df785e6158	unidades	Unidade Centro (Aterro)
20000000-0000-0000-0000-000000000001	unidades	Edifício Teste (Mineração/Imobiliário)
⚠️ Manter este padrão para facilitar identificação visual e evitar conflitos em novos seeds.

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
 GET    /api/vistorias/:id → Detalhe completo + URLs assinadas nas ocorrências
 PATCH  /api/vistorias/:id/finalizar → Status → finalizada
 PATCH  /api/vistorias/:id/publicar → Status → publicada
FASE 3 — Rotas de Ocorrências ✅
 POST   /api/vistorias/:id/ocorrencias → Criar ocorrência
 PUT    /api/ocorrencias/:id → Editar ocorrência
 DELETE /api/ocorrencias/:id → Remover ocorrência
 numero_ocorrencia com auto-incremento por vistoria
 test.html atualizado com seção de Ocorrências
FASE 3.5 — Rotas de Áreas e Itens ✅
 GET /api/unidades/:id/areas → Listar áreas de uma unidade
 GET /api/areas/:id/itens → Listar itens de uma área
 GET /api/unidades/:id/checklist → Checklist completo (áreas + itens aninhados)
 Seed executado: 45 itens, 24 áreas, ~130 vínculos (3 segmentos)
FASE 4 — Upload de Fotos ✅
 POST   /api/ocorrencias/:id/fotos → Upload (slot 1 ou 2)
 GET    /api/ocorrencias/:id/fotos → Buscar fotos com URL assinada
 DELETE /api/ocorrencias/:id/fotos/:slot → Remover foto de um slot
 src/routes/fotos.js — multer + memoryStorage + Supabase Storage
 Bug do 404 resolvido — conflito de ordem no app.js corrigido
 fotos.js corrigido: GET sempre retorna { path, url } (nunca null puro)
 vistorias.js corrigido: GET /:id gera foto_1_signed e foto_2_signed nas ocorrências
 test.html atualizado com preview de imagens e grid de slots
 Testado e funcionando 100% via test.html ✅
6. 🔄 ROTAS IMPLEMENTADAS — RESUMO COMPLETO



Método	Rota	Descrição	Status
POST	/api/auth/register	Cadastro de usuário	✅
POST	/api/auth/login	Login + retorna JWT	✅
GET	/api/auth/me	Retorna perfil autenticado	✅
POST	/api/auth/logout	Logout	✅
POST	/api/vistorias	Criar vistoria	✅
GET	/api/vistorias	Listar vistorias	✅
GET	/api/vistorias/:id	Detalhe + ocorrências + fotos assinadas	✅
PATCH	/api/vistorias/:id/finalizar	Finalizar vistoria	✅
PATCH	/api/vistorias/:id/publicar	Publicar vistoria	✅
POST	/api/vistorias/:id/ocorrencias	Criar ocorrência	✅
PUT	/api/ocorrencias/:id	Editar ocorrência	✅
DELETE	/api/ocorrencias/:id	Remover ocorrência	✅
POST	/api/ocorrencias/:id/fotos	Upload foto (slot 1 ou 2)	✅
GET	/api/ocorrencias/:id/fotos	Buscar fotos com URL assinada	✅
DELETE	/api/ocorrencias/:id/fotos/:slot	Remover foto de um slot	✅
GET	/api/unidades/:id/areas	Listar áreas de uma unidade	✅
GET	/api/areas/:id/itens	Listar itens de uma área	✅
GET	/api/unidades/:id/checklist	Checklist completo	✅
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
URL de visualização	Signed URL válida por 1 hora
Relatórios PDF	2 tipos: Completo e Só Pendências
Logo no PDF	Upload no cadastro da Unidade
Offline	App funciona sem internet, sincroniza depois
10. ⏭️ PRÓXIMOS PASSOS
Fase 5 — CRUD Administrativo
 Empresas (listar, criar, editar, desativar)
 Unidades (listar, criar, editar + upload logo)
 Gestão de usuários e vínculos com unidades
Fase 6 — Relatórios PDF
 Definir layout do relatório
 Biblioteca: puppeteer ou pdfkit
 GET /api/vistorias/:id/relatorio
 Relatório completo com fotos e logo
 Relatório de pendências (atencao e critico apenas)
Fase 7 — App Mobile
 Login e seleção de unidade
 Download offline da estrutura
 Preenchimento de ocorrências com fotos
 Fila de sincronização offline
 Assinatura digital do vistoriador
Fase 8 — Novos Segmentos (seed)
 Central de Concreto Usinado (base: planilha RxBRASILIA disponível)
 Outros segmentos a definir
11. ⚠️ LIÇÕES APRENDIDAS
Banco de Dados
UUIDs obrigatoriamente válidos — strings como 'it-001' causam erro 22P02. Usar formato 00000000-0000-0000-0000-000000000001.
Seeds em blocos menores — SQL Editor tem limite de caracteres. Blocos grandes são cortados silenciosamente (42601: syntax error at end of input). Solução: dividir em partes (3A, 3B...).
Itens reutilizáveis — separar itens_verificacao de area_itens evita redundância.
Ordem de execução importa — sempre: itens_verificacao → areas → area_itens.
Verificar constraints antes de criar rotas para não perder tempo debugando erros de CHECK.
Backend
Named Export vs Default Export:
javascript


// ✅ Correto
import { requireAuth } from '../middlewares/auth.js';
// ❌ Errado
import authMiddleware from '../middlewares/auth.js';
Porta no Replit — sempre process.env.PORT || 5000. Nunca fixar porta 3000.
"Rota não encontrada" sem crash — suspeitar de conflito entre rotas com parâmetros genéricos (:id). Verificar ordem dos app.use no app.js.
Upload multipart — NÃO definir Content-Type manualmente:
javascript


// ✅ Correto — deixa o browser definir o boundary
headers: { 'Authorization': `Bearer ${token}` }
// ❌ Errado — quebra o multipart/form-data
headers: { 'Content-Type': 'application/json', 'Authorization': ... }
Ordem dos app.use no app.js importa — rotas de fotos (multer) devem ser registradas antes das rotas de vistorias para evitar conflito de body parser.
GET de fotos deve sempre retornar objeto — nunca retornar null diretamente para slots vazios; retornar { path: null, url: null } para o frontend não quebrar.
GET /api/vistorias/:id — gerar foto_1_signed e foto_2_signed nas ocorrências com Promise.all para não bloquear a resposta.
12. 📁 ARQUIVOS DE REFERÊNCIA



Arquivo	Descrição
Exemplo de Áreas e Itens Verificacao.xlsx	Planilha base — Central de Concreto RxBRASILIA
seed_itens_verificacao.sql	Parte 1 — 45 itens de verificação
seed_areas.sql	Parte 2 — 24 áreas (3 segmentos)
seed_area_itens_3a.sql	Parte 3A — vínculos Aterro Sanitário
seed_area_itens_3b.sql	Parte 3B — vínculos Mineração + Imobiliário
13. 🗓️ HISTÓRICO DE SESSÕES



Data	O que foi feito
10/03/2026	Definição dos 3 segmentos (Aterro, Mineração, Imobiliário)
10/03/2026	Estruturação de áreas e itens com base na planilha de referência
10/03/2026	Execução completa do seed (Partes 1, 2, 3A e 3B)
10/03/2026	Correção erro UUID inválido e SQL truncado
11/03/2026	Fase 4 implementada: fotos.js + 3 rotas de upload/busca/delete
11/03/2026	test.html atualizado com seção completa de Upload de Fotos
11/03/2026	Bug identificado: POST /api/ocorrencias/:id/fotos retornava 404
11/03/2026	Diagnóstico: conflito de ordem no app.js — fotosRoutes movido para antes de vistoriasRoutes
16/03/2026	Bug do 404 resolvido — confirmado via test.html
16/03/2026	fotos.js corrigido: GET sempre retorna { path, url } nos dois slots
16/03/2026	vistorias.js corrigido: GET /:id inclui foto_1_signed e foto_2_signed nas ocorrências
16/03/2026	Fase 4 testada e aprovada 100% via test.html ✅
16/03/2026	PROJETO_STATUS.md consolidado — histórico unificado