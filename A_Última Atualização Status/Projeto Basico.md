Planejamento Final — Sistema de Vistoria Completo
Perfeito, Rogério! Agora temos o quadro completo. Vou consolidar tudo com as definições finais.

👥 Os 3 Tipos de Usuário


┌─────────────────────────────────────────────────────────────┐
│  👑 ADMINISTRADOR                                            │
│  ─────────────────────────────────────────────────────────  │
│  ✅ Cadastra empresas e unidades (com logo)                 │
│  ✅ Cadastra áreas e itens de verificação                   │
│  ✅ Monta a estrutura das vistorias por unidade             │
│  ✅ Gerencia usuários e define quem acessa o quê            │
│  ✅ Acesso total ao sistema                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔍 ANALISTA                                                 │
│  ─────────────────────────────────────────────────────────  │
│  ✅ Cria novas vistorias (app ou web)                       │
│  ✅ Preenche vistorias no campo (app)                       │
│  ✅ Edita e completa vistorias na web                       │
│  ✅ Finaliza e publica vistorias                            │
│  ✅ Gera relatórios PDF                                     │
│  ❌ Não gerencia estrutura nem usuários                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  👁️ USUÁRIO (Visualizador)                                   │
│  ─────────────────────────────────────────────────────────  │
│  ✅ Visualiza vistorias PUBLICADAS de suas unidades         │
│  ✅ Baixa relatórios PDF                                    │
│  ❌ Não edita, não cria, não publica                        │
└─────────────────────────────────────────────────────────────┘
🔄 Ciclo de Vida de uma Vistoria


           CRIADA
          (app ou web)
              │
              ▼
        EM ANDAMENTO  ◄──────────────────────────┐
              │                                   │
              │  Analista preenche no campo       │
              │  (app, offline)                   │
              │                                   │
              ▼                                   │
      SINCRONIZADA / RECEBIDA                     │
      (chegou na web)                             │
              │                                   │
              │  Analista revisa e completa       │
              │  na web (se necessário)           │
              │                                   │ pode reabrir
              ▼                                   │
          FINALIZADA ──────────────────────────────┘
              │
              │  Analista decide publicar
              │
              ▼
          PUBLICADA
     (usuário comum pode ver)
💡 Uma vistoria finalizada ainda não está visível para o usuário comum. Só após a publicação ele tem acesso. Isso dá ao analista a chance de revisar tudo antes de liberar.

📋 Status das Vistorias — Resumo Visual



Status	Quem vê	Quem pode editar	Descrição
🟡 Em andamento	Admin + Analista	Admin + Analista	Sendo preenchida no campo ou na web
🔵 Finalizada	Admin + Analista	Não (bloqueada)	Revisada, aguardando publicação
🟢 Publicada	Todos	Não (bloqueada)	Visível ao usuário comum
📱 Fluxo Revisado no App (Campo)
O que o Analista pode fazer no app:


Login
  ↓
Tela inicial — lista as Unidades vinculadas ao seu perfil
  ↓
Seleciona uma Unidade
  ↓
App baixa a estrutura completa da unidade
(áreas, itens, ocorrências pré-existentes)
  ↓
╔══════════════════════════════════╗
║   O que você quer fazer?         ║
║                                  ║
║  [+ Nova Vistoria]               ║
║  [📋 Vistorias em andamento: 2]  ║
╚══════════════════════════════════╝
  ↓
Entra na vistoria → seleciona Área → seleciona Item
  ↓
  ┌──────────────────────────────────────┐
  │  ITEM: Extintor de incêndio          │
  │  ────────────────────────────────    │
  │  OCORRÊNCIA 1                        │
  │  [📝 Descrição...................]   │
  │                                      │
  │  Status:                             │
  │  ○ 🟢 Verde                         │
  │  ○ 🟡 Amarelo                       │
  │  ○ 🔴 Vermelho                      │
  │                                      │
  │  [📷 Foto 1]  [📷 Foto 2]          │
  │                                      │
  │  ← só aparece se 🟡 ou 🔴: →       │
  │  [💬 Recomendação.................]  │
  │                                      │
  │  [+ Adicionar Ocorrência]            │
  └──────────────────────────────────────┘
  ↓
