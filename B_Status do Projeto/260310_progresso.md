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
