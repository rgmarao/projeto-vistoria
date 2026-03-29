# PROJECT_CONTEXT.md — Sistema de Vistoria Online

## Stack
- **Runtime:** Node.js com ES Modules (`import/export`)
- **Framework:** Express.js
- **Banco de dados:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT via Bearer token)
- **Upload:** Multer (memória) + Supabase Storage (bucket: `fotos`)
- **Porta:** 5000 (env: PORT)
- **Ambiente:** process.env.NODE_ENV

## Estrutura de Arquivos
```
/
├── index.js                  # Entry point — inicia o servidor
├── public/
│   └── test.html
└── src/
    ├── app.js                # Express config, middlewares globais, registro de rotas
    ├── config/
    │   └── supabase.js       # Cliente Supabase (export: { supabase })
    ├── middlewares/
    │   └── auth.js           # requireAuth — valida Bearer JWT via supabase.auth.getUser()
    └── routes/
        ├── auth.js           # Montado em /api/auth
        ├── vistorias.js      # Montado em /api/vistorias
        ├── ocorrencias.js    # Montado em /api
        ├── fotos.js          # Montado em /api  ← ANTES de vistorias (evita conflito multer)
        └── areas.js          # Montado em /api
```

## ⚠️ Problema conhecido no app.js
`app.js` contém um `app.listen()` duplicado — o listen correto está no `index.js`.
**Remover** o `app.listen` e a constante `PORT` do `app.js`.

## Variáveis de Ambiente (.env)
```
SUPABASE_URL=
SUPABASE_KEY=
PORT=5000
NODE_ENV=development
```

## Middleware de Auth
- **Arquivo:** `src/middlewares/auth.js`
- **Export:** `requireAuth`
- **Funcionamento:** Lê `Authorization: Bearer <token>`, valida via `supabase.auth.getUser(token)`, injeta `req.user`
- **req.user contém:** `id`, `email`, `user_metadata` (nome, role)

## Perfis de Usuário (tabela `perfis`)
| Perfil | Permissões |
|--------|-----------|
| `admin` | Tudo |
| `analista` | Criar/finalizar/publicar vistorias |
| `usuario` | Ver apenas vistorias `publicadas` das suas unidades |

## Tabelas do Banco (Supabase)
| Tabela | Campos relevantes |
|--------|-------------------|
| `perfis` | id, nome, perfil (admin\|analista\|usuario) |
| `unidades` | id, nome, endereco, logo_url |
| `usuario_unidades` | usuario_id, unidade_id |
| `vistorias` | id, unidade_id, criado_por, status (em_andamento\|finalizada\|publicada), data_criacao, data_finalizacao, data_publicacao, atualizado_em |
| `ocorrencias` | id, vistoria_id, area_id, item_id, numero_ocorrencia, descricao, status (sem_status\|amarelo\|vermelho), recomendacao, foto_1_url, foto_2_url, origem (web\|mobile), criado_em, atualizado_em |
| `areas` | id, unidade_id, nome, ordem, ativo |
| `itens_verificacao` | id, descricao, ativo |
| `area_itens` | id, area_id, item_id, ordem |

## Mapa Completo de Rotas

### AUTH — `/api/auth`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/auth/login` | ❌ | Login email+senha → retorna token |
| `POST` | `/api/auth/logout` | ✅ | Logout |
| `GET` | `/api/auth/me` | ✅ | Dados do usuário logado |
| `POST` | `/api/auth/register` | ❌ | Cadastro (role padrão: vistoriador) |
| `POST` | `/api/auth/reset-password` | ❌ | Envia email de recuperação |

### VISTORIAS — `/api/vistorias`
| Método | Rota | Auth | Perfil | Descrição |
|--------|------|------|--------|-----------|
| `POST` | `/api/vistorias` | ✅ | admin, analista | Cria vistoria |
| `GET` | `/api/vistorias` | ✅ | todos | Lista (filtros por perfil) |
| `GET` | `/api/vistorias/:id` | ✅ | todos | Detalhe + ocorrências |
| `PATCH` | `/api/vistorias/:id/finalizar` | ✅ | admin, analista | em_andamento → finalizada |
| `PATCH` | `/api/vistorias/:id/publicar` | ✅ | admin, analista | finalizada → publicada |

### OCORRÊNCIAS — `/api`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/vistorias/:id/ocorrencias` | ✅ | Cria ocorrência (vistoria deve estar em_andamento) |

### FOTOS — `/api`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/ocorrencias/:id/fotos` | ✅ | Upload foto (form-data: foto + slot 1\|2) |
| `DELETE` | `/api/ocorrencias/:id/fotos/:slot` | ✅ | Remove foto do slot |
| `GET` | `/api/ocorrencias/:id/fotos` | ✅ | Retorna URLs assinadas (1h) |

### ÁREAS/CHECKLIST — `/api`
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/unidades/:id/areas` | ✅ | Lista áreas ativas de uma unidade |
| `GET` | `/api/areas/:id/itens` | ✅ | Lista itens de uma área |
| `GET` | `/api/unidades/:id/checklist` | ✅ | Estrutura completa áreas + itens agrupados |

## Regras de Negócio Importantes
1. Ocorrências só podem ser criadas em vistorias `em_andamento`
2. Fluxo de status: `em_andamento` → `finalizada` → `publicada`
3. Recomendação só é salva se status for `amarelo` ou `vermelho`
4. Fotos: máx 10MB, formatos JPEG/PNG/WEBP, 2 slots por ocorrência
5. Foto antiga é removida do Storage ao fazer upload no mesmo slot
6. Usuário `usuario` só acessa vistorias `publicadas` das suas unidades vinculadas

## Status do Desenvolvimento
- [x] Auth (login, logout, me, register, reset-password)
- [x] CRUD Vistorias (criar, listar, detalhar, finalizar, publicar)
- [x] Ocorrências (criar)
- [x] Upload de fotos (Supabase Storage)
- [x] Áreas e checklist
- [ ] Editar/deletar ocorrência
- [ ] Listar ocorrências de uma vistoria separadamente
- [ ] Frontend integrado