Adiciona quantas ocorrências quiser
  ↓
Volta para lista de itens — item marcado como ✓ visitado
  ↓
Continua pelos demais itens e áreas
  ↓
[Enviar Vistoria] — faz fila para sincronizar
  ↓
Quando conectar à internet → sincroniza automaticamente
Status na web passa para "Em andamento" (recebida)
🖥️ Fluxo Revisado na Web
Visão do Analista:


Painel Web
  ↓
Lista de Vistorias:
┌────────────────────────────────────────────────────────────┐
│  Unidade ABC | 23/02/2026 | João Silva   🟡 Em andamento  │
│  Unidade XYZ | 20/02/2026 | Maria Lima   🔵 Finalizada    │
│  Unidade ABC | 15/02/2026 | João Silva   🟢 Publicada     │
└────────────────────────────────────────────────────────────┘
  ↓
Abre a vistoria "Em andamento"
  ↓
Pode:
  ✏️ Completar itens não preenchidos no campo
  ✏️ Adicionar novas ocorrências
  ✏️ Editar descrições e recomendações
  📷 Adicionar fotos via upload (na web)
  ↓
Quando satisfeito:
  [✅ Finalizar Vistoria] → status vai para "Finalizada"
  ↓
  [🟢 Publicar] → status vai para "Publicada"
                → usuários comuns da unidade passam a ver
  ↓
  [📄 Gerar Relatório Completo PDF]
  [⚠️ Gerar Relatório de Pendências PDF] (só 🟡 e 🔴)
📄 Os Dois Relatórios PDF
Relatório Completo


[LOGO DA UNIDADE]
RELATÓRIO DE VISTORIA — COMPLETO
Unidade: ABC | Data: 23/02/2026 | Responsável: João Silva

📍 ÁREA: Almoxarifado
  Item: Extintor de incêndio
    Ocorrência 1: 🟢 Verde
    Descrição: Extintor porta A
    [Foto 1] [Foto 2]

    Ocorrência 2: 🟡 Amarelo
    Descrição: Extintor porta B
    [Foto 1] [Foto 2]
    Recomendação: Verificar validade

  Item: Sinalização de emergência
    Ocorrência 1: 🟢 Verde
    Descrição: Placa corredor principal
    [Foto 1]
...

RESUMO GERAL:
  🟢 Verde: 18 ocorrências (72%)
  🟡 Amarelo: 5 ocorrências (20%)
  🔴 Vermelho: 2 ocorrências (8%)
Relatório de Pendências (só 🟡 e 🔴)


[LOGO DA UNIDADE]
RELATÓRIO DE PENDÊNCIAS — PLANO DE AÇÃO
Unidade: ABC | Data: 23/02/2026

⚠️ OCORRÊNCIAS QUE EXIGEM ATENÇÃO

📍 ÁREA: Almoxarifado
  🟡 Item: Extintor | Ocorrência 2
  Descrição: Extintor porta B
  [Foto 1] [Foto 2]
  Recomendação: Verificar validade

📍 ÁREA: Produção
  🔴 Item: EPI | Ocorrência 1
  Descrição: Capacete danificado
  [Foto 1]
  Recomendação: Substituir imediatamente — CRÍTICO

RESUMO DE PENDÊNCIAS:
  🟡 Atenção: 5 itens
  🔴 Crítico: 2 itens
  Total de ações necessárias: 7
🗄️ Banco de Dados — Versão Final


📦 Empresas
   id | nome | logo_url | cnpj | ativo

📦 Unidades
   id | empresa_id | nome | endereço | logo_url | ativo

📦 Áreas
   id | unidade_id | nome | ordem | ativo

📦 Itens de Verificação (biblioteca reutilizável)
   id | descrição | ativo

📦 Área_Item (associação: qual item pertence a qual área)
   id | area_id | item_id | ordem

📦 Usuários
   id | nome | email | senha_hash | perfil (admin/analista/usuario)

📦 Usuário_Unidade (quais unidades cada usuário acessa)
   id | usuario_id | unidade_id

📦 Vistorias
   id | unidade_id | criado_por (usuario_id) | data_criacao
      | data_finalizacao | data_publicacao
      | status: em_andamento / finalizada / publicada

📦 Ocorrências (coração do sistema)
   id | vistoria_id | area_id | item_id
      | numero_ocorrencia
      | descricao (texto livre, não obrigatório)
      | status: verde / amarelo / vermelho / sem_status
      | recomendacao (só para 🟡 e 🔴, não obrigatório)
      | foto_1_url | foto_2_url
      | criado_em | atualizado_em
      | origem: app / web
📷 Fotos — Compressão e Armazenamento


NO APP (antes de salvar localmente):
  Usuário tira a foto com a câmera
          ↓
  App comprime automaticamente
  (ex: reduz de 4MB para ~300KB)
  mantendo qualidade visual aceitável
          ↓
  Salva localmente no celular (offline)
          ↓
  Quando sincroniza:
  Envia a foto comprimida para
  armazenamento na nuvem (tipo "pasta na nuvem")
          ↓
  Banco de dados guarda apenas
  o endereço/link da foto
  (ex: storage.seuapp.com/fotos/abc123.jpg)
🔐 Controle de Acesso — Quem Vê o Quê



Funcionalidade	Admin	Analista	Usuário
Cadastrar empresas/unidades	✅	❌	❌
Montar estrutura de vistoria	✅	❌	❌
Gerenciar usuários	✅	❌	❌
Criar nova vistoria	✅	✅	❌
Preencher vistoria (app)	✅	✅	❌
Editar vistoria na web	✅	✅	❌
Finalizar vistoria	✅	✅	❌
Publicar vistoria	✅	✅	❌
Gerar PDF	✅	✅	✅ (só publicadas)
Ver vistorias publicadas	✅	✅	✅ (só suas unidades)
Ver vistorias em andamento	✅	✅	❌
🗓️ Roadmap de Desenvolvimento


FASE 1 — Fundação (Semana 1)
  ☐ Criar banco de dados com todas as tabelas
  ☐ Definir sistema de login e perfis de usuário
  ☐ Criar estrutura do projeto (web + app)

FASE 2 — Web: Área do Administrador (Semana 2)
  ☐ Tela de cadastro de empresas (com upload de logo)
  ☐ Tela de cadastro de unidades (com upload de logo)
  ☐ Tela de cadastro de áreas
  ☐ Biblioteca de itens de verificação
  ☐ Montagem do checklist por área
  ☐ Gerenciamento de usuários e vínculos com unidades

FASE 3 — App: Campo (Semana 3)
  ☐ Login e seleção de unidade
  ☐ Download offline da estrutura
  ☐ Tela de vistoria com áreas e itens
  ☐ Tela de ocorrência (descrição + status + fotos + recomendação)
  ☐ Adição dinâmica de ocorrências
  ☐ Compressão automática de fotos
  ☐ Fila de sincronização offline

FASE 4 — Web: Área do Analista (Semana 4)
  ☐ Lista de vistorias com filtros por status
  ☐ Tela de revisão e edição de vistoria
  ☐ Botões de Finalizar e Publicar
  ☐ Controle de acesso por perfil

FASE 5 — Relatórios PDF (Semana 5)
  ☐ Relatório completo com fotos e logo
  ☐ Relatório de pendências (🟡 e 🔴 apenas)

FASE 6 — Testes e Ajustes (Semana 6)
  ☐ Testes no iPhone e Android
  ☐ Testes offline + sincronização
  ☐ Ajustes de performance e segurança
  ☐ Treinamento dos usuários
✅ Resumo das Decisões Tomadas



Decisão	Definição
Ocorrências	Abertas — usuário adiciona quantas quiser
Campos obrigatórios	Nenhum — total flexibilidade
Recomendação	Aparece apenas para 🟡 e 🔴
Edição na web	Analista pode completar o que o campo não preencheu
Status de vistoria	Em andamento → Finalizada → Publicada
Usuários	3 perfis: Admin, Analista, Usuário
Relatórios	2 PDFs: Completo e Pendências
Fotos	Comprimidas no app antes do envio
Logo no PDF	Upload no cadastro da Unidade
🎯 O planejamento está completo e consistente. O próximo passo natural seria desenhar as telas (wireframes) antes de iniciar o desenvolvimento. Quer que eu descreva como cada tela deveria ser organizada visualmente?



sim
Claude Sonnet 4.6
Wireframes Descritivos — Tela por Tela
Vou descrever cada tela como se você estivesse olhando para ela, Rogério. Pense nisso como um "roteiro visual" para passar para um desenvolvedor ou designer.

🌐 WEB — Área do Administrador
Tela 1 — Login


┌─────────────────────────────────────────────┐
│                                             │
│           [LOGO DO SISTEMA]                 │
│                                             │
│         Sistema de Vistorias               │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │  📧 E-mail                          │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │  🔒 Senha                           │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   [        ENTRAR        ]                  │
│                                             │
│   Esqueci minha senha                       │
│                                             │
└─────────────────────────────────────────────┘
Notas:

Tela simples, sem cadastro público
Apenas Admin pode criar novos usuários
"Esqueci minha senha" envia e-mail de recuperação
Tela 2 — Painel Principal (Dashboard)


┌──────────────────────────────────────────────────────────────┐
│  [LOGO]  Sistema de Vistorias          👤 João (Admin)  Sair │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  MENU LATERAL          │  CONTEÚDO PRINCIPAL                │
│  ──────────────────    │  ─────────────────────────────     │
│  🏢 Empresas           │                                    │
│  🏭 Unidades           │  BOM DIA, JOÃO!                    │
│  📍 Áreas              │                                    │
│  ✅ Itens              │  ┌──────────┐  ┌──────────┐        │
│  👥 Usuários           │  │    12    │  │    3     │        │
│  ──────────────────    │  │Vistorias │  │Pendentes │        │
│  📋 Vistorias          │  │no mês    │  │revisão   │        │
│  📊 Relatórios         │  └──────────┘  └──────────┘        │
│                        │                                    │
│                        │  ┌──────────┐  ┌──────────┐        │
│                        │  │    5     │  │    8     │        │
│                        │  │Empresas  │  │Unidades  │        │
│                        │  │ativas    │  │ativas    │        │
│                        │  └──────────┘  └──────────┘        │
│                        │                                    │
│                        │  ÚLTIMAS VISTORIAS                 │
│                        │  ┌──────────────────────────────┐  │
│                        │  │ Unid. ABC | 23/02 | 🟡 And. │  │
│                        │  │ Unid. XYZ | 20/02 | 🟢 Pub. │  │
│                        │  │ Unid. ABC | 15/02 | 🔵 Fin. │  │
│                        │  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
Notas:

Menu lateral fixo em todas as telas da web
Cards de resumo numérico no topo
Lista das vistorias mais recentes
Tela 3 — Cadastro de Empresas


┌──────────────────────────────────────────────────────────────┐
│  MENU  │  🏢 EMPRESAS                    [+ Nova Empresa]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔍 Buscar empresa...                                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [LOGO]  Empresa Alpha Ltda                            │ │
│  │          CNPJ: 00.000.000/0001-00    ✅ Ativa          │ │
│  │          3 unidades                                    │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  [LOGO]  Empresa Beta S/A                              │ │
│  │          CNPJ: 11.111.111/0001-11    ✅ Ativa          │ │
│  │          1 unidade                                     │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
Modal "Nova Empresa" (abre ao clicar no botão):



┌───────────────────────────────────────┐
│  NOVA EMPRESA                     ✕  │
│  ─────────────────────────────────   │
│  Nome da empresa                      │
│  [________________________________]  │
│                                       │
│  CNPJ                                 │
│  [________________________________]  │
│                                       │
│  Logo da empresa                      │
│  [📎 Clique para fazer upload]        │
│  (JPG, PNG — máx. 2MB)               │
│                                       │
│  Status:  ● Ativa  ○ Inativa         │
│                                       │
│  [Cancelar]        [💾 Salvar]        │
└───────────────────────────────────────┘
Tela 4 — Cadastro de Unidades


┌──────────────────────────────────────────────────────────────┐
│  MENU  │  🏭 UNIDADES                    [+ Nova Unidade]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Filtrar por empresa: [Todas ▼]    🔍 Buscar unidade...     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [LOGO]  Unidade Centro — SP                          │ │
│  │          Empresa: Alpha Ltda                           │ │
│  │          Endereço: Rua X, 100 — São Paulo/SP          │ │
│  │          2 áreas configuradas                         │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  [LOGO]  Unidade Norte — RJ                           │ │
│  │          Empresa: Alpha Ltda                           │ │
│  │          Endereço: Av. Y, 200 — Rio de Janeiro/RJ     │ │
│  │          4 áreas configuradas                         │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
Modal "Nova Unidade":



┌───────────────────────────────────────┐
│  NOVA UNIDADE                     ✕  │
│  ─────────────────────────────────   │
│  Empresa                              │
│  [Selecione a empresa ▼]             │
│                                       │
│  Nome da unidade                      │
│  [________________________________]  │
│                                       │
│  Endereço                             │
│  [________________________________]  │
│                                       │
│  Logo da unidade (usado no PDF)      │
│  [📎 Clique para fazer upload]        │
│                                       │
│  [Cancelar]        [💾 Salvar]        │
└───────────────────────────────────────┘
Tela 5 — Biblioteca de Itens de Verificação


┌──────────────────────────────────────────────────────────────┐
│  MENU  │  ✅ ITENS DE VERIFICAÇÃO          [+ Novo Item]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔍 Buscar item...                                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  #001  Extintor de incêndio                            │ │
│  │        Usado em 4 áreas diferentes                     │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  #002  Sinalização de emergência                       │ │
│  │        Usado em 6 áreas diferentes                     │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  #003  Piso limpo e seco                               │ │
│  │        Usado em 3 áreas diferentes                     │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
Notas:

Esta é a biblioteca central — itens cadastrados aqui podem ser reaproveitados em qualquer área
Mostra em quantas áreas cada item está sendo usado
Tela 6 — Montagem da Estrutura de Vistoria
Esta é a tela mais importante para o Admin. Aqui ele define quais itens fazem parte de cada área de cada unidade.



┌──────────────────────────────────────────────────────────────┐
│  MENU  │  📐 ESTRUTURA DE VISTORIA                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Empresa: [Alpha Ltda ▼]    Unidade: [Unidade Norte — RJ ▼] │
│                                                              │
│  ÁREAS DESTA UNIDADE              [+ Adicionar Área]        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📍 Almoxarifado                   [✏️] [🗑️]        │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Itens desta área:                                  │   │
│  │                                                     │   │
│  │    1. Extintor de incêndio         [↑][↓] [🗑️]     │   │
│  │    2. Sinalização de emergência    [↑][↓] [🗑️]     │   │
│  │    3. Piso limpo e seco            [↑][↓] [🗑️]     │   │
│  │                                                     │   │
│  │    [+ Adicionar item a esta área]                   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  📍 Refeitório                     [✏️] [🗑️]        │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Itens desta área:                                  │   │
│  │                                                     │   │
│  │    1. Piso limpo e seco            [↑][↓] [🗑️]     │   │
│  │    2. Higiene dos equipamentos     [↑][↓] [🗑️]     │   │
│  │                                                     │   │
│  │    [+ Adicionar item a esta área]                   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
Modal "Adicionar item à área":



┌──────────────────────────────────────────┐
│  ADICIONAR ITEM — Almoxarifado       ✕  │
│  ──────────────────────────────────────  │
│                                          │
│  🔍 Buscar na biblioteca...             │
│                                          │
│  ☐  Extintor de incêndio  (já adicionado)│
│  ☐  Sinalização de emergência  (já add.) │
│  ☑  EPI dos funcionários                │
│  ☑  Condição das prateleiras            │
│  ☐  Piso limpo e seco  (já adicionado)  │
│                                          │
│  Não encontrou?                          │
│  [+ Criar novo item]                     │
│                                          │
│  [Cancelar]    [✅ Adicionar Selecionados]│
└──────────────────────────────────────────┘
Tela 7 — Gerenciamento de Usuários


┌──────────────────────────────────────────────────────────────┐
│  MENU  │  👥 USUÁRIOS                    [+ Novo Usuário]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  👑 João Silva          joao@email.com   Administrador │ │
│  │     Acesso: Todas as unidades                          │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  🔍 Maria Lima          maria@email.com  Analista      │ │
│  │     Acesso: Unidade Norte RJ, Unidade ABC SP           │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  👁️ Carlos Souza        carlos@email.com Usuário       │ │
│  │     Acesso: Unidade Norte RJ                           │ │
│  │                              [✏️ Editar] [🗑️ Excluir]  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
Modal "Novo Usuário":



┌───────────────────────────────────────┐
│  NOVO USUÁRIO                     ✕  │
│  ─────────────────────────────────   │
│  Nome completo                        │
│  [________________________________]  │
│                                       │
│  E-mail                               │
│  [________________________________]  │
│                                       │
│  Perfil                               │
│  ○ Administrador                      │
│  ○ Analista                           │
│  ● Usuário                            │
│                                       │
│  Unidades com acesso                  │
│  ☑ Unidade Norte — RJ                │
│  ☐ Unidade Centro — SP               │
│  ☐ Unidade ABC — MG                  │
│                                       │
│  (Senha provisória enviada por e-mail)│
│                                       │
│  [Cancelar]        [💾 Salvar]        │
└───────────────────────────────────────┘
🌐 WEB — Área do Analista
Tela 8 — Lista de Vistorias


┌──────────────────────────────────────────────────────────────┐
│  MENU  │  📋 VISTORIAS                  [+ Nova Vistoria]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Filtros:                                                    │
│  Unidade: [Todas ▼]  Status: [Todos ▼]  Período: [____]    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🟡 EM ANDAMENTO                                       │ │
│  │  Unidade Norte — RJ                                    │ │
│  │  Iniciada em 23/02/2026 por Maria Lima                 │ │
│  │  Progresso: 3 de 5 áreas preenchidas                  │ │
│  │                    [👁️ Ver] [✏️ Editar] [🗑️ Excluir]   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  🔵 FINALIZADA                                         │ │
│  │  Unidade Centro — SP                                   │ │
│  │  Finalizada em 20/02/2026 por Maria Lima               │ │
│  │  25 itens | 🟢 18  🟡 5  🔴 2                        │ │
│  │                    [👁️ Ver] [🟢 Publicar] [📄 PDF]     │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  🟢 PUBLICADA                                          │ │
│  │  Unidade Norte — RJ                                    │ │
│  │  Publicada em 15/02/2026                               │ │
│  │  20 itens | 🟢 15  🟡 3  🔴 2                        │ │
│  │                    [👁️ Ver] [📄 PDF]                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
Tela 9 — Detalhe / Edição da Vistoria


┌──────────────────────────────────────────────────────────────┐
│  MENU  │  📋 Vistoria — Unidade Norte RJ — 23/02/2026       │
│         │  🟡 EM ANDAMENTO          [✅ Finalizar Vistoria]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Responsável: Maria Lima    Iniciada: 23/02/2026 14:30      │
│                                                              │
│  ▼ 📍 ALMOXARIFADO          3 itens | 🟢 2  🟡 1  🔴 0     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ✅ Extintor de incêndio                               │ │
│  │                                                        │ │
│  │  OCORRÊNCIA 1                          origem: 📱 app  │ │
│  │  Descrição: Extintor porta A                           │ │
│  │  Status: 🟢 Verde                                      │ │
│  │  [🖼️ Foto 1] [🖼️ Foto 2]                              │ │
│  │                                                        │ │
│  │  OCORRÊNCIA 2                          origem: 📱 app  │ │
│  │  Descrição: Extintor corredor B                        │ │
│  │  Status: 🟡 Amarelo                                    │ │
│  │  [🖼️ Foto 1]                                          │ │
│  │  💬 Recomendação: Verificar validade                   │ │
│  │                                                        │ │
│  │                        [+ Adicionar ocorrência]        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  ✅ Sinalização de emergência                          │ │
│  │  OCORRÊNCIA 1                          origem: 🖥️ web  │ │
│  │  Descrição: (vazia)                                    │ │
│  │  Status: 🟢 Verde                                      │ │
│  │  [🖼️ Foto 1]                                          │ │
│  │                        [+ Adicionar ocorrência]        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ► 📍 REFEITÓRIO             2 itens | ⬜ não iniciada       │
│  ► 📍 PRODUÇÃO               4 itens | ⬜ não iniciada       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
Notas:

Cada área pode ser expandida/recolhida (▼ / ►)
Mostra a origem de cada ocorrência (app ou web)
Analista pode adicionar ocorrências diretamente na web
Botão "Finalizar" fica no topo, sempre visível
📱 APP — Campo
Tela 10 — Tela Inicial do App


┌─────────────────────────────────┐
│  Sistema de Vistorias           │
│  Olá, Maria 👋          [Sair]  │
├─────────────────────────────────┤
│                                 │
│  SUAS UNIDADES                  │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🏭 Unidade Norte — RJ  │   │
│  │  Alpha Ltda             │   │
│  │  5 áreas configuradas   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🏭 Unidade Centro — SP │   │
│  │  Alpha Ltda             │   │
│  │  3 áreas configuradas   │   │
│  └─────────────────────────┘   │
│                                 │
│  🔴 Sem conexão com internet   │
│  Dados da última sincronização: │
│  23/02/2026 às 14:30           │
│                                 │
└─────────────────────────────────┘
Tela 11 — Seleção de Vistoria


┌─────────────────────────────────┐
│  ← Unidade Norte — RJ          │
├─────────────────────────────────┤
│                                 │
│  [+ Iniciar Nova Vistoria]      │
│                                 │
│  EM ANDAMENTO                   │
│  ┌─────────────────────────┐   │
│  │  🟡 23/02/2026          │   │
│  │  Iniciada hoje          │   │
│  │  3 de 5 áreas prontas   │   │
│  │  [▶ Continuar]          │   │
│  └─────────────────────────┘   │
│                                 │
│  ENVIADAS (somente leitura)     │
│  ┌─────────────────────────┐   │
│  │  🔵 15/02/2026          │   │
│  │  Finalizada             │   │
│  │  [👁️ Visualizar]        │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
Tela 12 — Lista de Áreas da Vistoria


┌─────────────────────────────────┐
│  ← Vistoria 23/02/2026         │
│  Unidade Norte — RJ            │
├─────────────────────────────────┤
│                                 │
│  ÁREAS DA VISTORIA              │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ✅ Almoxarifado        │   │
│  │  3 itens — completo     │   │
│  │  🟢 2  🟡 1  🔴 0      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ⬜ Refeitório           │   │
│  │  2 itens — não iniciado │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🔄 Produção            │   │
│  │  4 itens — em progresso │   │
│  │  2 de 4 preenchidos     │   │
│  └─────────────────────────┘   │
│                                 │
│  [📤 Enviar Vistoria]           │
│  (ativo quando tudo preenchido  │
│   OU quando usuário decide      │
│   enviar assim mesmo)           │
└─────────────────────────────────┘
Tela 13 — Lista de Itens da Área


┌─────────────────────────────────┐
│  ← Almoxarifado                │
│  Unidade Norte — RJ            │
├─────────────────────────────────┤
│                                 │
│  ITENS DESTA ÁREA               │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ✅ Extintor de incêndio│   │
│  │  2 ocorrências          │   │
│  │  🟢 1  🟡 1             │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ✅ Sinalização         │   │
│  │  1 ocorrência           │   │
│  │  🟢 1                   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ⬜ Piso limpo e seco   │   │
│  │  Não iniciado           │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
Tela 14 — Preenchimento do Item (Principal do App)


┌─────────────────────────────────┐
│  ← Extintor de incêndio        │
│  Almoxarifado                  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │  OCORRÊNCIA 1           │   │
│  │  ─────────────────────  │   │
│  │                         │   │
│  │  Descrição              │   │
│  │  ┌───────────────────┐  │   │
│  │  │ Extintor porta A  │  │   │
│  │  └───────────────────┘  │   │
│  │                         │   │
│  │  Status                 │   │
│  │  ┌──┐  ┌──┐  ┌──┐      │   │
│  │  │🟢│  │🟡│  │🔴│      │   │
│  │  └──┘  └──┘  └──┘      │   │
│  │                         │   │
│  │  Fotos                  │   │
│  │  ┌────────┐ ┌────────┐  │   │
│  │  │[foto1] │ │[foto2] │  │   │
│  │  │📷 Tirar│ │📷 Tirar│  │   │
│  │  └────────┘ └────────┘  │   │
│  │                         │   │
│  │  💬 Recomendação        │   │
│  │  (aparece se 🟡 ou 🔴)  │   │
│  │  ┌───────────────────┐  │   │
│  │  │                   │  │   │
│  │  └───────────────────┘  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  OCORRÊNCIA 2           │   │
│  │  (mesmo formato acima)  │   │
│  └─────────────────────────┘   │
│                                 │
│  [+ Adicionar Ocorrência]       │
│                                 │
└─────────────────────────────────┘
Tela 15 — Confirmação de Envio


┌─────────────────────────────────┐
│  📤 ENVIAR VISTORIA             │
├─────────────────────────────────┤
│                                 │
│  Unidade Norte — RJ            │
│  23/02/2026                     │
│                                 │
│  RESUMO:                        │
│  ✅ Áreas completas: 3 de 5    │
│  ⚠️ Áreas em branco: 2         │
│                                 │
│  Total de ocorrências: 12       │
│  🟢 Verde: 8                    │
│  🟡 Amarelo: 3                  │
│  🔴 Vermelho: 1                 │
│  ⬜ Sem status: 4               │
│                                 │
│  Fotos: 9 fotos                 │
│  Tamanho estimado: 2.4 MB       │
│                                 │
│  ⚠️ Há itens não preenchidos.   │
│  Você poderá completar na web.  │
│                                 │
│  [Cancelar]   [📤 Enviar Mesmo Assim]│
│                                 │
└─────────────────────────────────┘
📊 Tela 16 — Geração de Relatório PDF (Web)


┌──────────────────────────────────────────────────────────────┐
│  MENU  │  📊 GERAR RELATÓRIO — Unidade Norte RJ — 23/02     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tipo de relatório:                                          │
│                                                              │
│  ┌────────────────────────────┐  ┌──────────────────────┐  │
│  │  📄 RELATÓRIO COMPLETO    │  │  ⚠️ SÓ PENDÊNCIAS    │  │
│  │                            │  │                      │  │
│  │  Todas as ocorrências      │  │  Apenas 🟡 e 🔴      │  │
│  │  🟢 🟡 🔴 e ⬜             │  │  Ideal para plano    │  │
│  │  Com fotos                 │  │  de ação             │  │
│  │  Com logo da unidade       │  │  Com fotos           │  │
│  │                            │  │  Com logo            │  │
│  │  [📥 Gerar PDF]            │  │  [📥 Gerar PDF]      │  │
│  └────────────────────────────┘  └──────────────────────┘  │
│                                                              │
│  PRÉVIA DO RELATÓRIO                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [LOGO UNIDADE]                                        │ │
│  │  Relatório de Vistoria                                 │ │
│  │  Unidade Norte — RJ  |  23/02/2026                    │ │
│  │  ─────────────────────────────────────────────────    │ │
│  │  📍 Almoxarifado                                       │ │
│  │  ...                                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
🗺️ Mapa de Navegação Completo


WEB
├── Login
├── Dashboard
├── Administração
│   ├── Empresas (listar, criar, editar)
│   ├── Unidades (listar, criar, editar + upload logo)
│   ├── Itens de Verificação (biblioteca)
│   ├── Estrutura de Vistoria (por unidade)
│   └── Usuários (listar, criar, editar, vincular)
├── Vistorias
│   ├── Lista (filtros por status, unidade, data)
│   ├── Detalhe / Edição
│   └── Geração de PDF
└── (Perfil do usuário / trocar senha)

APP
├── Login
├── Lista de Unidades
├── Lista de Vistorias da Unidade
│   ├── Nova Vistoria
│   └── Continuar Vistoria
│       ├── Lista de Áreas
│       │   └── Lista de Itens
│       │       └── Preenchimento de Ocorrências
│       └── Tela de Envio
└── (Perfil / trocar senha)
🎯 Com esses wireframes em mãos, você já tem o suficiente para sentar com um desenvolvedor e descrever exatamente o que precisa ser construído, tela por tela.