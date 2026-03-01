# AIOS Lite — Planejamento Completo de Implementação

> **Missão:** Framework de agentes IA leve, elegante e eficiente para desenvolvimento de software e geração de conteúdo. Menos é mais — espresso, não café aguado. Compatível com Claude Code, Codex CLI e Gemini CLI. Open Source no GitHub.

---

## Índice

1. [Filosofia e Princípios](#1-filosofia-e-princípios)
2. [Estrutura de Arquivos](#2-estrutura-de-arquivos)
3. [Compatibilidade Multi-IDE](#3-compatibilidade-multi-ide)
4. [Fluxo de Trabalho Completo](#4-fluxo-de-trabalho-completo)
5. [Agentes — Definições Detalhadas](#5-agentes--definições-detalhadas)
6. [Sistema de Onboarding](#6-sistema-de-onboarding)
7. [Skills e MCP](#7-skills-e-mcp)
8. [Multi-Agente e Paralelização](#8-multi-agente-e-paralelização)
9. [Makopy Integration — MCP Server](#9-makopy-integration--mcp-server)
10. [Marketplace de Pipelines](#10-marketplace-de-pipelines)
11. [Modelo de Negócio](#11-modelo-de-negócio)
12. [Roadmap de Implementação](#12-roadmap-de-implementação)
13. [Instruções para o Claude Code](#13-instruções-para-o-claude-code)
14. [Especificação Técnica do Pacote npm](#14-especificação-técnica-do-pacote-npm)
15. [Conteúdo Completo dos Agentes e Skills](#15-conteúdo-completo-dos-agentes-e-skills)
16. [Plano de Documentação](#16-plano-de-documentação)

---

## 1. Filosofia e Princípios

### O que é o AIOS Lite

Framework de agentes IA inspirado no [Synkra AIOS](https://github.com/SynkraAI/aios-core), porém construído do zero com foco em eficiência, leveza e resultado excepcional. Enquanto o AIOS original cria equipes de 7+ agentes com PRDs de 40 páginas para qualquer projeto — inclusive uma simples landing page — o AIOS Lite aplica o princípio da **complexidade adaptativa**: o tamanho da solução deve ser proporcional ao tamanho do problema.

### Princípios Inegociáveis

**Menos é mais.** Cada agente faz uma coisa e faz muito bem. Nenhum agente duplica o trabalho do outro.

**Contexto é tudo.** O arquivo de contexto gerado no onboarding é a espinha dorsal de todo o sistema. Todos os agentes leem, nenhum ignora.

**Fonte única de verdade.** Os prompts dos agentes vivem em `.aios-lite/agents/`. Os arquivos de cada IDE (CLAUDE.md, AGENTS.md, GEMINI.md) são apenas gateways que apontam para lá. Nada duplicado, nada que possa ficar desatualizado.

**CLI primeiro.** Toda funcionalidade deve operar 100% via terminal antes de qualquer interface visual.

**Complexidade adaptativa.** Projeto MICRO recebe solução MICRO. Projeto MEDIUM recebe solução MEDIUM. Nunca uma bazuca para matar uma mosca.

**Stack do usuário, não do framework.** O AIOS original assume sempre Node.js + Express. O AIOS Lite pergunta primeiro e respeita a escolha.

**UI/UX elegante e atual.** Quando gerar interfaces, sempre seguir os padrões modernos de design — componentes corretos da stack escolhida, nunca reinventar o que já existe nas bibliotecas.

**AIOS Lite cuida de estrutura, Makopy cuida de conteúdo.** Requisitos, tabelas, migrations, arquitetura e código são responsabilidade do AIOS Lite. Copy, textos de interface, emails transacionais e conteúdo de marketing são responsabilidade da Makopy. Essa divisão nunca deve ser violada.

**Nunca pergunte o que você pode descobrir.** O @setup deve sempre verificar o que já existe no projeto antes de fazer qualquer pergunta sobre instalação de framework.

---

## 2. Estrutura de Arquivos

```
projeto/
│
├── CLAUDE.md                          ← Lido automaticamente pelo Claude Code
├── AGENTS.md                          ← Lido automaticamente pelo Codex CLI
│
├── .gemini/
│   ├── GEMINI.md                      ← Lido pelo Gemini CLI
│   └── commands/
│       ├── aios-setup.toml
│       ├── aios-analyst.toml
│       ├── aios-architect.toml
│       ├── aios-pm.toml
│       ├── aios-dev.toml
│       ├── aios-qa.toml
│       └── aios-orchestrator.toml
│
└── .aios-lite/
    ├── config.md                      ← Configuração central do framework
    │
    ├── agents/                        ← FONTE ÚNICA — prompts de cada agente
    │   ├── setup.md
    │   ├── analyst.md
    │   ├── architect.md
    │   ├── pm.md
    │   ├── dev.md
    │   ├── qa.md
    │   └── orchestrator.md
    │
    ├── context/                       ← Gerado durante o uso do projeto
    │   ├── project.context.md         ← Criado pelo @setup
    │   ├── discovery.md               ← Criado pelo @analyst
    │   ├── architecture.md            ← Criado pelo @architect
    │   ├── prd.md                     ← Criado pelo @pm
    │   └── parallel/                  ← Usado na execução multi-agente
    │       ├── agent-1.status.md
    │       ├── agent-2.status.md
    │       ├── agent-3.status.md
    │       └── shared-decisions.md
    │
    ├── skills/
    │   ├── static/                    ← Conhecimento local que não muda
    │   │   ├── laravel-conventions.md
    │   │   ├── tall-stack-patterns.md
    │   │   ├── jetstream-setup.md
    │   │   ├── filament-patterns.md
    │   │   ├── flux-ui-components.md
    │   │   ├── node-express-patterns.md
    │   │   ├── nextjs-patterns.md
    │   │   ├── ui-ux-modern.md
    │   │   └── git-conventions.md
    │   └── dynamic/                   ← Apontam para MCPs externos
    │       ├── laravel-docs.md
    │       ├── flux-ui-docs.md
    │       └── npm-packages.md
    │
    └── mcp/
        └── servers.md                 ← MCPs configurados no projeto
```

---

## 3. Compatibilidade Multi-IDE

### Estratégia: Gateway Pattern

Cada IDE tem seu arquivo de entrada, mas todos apontam para a mesma fonte em `.aios-lite/`. Adicionar suporte a um novo IDE é criar um arquivo gateway de ~20 linhas.

### CLAUDE.md (Claude Code)

```markdown
# AIOS Lite

Você opera como AIOS Lite — framework de agentes IA leve e eficiente.

## Primeira ação obrigatória
Antes de qualquer coisa, verifique se `.aios-lite/context/project.context.md` existe.
- Se NÃO existir: execute o agente @setup imediatamente
- Se existir: leia-o antes de qualquer ação

## Agentes disponíveis
- /setup        → Onboarding do projeto
- /analyst      → Descoberta de requisitos
- /architect    → Arquitetura e estrutura
- /pm           → PRD leve
- /dev          → Desenvolvimento
- /qa           → Qualidade
- /orchestrator → Paralelização (projetos MEDIUM+)

## Instruções completas
Leia: .aios-lite/config.md

## Regra de ouro
Faça menos, faça melhor. Projeto pequeno = solução pequena e elegante.
```

### AGENTS.md (Codex CLI)

```markdown
# AIOS Lite — Codex CLI

## Verificação inicial
Antes de qualquer ação, verifique se `.aios-lite/context/project.context.md` existe.
Se não existir, execute o @setup.

## Agentes disponíveis

### @setup
Responsabilidade: onboarding, coleta de stack e geração de contexto.
Instruções: .aios-lite/agents/setup.md
Quando usar: início de qualquer projeto novo

### @analyst
Responsabilidade: descoberta de requisitos e classificação do projeto.
Instruções: .aios-lite/agents/analyst.md
Depende de: project.context.md

### @architect
Responsabilidade: estrutura de pastas, decisões técnicas, padrões.
Instruções: .aios-lite/agents/architect.md
Depende de: discovery.md

### @pm
Responsabilidade: PRD leve (máximo 2 páginas).
Instruções: .aios-lite/agents/pm.md
Depende de: architecture.md

### @dev
Responsabilidade: implementação seguindo stack e arquitetura definidas.
Instruções: .aios-lite/agents/dev.md
Depende de: todos os contextos anteriores

### @qa
Responsabilidade: revisão focada no que pode quebrar.
Instruções: .aios-lite/agents/qa.md
Depende de: código gerado pelo @dev

### @orchestrator
Responsabilidade: paralelização inteligente para projetos MEDIUM+.
Instruções: .aios-lite/agents/orchestrator.md
Depende de: prd.md e architecture.md
```

### .gemini/commands/aios-dev.toml (Gemini CLI)

```toml
name = "aios-dev"
description = "Ativa o agente desenvolvedor do AIOS Lite"
instruction_file = ".aios-lite/agents/dev.md"
requires_context = [
  ".aios-lite/context/project.context.md",
  ".aios-lite/context/architecture.md",
  ".aios-lite/context/prd.md"
]
```

### Prioridade de suporte

1. **Claude Code** — melhor paridade, suporte completo incluindo hooks de ciclo de vida
2. **Codex CLI** — segunda prioridade, integração via AGENTS.md
3. **Gemini CLI** — terceira prioridade, slash commands via .toml
4. **Cursor** — bônus, via .cursor/rules/

---

## 4. Fluxo de Trabalho Completo

### Classificação por tamanho

```
MICRO  → Landing page, site institucional, CRUD simples, script
SMALL  → Sistema com auth, módulos, painel básico, API simples
MEDIUM → Multi-tenant, integrações externas, lógica complexa, SaaS
```

### Fluxo por tamanho

```
MICRO:   @setup → @dev
SMALL:   @setup → @analyst → @architect → @dev → @qa
MEDIUM:  @setup → @analyst → @architect → @pm → @orchestrator → @dev(paralelo) → @qa
```

### Regra de classificação automática

O `@analyst` classifica o projeto com base em três perguntas objetivas:

- Quantos tipos de usuário diferentes existem? (1 = simples, 3+ = complexo)
- Tem integrações com sistemas externos? (não = simples, sim = complexo)
- Tem regras de negócio não óbvias? (não = simples, sim = complexo)

Se 0-1 critérios = MICRO. Se 2 critérios = SMALL. Se 3 critérios = MEDIUM.

---

## 5. Agentes — Definições Detalhadas

### @setup — Onboarding

**Responsabilidade única:** Coletar informações do projeto e gerar `project.context.md`.

**Fluxo de conversa:**

```
Bloco 1 — Perfil do usuário
"Você é desenvolvedor ou está iniciando sem experiência técnica?"
[1] Desenvolvedor — quero escolher minha stack
[2] Iniciante — prefiro uma recomendação
[3] Tenho equipe técnica — vou informar os detalhes

Bloco 2A — Para desenvolvedores (exemplo Laravel)
Backend:
[1] Laravel  [2] Node/Express  [3] Django
[4] FastAPI  [5] Rails  [6] Outro

→ Se Laravel:
Versão:
[1] Laravel 11  [2] Laravel 10  [3] Outra

Frontend:
[1] TALL Stack (Livewire + Alpine + Tailwind)
[2] VILT Stack (Vue + Inertia + Tailwind)
[3] BILL Stack (Blade puro)
[4] Next.js separado
[5] Nuxt separado
[6] Outro

Autenticação:
[1] Laravel Breeze — simples, projetos menores
[2] Laravel Jetstream + Livewire — robusto (recomendado)
    → Habilitar Teams (multi-tenant)? [Sim] [Não]
[3] Filament Shield — painéis administrativos
[4] Implementar do zero

UI/UX:
[1] Tailwind puro — máxima liberdade
[2] Flux UI — componentes elegantes para Livewire
[3] shadcn/ui — Inertia + Vue/React
[4] Filament — foco em painel admin

Banco de dados:
[1] MySQL  [2] PostgreSQL  [3] SQLite
[4] MongoDB  [5] Supabase  [6] PlanetScale

Serviços extras (múltipla escolha):
[ ] Filas (Horizon + Redis)
[ ] Armazenamento de arquivos (S3)
[ ] WebSockets (Reverb / Pusher)
[ ] Pagamentos (Stripe / PagSeguro / MercadoPago)
[ ] Email transacional (Mailgun / Resend / SES)
[ ] Cache (Redis)

Bloco 2B — Para iniciantes
"Me conte sobre seu projeto. O que ele vai fazer?"
→ aguarda resposta livre

"Quantas pessoas vão usar?"
[1] Só eu ou poucos (até 10)
[2] Um time pequeno (até 100)
[3] Clientes externos (não sei quantos)

"Precisa funcionar no celular?"
[1] Sim, precisa de app mobile
[2] Só web, mas responsivo
[3] Só desktop

"Você tem hospedagem?"
[1] Não, quero algo simples de hospedar
[2] Tenho VPS
[3] Vou usar cloud (AWS/GCP/Azure/Hetzner)

→ Recomendação automática com justificativa
```

**Output:** `.aios-lite/context/project.context.md`

```markdown
# Contexto do Projeto

## Identificação
- Nome: [nome]
- Tipo: [web_app / api / site / script]
- Escala estimada: [MICRO / SMALL / MEDIUM]
- Perfil do usuário: [desenvolvedor / iniciante]

## Stack
- Backend: [ex: Laravel 11]
- Frontend: [ex: TALL Stack]
- Banco de dados: [ex: MySQL]
- Autenticação: [ex: Jetstream + Livewire + Teams]
- UI/UX: [ex: Flux UI]
- Serviços: [lista]

## Convenções
- Idioma do projeto: pt-BR
- Comentários no código: pt-BR
- Nomenclatura BD: snake_case
- Nomenclatura JS: camelCase

## Observações
[qualquer detalhe relevante coletado]
```

---

### @analyst — Descoberta e Análise de Requisitos

**Responsabilidade única:** Entender profundamente o que o sistema precisa fazer, mapear todas as entidades de dados e classificar o tamanho real do projeto. O @analyst vai até o nível de tabelas e relacionamentos — o @architect recebe esse trabalho pronto e foca apenas na estrutura de código.

**Lê obrigatoriamente:** `project.context.md`

**Fase 1 — Perguntas de descoberta:**

```
O que o sistema precisa fazer? (descreva livremente, sem pressa)
Quem vai usar? Quais tipos de usuário existem?
Quais são as 3 funcionalidades mais importantes para o MVP?
Tem prazo ou versão MVP definida?
Tem alguma referência visual que admira? (links)
Existe algum sistema parecido no mercado?
```

**Fase 2 — Aprofundamento por entidade:**

Após a descrição livre, o @analyst identifica as entidades mencionadas e faz perguntas específicas para cada uma, garantindo que nenhum campo ou relacionamento importante seja esquecido:

```
Exemplo: usuário descreveu "sistema de agendamentos"

@analyst pergunta:
- Um cliente pode ter múltiplos agendamentos? 
- O agendamento tem horário de início e fim ou só início com duração fixa?
- Existe cancelamento? Com reembolso? Com prazo mínimo?
- O prestador tem folga/indisponibilidade cadastrada?
- Precisa de notificação (email/SMS) ao agendar?
- Tem limite de agendamentos por dia por prestador?
```

**Fase 3 — Design de entidades e tabelas:**

Com as respostas em mãos, o @analyst produz o mapeamento completo de dados antes de qualquer código:

```markdown
## Entidades identificadas

### users
| campo          | tipo         | observação                    |
|----------------|--------------|-------------------------------|
| id             | bigint PK    |                               |
| name           | string       |                               |
| email          | string       | unique                        |
| password       | string       |                               |
| role           | enum         | admin, prestador, cliente     |
| phone          | string null  |                               |
| email_verified | timestamp null|                              |
| timestamps     |              | created_at, updated_at        |
| soft_deletes   |              | deleted_at                    |

### appointments
| campo          | tipo         | observação                    |
|----------------|--------------|-------------------------------|
| id             | bigint PK    |                               |
| client_id      | FK users     |                               |
| provider_id    | FK users     |                               |
| service_id     | FK services  |                               |
| starts_at      | datetime     |                               |
| ends_at        | datetime     | calculado pelo duration       |
| status         | enum         | pending, confirmed, cancelled |
| notes          | text null    |                               |
| cancelled_at   | timestamp null|                             |
| cancel_reason  | string null  |                               |
| timestamps     |              |                               |

## Relacionamentos
- User (cliente) hasMany Appointments
- User (prestador) hasMany Appointments (como provider)
- Appointment belongsTo Service
- Service belongsTo User (prestador)

## Ordem de criação das migrations
1. users (base de tudo)
2. services (depende de users)
3. provider_availabilities (depende de users)
4. appointments (depende de users e services)
5. notifications (depende de users e appointments)

## Índices recomendados
- appointments: (provider_id, starts_at) — consulta de agenda do prestador
- appointments: (client_id, status) — histórico do cliente
- appointments: (starts_at, status) — relatórios por período
```

**Classificação automática:**

```
Critério 1: Tipos de usuário diferentes (1 = 0pts, 2 = 1pt, 3+ = 2pts)
Critério 2: Integrações externas (nenhuma = 0pts, 1-2 = 1pt, 3+ = 2pts)
Critério 3: Regras de negócio não óbvias (não = 0pts, algumas = 1pt, complexas = 2pts)

0-1 pts = MICRO
2-3 pts = SMALL
4-6 pts = MEDIUM
```

**Divisão de responsabilidades — AIOS Lite vs Makopy:**

O @analyst cuida de **tudo que é técnico e estrutural**: requisitos, entidades, tabelas, relacionamentos, regras de negócio. Isso nunca depende da Makopy.

A **Makopy** entra apenas quando o @dev precisar de conteúdo para a interface: textos de onboarding, copy de botões, mensagens de boas-vindas, emails transacionais, descrições de features. Conteúdo, não estrutura.

Existe um caso de uso opcional: um pipeline Makopy de "Descrição vaga → Requisitos estruturados" para ajudar usuários iniciantes que descrevem o sistema de forma muito genérica. Mas é um pré-processador opcional — o @analyst consegue extrair os requisitos com boas perguntas sem depender da Makopy.

**Output:** `.aios-lite/context/discovery.md`

```markdown
# Discovery

## O que estamos construindo
[2-3 linhas objetivas]

## Usuários e permissões
[lista de tipos com o que cada um pode fazer]

## Funcionalidades prioritárias
1. [mais importante]
2. [segunda]
3. [terceira]

## Design de entidades e tabelas
[tabelas completas com campos, tipos e observações]

## Relacionamentos
[mapeamento completo hasMany, belongsTo, etc.]

## Ordem de criação das migrations
[lista ordenada respeitando dependências de FK]

## Índices recomendados
[índices que farão diferença em produção]

## Regras de negócio críticas
[o que não é óbvio e não pode ser esquecido]

## Classificação do projeto
Tamanho: SMALL
Motivo: [justificativa baseada nos critérios]

## Referências visuais
[links ou descrições]

## Riscos identificados
[o que pode ser problema]

## Fora do escopo do MVP
[importante para evitar scope creep]
```

---

### @architect — Arquitetura

**Responsabilidade única:** Definir estrutura de pastas, decisões técnicas e transformar o design de entidades do @analyst em migrations e código base adequados ao tamanho do projeto.

**Lê obrigatoriamente:** `project.context.md` e `discovery.md`

**Ponto importante:** O @analyst já entregou o design completo de tabelas, relacionamentos, índices e ordem de migrations. O @architect não redesenha isso — ele usa como insumo para gerar o código real das migrations e a estrutura de Models com relacionamentos já definidos.

**Via MCP Context7:** Busca as convenções atuais da versão do framework escolhido antes de definir a estrutura.

**Princípio crítico:** Não aplica padrões MEDIUM em projetos MICRO. A estrutura deve ser proporcional.

**Estrutura Laravel TALL Stack — exemplo por tamanho:**

```
MICRO (CRUD simples):
app/
├── Http/Controllers/
├── Models/
└── Livewire/

SMALL (sistema com auth e módulos):
app/
├── Actions/           ← lógica de negócio isolada
├── Http/
│   ├── Controllers/   ← só orquestração
│   └── Requests/      ← validações aqui
├── Livewire/
│   ├── Pages/         ← componentes de página
│   └── Components/    ← reutilizáveis
├── Models/            ← scopes e relacionamentos
├── Services/          ← integrações externas
└── Traits/            ← comportamentos reutilizáveis

MEDIUM (SaaS, multi-tenant):
app/
├── Actions/
├── Http/
│   ├── Controllers/
│   ├── Requests/
│   └── Resources/     ← API Resources
├── Livewire/
│   ├── Pages/
│   └── Components/
├── Models/
├── Services/
├── Repositories/      ← só aqui justifica abstração de BD
├── Traits/
├── Events/
├── Listeners/
├── Jobs/
└── Policies/
```

**Output:** `.aios-lite/context/architecture.md`

```markdown
# Arquitetura

## Estrutura de pastas
[árvore completa]

## Decisões técnicas
[o que foi escolhido e por quê]

## Padrões adotados
[convenções que todos os agentes devem seguir]

## O que foi conscientemente excluído
[e por quê não é necessário neste tamanho]

## Pontos de atenção
[onde o @dev deve ter cuidado]
```

---

### @pm — PRD Leve

**Responsabilidade única:** Gerar o documento mínimo viável que o @dev precisa para trabalhar com clareza.

**Lê obrigatoriamente:** `project.context.md`, `discovery.md` e `architecture.md`

**Regra de ouro:** Máximo 2 páginas. Se ultrapassar, está fazendo mais do que o necessário.

**Output:** `.aios-lite/context/prd.md`

```markdown
# PRD — [Nome do Projeto]

## O que estamos construindo
[2-3 linhas]

## Usuários e permissões
- Admin: [o que pode fazer]
- Usuário comum: [o que pode fazer]

## Módulos e ordem de desenvolvimento
1. [módulo] — [o que faz] — [Alta/Média/Baixa prioridade]
2. ...

## Regras de negócio críticas
[só o que não é óbvio e pode ser esquecido]

## Integrações externas necessárias
[lista com o que cada uma faz]

## Fora do escopo agora
[importante para evitar scope creep]
```

---

### @dev — Desenvolvedor

**Responsabilidade única:** Implementar seguindo rigorosamente a stack, arquitetura e convenções definidas.

**Lê obrigatoriamente antes de qualquer linha de código:**
1. `project.context.md` — stack e configurações
2. `architecture.md` — estrutura e padrões
3. `prd.md` — o que construir e em que ordem

**Via MCP Context7:** Consulta documentação atualizada do framework antes de implementar.
**Via MCP Database:** Verifica estrutura atual do banco antes de criar migrations.

**Convenções Laravel que sempre segue (sem precisar ser pedido):**

```
✅ SEMPRE:
- Form Requests para toda validação
- Actions para toda lógica de negócio
- Policies para toda autorização
- Events + Listeners para side effects
- Jobs para processamento pesado
- Resource Collections para respostas de API
- down() implementado em toda migration

❌ NUNCA:
- Lógica de negócio no Controller
- Queries no Blade/Livewire diretamente
- Validação inline no Controller
- Lógica além de scopes e relacionamentos no Model
- Query N+1 (sempre eager loading)
```

**Convenções de UI/UX:**

```
- Usa os componentes corretos da biblioteca escolhida (Flux UI, shadcn, etc.)
- Nunca reinventa botão, modal, tabela ou form que já existe na lib
- Design moderno, clean, com bom espaçamento
- Responsivo por padrão
- Estados de loading, empty state e erro sempre implementados
- Feedback visual para todas as ações do usuário
```

**Commits semânticos por módulo:**

```
feat(auth): implementa login com Jetstream
feat(dashboard): adiciona cards de métricas
fix(users): corrige paginação na listagem
```

---

### @qa — Qualidade

**Responsabilidade única:** Verificar o que pode realmente quebrar em produção, sem over-testing.

**Lê obrigatoriamente:** `prd.md` (regras de negócio) e o código gerado.

**Via MCP Context7:** Consulta melhores práticas de teste para a stack.

**Foco de verificação:**

```
Para cada módulo:
1. Regras de negócio críticas têm teste?
2. Autorização está sendo testada (Policies)?
3. Happy path coberto?
4. Principal edge case coberto?
5. Existe query N+1 óbvia?
6. Formulários validam server-side?
7. Estados de erro tratados?
```

**Output:** Relatório objetivo com o que testou e o que encontrou.

---

### @orchestrator — Paralelização

**Responsabilidade única:** Dividir projetos MEDIUM em tarefas paralelas seguras e coordenar a execução.

**Quando ativar:** Apenas projetos classificados como MEDIUM+ pelo @analyst.

**Fluxo:**

```
1. Lê prd.md e architecture.md
2. Identifica módulos com dependências
3. Monta grafo de dependências
4. Separa o que pode ser paralelo do que deve ser sequencial
5. Gera contexto específico para cada agente filho
6. Usa Agent Teams nativo do Claude Code (flag: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
7. Monitora shared-decisions.md para conflitos
8. Consolida ao final
```

**Exemplo de grafo:**

```
Auth ──► Dashboard
         │
         ▼
API ◄────┘    (pode rodar paralelo com Dashboard depois de Auth)

Emails        (totalmente independente, pode rodar a qualquer momento)
```

**Protocolo de comunicação entre agentes paralelos:**

Cada agente filho escreve em seu arquivo de status antes de tomar decisões que afetam outros:

```markdown
# agent-1.status.md
Módulo: Auth
Status: em andamento
Decisões tomadas:
- User model usa soft deletes
- Token de reset expira em 60min
Aguardando: nada
Bloqueando: Dashboard (depende do User model)
```

**Compatibilidade com Agent Teams nativo:**

O @orchestrator é compatível com a flag oficial da Anthropic:
```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Quando ativada, o @orchestrator usa a infraestrutura nativa de subagentes do Claude Code em vez de orquestrar manualmente via arquivos.

---

## 6. Sistema de Onboarding

O onboarding inteligente é o maior diferencial do AIOS Lite em relação ao AIOS original. Funciona em dois caminhos paralelos dependendo do perfil do usuário.

### Detecção Automática de Framework Instalado

Antes de fazer qualquer pergunta sobre instalação, o @setup verifica o que já existe na pasta atual. Nunca pergunte o que você pode descobrir sozinho.

```
@setup verifica na pasta do projeto:

Indicadores de Laravel:
- artisan           → Laravel confirmado
- composer.json com "laravel/framework" → Laravel confirmado

Indicadores de Rails:
- Gemfile com "rails" → Rails confirmado
- config/application.rb → Rails confirmado

Indicadores de Django:
- manage.py → Django confirmado
- requirements.txt com "django" → Django confirmado

Indicadores de Node:
- package.json → Node iniciado (verificar framework dentro)

Indicadores de Next.js:
- next.config.js ou next.config.ts → Next.js confirmado

Nada encontrado → projeto em branco, perguntar stack
```

Se detectar framework instalado: pula a pergunta de instalação, vai direto para perguntas de configuração (auth, banco, UI etc.).

Se não detectar: entra na árvore de decisão de instalação.

### Grupos de Framework por Comportamento de Instalação

**Grupo A — Instaladores robustos (PHP e Ruby)**

Laravel, Rails e Django criam toda a estrutura via um único comando. O AIOS Lite nunca tenta replicar ou substituir esses instaladores. A abordagem correta é perguntar se já foi feito e mostrar o comando correto se não foi.

```
Frameworks do Grupo A:
- Laravel (PHP)
- Rails (Ruby)  
- Django (Python)
- Symfony (PHP)
- AdonisJS (Node — tem instalador próprio)
```

**Grupo B — Setup manual (sem instalador oficial robusto)**

Node/Express, Fastify, Hono — você começa do zero e instala pacote por pacote. Aqui o AIOS Lite tem mais espaço para ajudar na estrutura inicial.

**Grupo C — Meta-frameworks com wizards interativos**

Next.js, Nuxt, SvelteKit e Remix têm seus próprios wizards que já fazem boas perguntas. O AIOS Lite deve respeitar as escolhas feitas ali e apenas coletar o que foi configurado.

```
npx create-next-app@latest    → já pergunta TypeScript, Tailwind, App Router
npx nuxi@latest init          → já configura a estrutura base
```

### Árvore de Decisão para Frameworks do Grupo A

```
"Você já criou o projeto com o instalador do [framework]?"

[1] Sim, já criei e está instalado
    → Continuar para perguntas de configuração

[2] Não criei ainda
    → Mostrar o comando correto e aguardar

[3] Não sei o que isso significa
    → Caminho do iniciante com explicação
```

Se o usuário ainda não instalou, o @setup exibe o comando e aguarda:

```
Para criar um projeto [framework], use este comando:

[comando correto para a stack e opções escolhidas]

Execute no terminal, depois volte aqui e confirme quando terminar.
Aguardando confirmação... → [Instalei, pode continuar]
```

### Casos Especiais por Framework

**Laravel — Jetstream deve ser instalado na criação**

Esta é a situação mais crítica. O Jetstream modifica a estrutura base do Laravel e instalar depois é doloroso. O @setup deve detectar esse ponto e agir preventivamente:

```
⚠️  Autenticação — escolha antes de criar o projeto

Importante: sistemas de auth mais completos precisam ser
instalados durante a criação do projeto, não depois.

[1] Laravel Breeze
    Simples, para projetos MICRO
    Pode ser adicionado depois sem problema
    → Comando: laravel new {nome} --breeze

[2] Laravel Jetstream + Livewire  ← RECOMENDADO para SMALL e MEDIUM
    Auth completa: perfil, foto, 2FA, API tokens
    Precisa ser instalado na criação
    → Habilitar Teams (multi-tenant)? [Sim] [Não]
    → Comando: laravel new {nome} --jet --stack=livewire [--teams]

[3] Filament Shield
    Ideal se o foco for painel administrativo
    Pode ser adicionado em projeto existente
    → Comando: laravel new {nome} depois composer require filament/filament

[4] Do zero — implementar manualmente
```

Se o projeto já existe sem Jetstream e o usuário queria Jetstream:

```
⚠️  O projeto já existe sem Jetstream instalado.

Instalar Jetstream em projeto existente é complexo e 
pode causar conflitos. Opções:

[1] Continuar sem Jetstream (usar Breeze ou auth manual)
[2] Recriar o projeto do zero com Jetstream
    → Vou gerar o comando correto para você
[3] Tentarei instalar manualmente (por sua conta e risco)
```

**Rails — Coletar opções usadas na criação**

O `rails new` define escolhas estruturais importantes. O @setup precisa saber o que foi usado:

```
"Quando criou o projeto com rails new, usou opções específicas?"

Me diga o comando que usou, ou marque o que se aplica:

[ ] --database=postgresql  (padrão é SQLite)
[ ] --database=mysql
[ ] --css=tailwind
[ ] --api  (modo API only, sem views)
[ ] --skip-javascript
[ ] Rodei rails new {nome} sem opções extras

Se não lembra, me diga e eu verifico os arquivos do projeto.
```

**Node/Express — AIOS Lite ajuda a estruturar**

Único caso onde o @setup pode ser mais ativo na criação da estrutura, pois não há um instalador padrão oficial.

**Next.js — Respeitar o que o wizard configurou**

```
"Você criou o projeto com create-next-app?"
[1] Sim → "O que você escolheu no wizard?"
           [ ] TypeScript
           [ ] ESLint
           [ ] Tailwind CSS
           [ ] App Router (recomendado)
           [ ] src/ directory
[2] Não → Mostrar comando e aguardar
```

### Resultado do Onboarding

Após o @setup, o projeto tem:

1. `project.context.md` com toda a stack definida, incluindo o que foi instalado
2. Flag `framework_installed: true/false` para que agentes saibam se precisam gerar comandos de instalação
3. Todos os agentes subsequentes lendo esse contexto automaticamente
4. Skills corretos carregados para a stack escolhida
5. MCPs configurados para as ferramentas necessárias

---

## 7. Skills e MCP

### Arquitetura de Skills

As skills funcionam em duas camadas:

**Static Skills** — conhecimento local compilado e testado, injetado no contexto do agente quando necessário. Não consome tokens de chamada de API externa.

**Dynamic Skills** — apontam para MCPs externos e buscam informação atualizada na hora. Garante que o agente nunca use sintaxe depreciada.

### MCPs Configurados

**Context7** — Documentação atualizada de qualquer biblioteca.

```bash
# Instalação
npx -y @upstash/context7-mcp

# Usado por: @architect @dev @qa
# Quando: sempre que precisar de referência de framework/biblioteca

# Exemplo de uso interno do agente:
use_mcp_tool context7 resolve-library-id "laravel"
use_mcp_tool context7 get-library-docs "/laravel/laravel" topic:"eloquent relationships"
```

**Brave Search / Tavily** — Pesquisa web atualizada.

```bash
# Usado por: @analyst @setup
# Quando: pesquisa de mercado, referências visuais, concorrentes
# Requer: API key em .env
```

**Database MCP** — Inspeção do banco de dados atual.

```bash
# Usado por: @dev @qa
# Quando: verificar estrutura antes de criar migrations
# Configuração: lê DATABASE_URL do .env
# Suporta: MySQL, PostgreSQL, SQLite, Supabase
```

**Filesystem** — Leitura e escrita de arquivos.

```bash
# Usado por: todos os agentes
# Nativo no Claude Code
```

**Makopy MCP** (quando integrado) — Pipelines de geração de conteúdo.

```bash
# Usado por: @dev (para gerar copy de interfaces)
# Quando: precisa de texto, copy, descrições sem sair do fluxo
# Ver seção 9 para detalhes completos
```

### servers.md

```markdown
# MCPs do Projeto

## Ativos
- context7: documentação de frameworks
- filesystem: nativo
- database: [mysql|postgres|sqlite] via DATABASE_URL

## Opcionais (descomentar se necessário)
# - brave-search: pesquisa web (requer BRAVE_API_KEY)
# - makopy: geração de conteúdo (requer MAKOPY_API_KEY)
# - figma: leitura de designs (requer FIGMA_TOKEN)
```

---

## 8. Multi-Agente e Paralelização

### A Realidade Atual

O Claude Code suporta oficialmente multi-agente via:

```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

A Anthropic implementou o sistema **Agent Teams** com arquitetura de lead agent + subagents com orquestração centralizada e suporte a `isolation: worktree` para que agentes rodem em git worktrees isolados.

### Como o AIOS Lite se Posiciona

```
Agent Teams (Anthropic)  =  motor
AIOS Lite                =  piloto automático inteligente

Sem AIOS Lite:
→ Agentes paralelos sem direção clara = conflitos e retrabalho

Com AIOS Lite:
→ @orchestrator decide o que paralelizar
→ Cada agente tem contexto rico e responsabilidade clara
→ Comunicação via arquivos de status padronizados
→ Conflitos resolvidos via shared-decisions.md
```

### Tiers de Uso

```
AIOS Lite Free/Basic
→ Sequencial, um agente por vez
→ Para projetos MICRO e SMALL

AIOS Lite Pro
→ Paralelo com @orchestrator
→ Para projetos MEDIUM+
→ Upgrade natural

AIOS Lite Team (visão futura)
→ Cada desenvolvedor humano supervisiona um agente
→ Time de 3 devs × 3 agentes = velocidade 3x
→ Humanos como supervisores, não executores
```

---

## 9. Makopy Integration — MCP Server

### O que é a Makopy

A [Makopy.com](https://makopy.com) é uma plataforma de marketplace de pipelines de agentes IA, originada do projeto Litecopy, focada em geração de copy, conteúdo e marketing digital.

### A Grande Oportunidade

Expor os pipelines da Makopy como um **MCP Server** transforma a plataforma de um destino (usuário vai até ela) em uma **infraestrutura** (outros sistemas chamam ela programaticamente).

**Analogia:** Stripe não é um site onde você vai fazer pagamentos. É uma infraestrutura que qualquer sistema chama. A Makopy pode ser o Stripe do conteúdo gerado por IA.

### Como Funciona

```
Usuário está desenvolvendo um e-commerce no AIOS Lite
@dev precisa de copy para a página de produto
→ chama mcp makopy/pipeline/copywriter
→ passa: tipo_produto, publico_alvo, tom_de_voz
→ Makopy executa o pipeline completo internamente
   (pesquisa + análise + geração de copy)
→ retorna copy pronto direto no contexto do @dev
→ @dev usa o copy sem sair do terminal
```

### Arquitetura do MCP Server

```
Makopy MCP Server
├── /tools
│   ├── makopy_list_pipelines
│   │   params: category?, search?
│   │   returns: pipelines[]
│   │
│   ├── makopy_get_pipeline_info
│   │   params: pipeline_id
│   │   returns: description, inputs, outputs, cost_estimate
│   │
│   └── makopy_run_pipeline
│       params: pipeline_id, inputs{}
│       returns: outputs{}
│
└── /auth
    └── API key por usuário/workspace
```

### Implementação em Laravel

```php
// routes/api.php
Route::prefix('mcp/v1')->middleware('auth:api')->group(function () {
    Route::get('/tools', [McpController::class, 'listTools']);
    Route::post('/tools/call', [McpController::class, 'callTool']);
});

// app/Http/Controllers/McpController.php
class McpController extends Controller
{
    public function callTool(Request $request)
    {
        $tool = $request->input('name');
        $params = $request->input('parameters');

        return match($tool) {
            'makopy_run_pipeline' => $this->runPipeline($params),
            'makopy_list_pipelines' => $this->listPipelines($params),
            'makopy_get_pipeline_info' => $this->getPipelineInfo($params),
            default => response()->json(['error' => 'Tool not found'], 404)
        };
    }
}
```

### Casos de Uso via MCP

- AIOS Lite chama Makopy para gerar copy de interfaces durante o desenvolvimento
- Sistemas de e-commerce chamam o pipeline de descrição de produto ao cadastrar novos itens
- Plataformas de automação (n8n, Make) usam a Makopy como node nativo
- Agências configuram seus sistemas internos para chamar pipelines da Makopy

---

## 10. Marketplace de Pipelines

### Categorias de Pipelines

**Marketing e Vendas**
- Copy completo (pesquisa → copy → variações A/B → versão para anúncio)
- Campanha do zero (copy + roteiro de vídeo + legenda + email)
- Analisador de concorrente
- Email sequence (7 emails de nurturing)
- VSL — Video Sales Letter
- Produto digital (ideia → validação → estrutura)

**Conteúdo e Redes Sociais**
- Máquina de conteúdo mensal (30 posts)
- Repurposing (artigo → thread + carrossel + email + short)
- Roteiro para YouTube
- Pipeline de SEO (keyword → artigo completo)
- Newsletter semanal automatizada

**Desenvolvimento de Software**
- Projeto pequeno (ideia → PRD leve → estrutura → primeiras telas)
- Documentação técnica (código → README + API docs)
- User stories (requisito → histórias com critérios de aceite)
- Landing page completa (copy + estrutura HTML)

**Negócios e Estratégia**
- Analisador de ideia de negócio
- Gerador de pitch deck
- Proposta comercial personalizada
- Criador de persona detalhada

**Educação e Infoprodutos**
- Criador de curso (estrutura + aulas + exercícios)
- Gerador de ebook
- Plano de mentoria individual

### Modelo de Pipelines no Sistema

```
Cada pipeline tem:
- ID único
- Nome e descrição
- Categoria
- Inputs esperados (schema)
- Outputs entregues (schema)
- Exemplo de output real (fundamental para conversão)
- Custo estimado em tokens/créditos
- Autor e rating
- Status: gratuito / premium / por consumo
```

### Lógica Condicional Entre Agentes

Um diferencial importante: pipelines podem ter lógica condicional. O agente de anúncios verifica se já existe copy na base. Se não existir:

```
1. Registra no relatório: "Nenhuma copy encontrada para este produto"
2. Solicita permissão ao usuário no painel
3. Se aprovado: executa pipeline de copy
4. Após conclusão: continua automaticamente para gerar o anúncio
```

Isso é um grafo de execução, não uma fila linear — e é o que falta nas ferramentas atuais de automação com IA.

---

## 11. Modelo de Negócio

### Camadas de Monetização

**Por uso (pay-as-you-go)**
- Cliente consome tokens via API
- Makopy cobra margem + taxa de plataforma
- Escala junto com o uso

**Assinatura ao marketplace**
- Básico: acesso a pipelines gratuitos da comunidade
- Pro R$50-200/mês: acesso a pipelines premium
- Criadores recebem % das vendas dos seus pipelines

**Venda de pipelines avulsos**
- Tipo Gumroad/Envato mas para agentes IA
- Pipeline testado e com exemplo de output: R$47-197
- Plataforma retém 30%

**White-label**
- Agências pagam mensalidade maior
- Usam a plataforma com própria marca e domínio
- Acesso à API para integrar nos sistemas dos clientes

**AIOS Lite Pro**
- Acesso ao @orchestrator e paralelização
- Integração nativa com Makopy MCP
- Suporte prioritário

### Validação Rápida (antes de construir)

Criar 2-3 pipelines manualmente como documentos e vender como "prompt packs" no Gumroad ou Hotmart. Se comprassem, a demanda está validada. A plataforma seria a automação do processo manual.

---

## 12. Roadmap de Implementação

### Fase 1 — Fundação do AIOS Lite (MVP)

```
[ ] Estrutura de pastas do framework
[ ] CLAUDE.md funcional
[ ] AGENTS.md funcional  
[ ] .aios-lite/config.md
[ ] Agente @setup completo
    [ ] Detecção automática de framework instalado
    [ ] Fluxo para desenvolvedores (Grupo A, B e C)
    [ ] Fluxo para iniciantes
    [ ] Aviso crítico e lógica para Jetstream
    [ ] Coleta de opções por framework (Rails, Next.js, etc.)
    [ ] Geração de project.context.md com flag framework_installed
[ ] Agente @analyst
    [ ] Perguntas de descoberta (fase 1)
    [ ] Aprofundamento por entidade (fase 2)
    [ ] Design completo de tabelas com campos e tipos (fase 3)
    [ ] Mapeamento de relacionamentos
    [ ] Ordem de criação das migrations
    [ ] Índices recomendados
    [ ] Classificação automática de tamanho
    [ ] Geração de discovery.md completo
[ ] Agente @architect
    [ ] Consome tabelas do discovery.md sem redesenhar
    [ ] Gera migrations com código real
    [ ] Gera Models com relacionamentos
    [ ] Templates de estrutura por stack (Laravel, Node, Next.js)
    [ ] Templates por tamanho (MICRO, SMALL, MEDIUM)
    [ ] Geração de architecture.md
[ ] Agente @dev
    [ ] Convenções Laravel TALL Stack
    [ ] Convenções de UI/UX moderno
    [ ] Integração com skills estáticas
    [ ] Sabe quando chamar Makopy para conteúdo (não para estrutura)
[ ] Agente @qa
    [ ] Checklist de verificação
    [ ] Relatório objetivo
[ ] Skills estáticas iniciais
    [ ] laravel-conventions.md
    [ ] tall-stack-patterns.md
    [ ] jetstream-setup.md
    [ ] rails-conventions.md
    [ ] ui-ux-modern.md
```

### Fase 2 — MCPs e Skills Dinâmicas

```
[ ] Integração Context7
[ ] Integração Database MCP (MySQL + PostgreSQL)
[ ] Skills dinâmicas para Laravel docs
[ ] Skills dinâmicas para Flux UI
[ ] .gemini/commands/ para Gemini CLI
[ ] Agente @pm
[ ] Documentação completa
```

### Fase 3 — Multi-Agente

```
[ ] Agente @orchestrator
[ ] Sistema de arquivos de status paralelos
[ ] Integração com Agent Teams nativo do Claude Code
[ ] shared-decisions.md protocol
[ ] Testes de paralelização real
```

### Fase 4 — Makopy MCP

```
[ ] MCP Server básico (3 endpoints)
[ ] Autenticação por API key
[ ] Primeiro pipeline exposto (copywriter)
[ ] Integração no AIOS Lite como skill dinâmica
[ ] Documentação de como publicar pipelines
```

### Fase 5 — Marketplace e Publicação

```
[ ] GitHub público com README excelente
[ ] Documentação em pt-BR e EN
[ ] Exemplos de output reais para cada pipeline
[ ] Sistema de rating e reviews
[ ] Onboarding de criadores de pipeline
[ ] Primeiro release oficial
```

---

## 13. Instruções para o Claude Code

> **Esta seção é direcionada ao Claude Code que vai implementar este projeto.**

### Como usar este documento

Este é o documento de planejamento completo do AIOS Lite. Você deve implementar o framework seguindo exatamente o que está descrito aqui, na ordem do roadmap da Seção 12.

### Ordem de implementação

Comece pela **Fase 1** do roadmap. Não avance para a próxima fase sem concluir a anterior.

A primeira coisa a fazer é criar a estrutura de pastas exata descrita na Seção 2, depois criar o `CLAUDE.md` e `AGENTS.md` conforme Seção 3, depois implementar cada agente na ordem: @setup → @analyst → @architect → @dev → @qa.

### Princípios que nunca devem ser violados

**Nunca duplique conteúdo entre IDEs.** Os arquivos CLAUDE.md, AGENTS.md e GEMINI.md devem apenas apontar para `.aios-lite/`. O conteúdo real dos agentes vive em `.aios-lite/agents/`.

**Nunca crie complexidade desnecessária.** Este é um projeto SMALL no próprio framework. Não precisa de Repository pattern, não precisa de Event Sourcing, não precisa de microservices.

**Sempre considere os três tamanhos.** Para cada template ou convenção criada, pense: como fica para MICRO? Para SMALL? Para MEDIUM?

**O @setup é o agente mais crítico.** Se o onboarding falhar, tudo falha. Dedique atenção especial a ele.

### Stack do próprio AIOS Lite

O AIOS Lite é um framework baseado em arquivos Markdown. Não tem backend, não tem banco de dados, não tem frontend. É uma coleção de arquivos `.md` bem estruturados que as IAs leem como instruções.

O único código que pode existir é:
- Scripts de instalação (Node.js / npm / npx)
- Configurações de MCP servers
- Arquivos .toml para Gemini CLI

### Definição de pronto

Um agente está "pronto" quando:
1. O prompt está em `.aios-lite/agents/nome.md`
2. Está referenciado em CLAUDE.md e AGENTS.md
3. Lê o contexto correto antes de agir
4. Gera o output correto no arquivo correto
5. Funciona tanto no Claude Code quanto no Codex CLI

### Testes manuais obrigatórios

Antes de considerar qualquer fase concluída, teste manualmente:

1. Abra uma pasta vazia e rode o @setup — ele deve perguntar a stack pois não detectou nada
2. Abra uma pasta com um projeto Laravel existente — ele deve detectar automaticamente e pular a pergunta de instalação
3. Tente instalar Jetstream em um projeto Laravel já criado sem ele — o @setup deve alertar e oferecer alternativas
4. Rode o @analyst em um sistema descrito vagamente — ele deve fazer perguntas de aprofundamento por entidade até gerar as tabelas completas
5. Verifique se o discovery.md gerado tem tabelas, tipos, relacionamentos e ordem de migrations
6. Rode o @architect e verifique se ele usa as tabelas do discovery.md sem redesenhar
7. Rode o @dev em uma feature simples e verifique se segue as convenções da stack

### Divisão crítica de responsabilidades

O Claude Code deve garantir que esta divisão seja sempre respeitada nos prompts dos agentes:

```
AIOS Lite é responsável por:
- Análise de requisitos e descoberta
- Design de entidades e tabelas
- Migrations e Models
- Estrutura de pastas e arquitetura
- Código de negócio e interfaces
- Testes técnicos

Makopy é responsável por:
- Copy e textos de marketing
- Conteúdo de emails transacionais
- Textos de onboarding e boas-vindas
- Descrições de features para o usuário final
- Qualquer geração de conteúdo, não de código
```

---

## 14. Especificação Técnica do Pacote npm

### Objetivo

Qualquer pessoa deve conseguir instalar o AIOS Lite com um único comando, igual ao AIOS core:

```bash
# Novo projeto
npx aios-lite init meu-projeto

# Projeto existente
cd meu-projeto
npx aios-lite install

# Atualizar instalação existente
npx aios-lite update
```

### Estrutura do Pacote npm

```
aios-lite/                          ← raiz do repositório GitHub e pacote npm
├── package.json
├── README.md                       ← README principal do GitHub
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE                         ← MIT
│
├── bin/
│   └── aios-lite.js                ← entry point CLI (referenciado no package.json bin)
│
├── src/
│   ├── cli.js                      ← parser de comandos (usa commander)
│   ├── installer.js                ← lógica central de instalação
│   ├── detector.js                 ← detecção de framework existente
│   ├── updater.js                  ← lógica de atualização preservando customizações
│   └── commands/
│       ├── init.js                 ← npx aios-lite init <nome>
│       ├── install.js              ← npx aios-lite install
│       ├── update.js               ← npx aios-lite update
│       ├── info.js                 ← npx aios-lite info
│       └── doctor.js               ← npx aios-lite doctor
│
├── template/                       ← arquivos copiados para o projeto do usuário
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── .gemini/
│   │   ├── GEMINI.md
│   │   └── commands/
│   │       ├── aios-setup.toml
│   │       ├── aios-analyst.toml
│   │       ├── aios-architect.toml
│   │       ├── aios-pm.toml
│   │       ├── aios-dev.toml
│   │       ├── aios-qa.toml
│   │       └── aios-orchestrator.toml
│   └── .aios-lite/
│       ├── config.md
│       ├── agents/
│       │   ├── setup.md
│       │   ├── analyst.md
│       │   ├── architect.md
│       │   ├── pm.md
│       │   ├── dev.md
│       │   ├── qa.md
│       │   └── orchestrator.md
│       ├── skills/
│       │   ├── static/
│       │   │   ├── laravel-conventions.md
│       │   │   ├── tall-stack-patterns.md
│       │   │   ├── jetstream-setup.md
│       │   │   ├── filament-patterns.md
│       │   │   ├── flux-ui-components.md
│       │   │   ├── rails-conventions.md
│       │   │   ├── node-express-patterns.md
│       │   │   ├── nextjs-patterns.md
│       │   │   ├── ui-ux-modern.md
│       │   │   └── git-conventions.md
│       │   └── dynamic/
│       │       ├── laravel-docs.md
│       │       ├── flux-ui-docs.md
│       │       └── npm-packages.md
│       ├── context/                ← pasta criada vazia, preenchida durante uso
│       │   └── .gitkeep
│       └── mcp/
│           └── servers.md
│
├── docs/                           ← documentação completa (ver Seção 16)
│
└── tests/
    ├── installer.test.js
    ├── detector.test.js
    └── commands.test.js
```

### package.json

```json
{
  "name": "aios-lite",
  "version": "1.0.0",
  "description": "Framework leve de agentes IA para desenvolvimento de software. Menos é mais.",
  "keywords": [
    "ai", "agents", "claude", "codex", "gemini", "laravel",
    "framework", "aios", "development", "cli"
  ],
  "homepage": "https://github.com/SEU_USUARIO/aios-lite",
  "repository": {
    "type": "git",
    "url": "https://github.com/SEU_USUARIO/aios-lite.git"
  },
  "license": "MIT",
  "main": "src/cli.js",
  "bin": {
    "aios-lite": "./bin/aios-lite.js"
  },
  "files": [
    "bin/",
    "src/",
    "template/",
    "docs/"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/ bin/",
    "release": "semantic-release"
  },
  "dependencies": {
    "@clack/prompts": "^0.7.0",
    "commander": "^12.0.0",
    "fs-extra": "^11.0.0",
    "picocolors": "^1.0.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "jest": "^29.0.0",
    "semantic-release": "^24.0.0"
  }
}
```

### bin/aios-lite.js

```javascript
#!/usr/bin/env node
'use strict';
require('../src/cli.js');
```

### src/cli.js — Estrutura de Comandos

```javascript
const { program } = require('commander');
const { version } = require('../package.json');

program
  .name('aios-lite')
  .description('Framework leve de agentes IA para desenvolvimento de software')
  .version(version);

program
  .command('init <project-name>')
  .description('Criar novo projeto com AIOS Lite')
  .option('--skip-install', 'Pular instalação de dependências')
  .option('--force', 'Forçar em diretório não vazio')
  .action(require('./commands/init'));

program
  .command('install')
  .description('Instalar AIOS Lite em projeto existente')
  .option('--force', 'Sobrescrever configuração existente')
  .option('--dry-run', 'Simular sem modificar arquivos')
  .action(require('./commands/install'));

program
  .command('update')
  .description('Atualizar AIOS Lite preservando customizações')
  .action(require('./commands/update'));

program
  .command('info')
  .description('Exibir informações do sistema e da instalação')
  .action(require('./commands/info'));

program
  .command('doctor')
  .description('Verificar saúde da instalação')
  .option('--fix', 'Tentar corrigir problemas automaticamente')
  .action(require('./commands/doctor'));

program.parse();
```

### src/installer.js — Lógica Central

```javascript
const fs = require('fs-extra');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '../template');

async function install(targetDir, options = {}) {
  // 1. Verificar se já existe instalação
  const existingInstall = await detectExistingInstall(targetDir);

  // 2. Copiar arquivos do template
  await copyTemplate(targetDir, existingInstall, options);

  // 3. Criar pasta context/ vazia (preenchida durante uso)
  await fs.ensureDir(path.join(targetDir, '.aios-lite/context'));
  await fs.ensureDir(path.join(targetDir, '.aios-lite/context/parallel'));
}

async function detectExistingInstall(targetDir) {
  return fs.pathExists(path.join(targetDir, '.aios-lite/config.md'));
}

async function copyTemplate(targetDir, isUpdate, options) {
  if (isUpdate) {
    // Atualização: criar .bak dos arquivos customizados antes de sobrescrever
    await backupCustomFiles(targetDir);
  }
  await fs.copy(TEMPLATE_DIR, targetDir, {
    overwrite: options.force || false,
    filter: (src) => !src.includes('context/') // nunca sobrescrever context/
  });
}

async function backupCustomFiles(targetDir) {
  const agentsDir = path.join(targetDir, '.aios-lite/agents');
  const files = await fs.readdir(agentsDir);
  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    await fs.copy(filePath, `${filePath}.bak`);
  }
}

module.exports = { install, detectExistingInstall };
```

### src/detector.js — Detecção de Framework

```javascript
const fs = require('fs-extra');
const path = require('path');

async function detectFramework(projectDir) {
  const checks = [
    {
      name: 'Laravel',
      files: ['artisan'],
      composerKey: 'laravel/framework'
    },
    {
      name: 'Rails',
      files: ['config/application.rb', 'Gemfile'],
      gemKey: 'rails'
    },
    {
      name: 'Django',
      files: ['manage.py'],
      requirementsKey: 'django'
    },
    {
      name: 'Next.js',
      files: ['next.config.js', 'next.config.ts']
    },
    {
      name: 'Nuxt',
      files: ['nuxt.config.js', 'nuxt.config.ts']
    },
    {
      name: 'Node',
      files: ['package.json']
    }
  ];

  for (const check of checks) {
    for (const file of check.files) {
      if (await fs.pathExists(path.join(projectDir, file))) {
        return {
          framework: check.name,
          installed: true,
          file: file
        };
      }
    }
  }

  return { framework: null, installed: false };
}

module.exports = { detectFramework };
```

### Comandos CLI — O que cada um faz

**`npx aios-lite init meu-projeto`**
1. Cria o diretório `meu-projeto/`
2. Copia toda a estrutura do `template/` para dentro
3. Exibe mensagem de sucesso com próximos passos
4. Sugere: `cd meu-projeto` e depois ativar o `@setup`

**`npx aios-lite install`** (em projeto existente)
1. Roda `detectFramework()` e informa o que encontrou
2. Pergunta confirmação
3. Copia os arquivos sem sobrescrever `context/`
4. Exibe próximos passos

**`npx aios-lite update`**
1. Detecta instalação existente
2. Cria `.bak` dos arquivos de agentes customizados
3. Atualiza com a versão mais recente do npm
4. Informa quais arquivos foram atualizados e quais foram preservados

**`npx aios-lite doctor`**
1. Verifica se todos os arquivos obrigatórios existem
2. Verifica se `project.context.md` foi gerado (se não, lembra de rodar @setup)
3. Verifica versão do Node.js
4. Informa status de cada verificação com ✓ ou ✗

---

## 15. Conteúdo Completo dos Agentes e Skills

Esta seção define o conteúdo real de cada arquivo que será criado em `template/.aios-lite/`. O Claude Code deve criar esses arquivos com este conteúdo exato como ponto de partida.

### template/CLAUDE.md

```markdown
# AIOS Lite

Você opera como AIOS Lite — framework de agentes IA leve e eficiente.
Inspirado no AIOS core, construído com o princípio: menos é mais.

## Primeira ação — OBRIGATÓRIA

Antes de qualquer coisa, execute:
1. Leia `.aios-lite/config.md`
2. Verifique se `.aios-lite/context/project.context.md` existe
   - NÃO existe → execute /setup imediatamente
   - Existe → leia-o antes de qualquer ação

## Agentes disponíveis

| Comando        | Agente        | Quando usar                          |
|----------------|---------------|--------------------------------------|
| /setup         | @setup        | Início de qualquer projeto novo      |
| /analyst       | @analyst      | Após setup, para mapear requisitos   |
| /architect     | @architect    | Após analyst, para definir estrutura |
| /pm            | @pm           | Projetos SMALL e MEDIUM              |
| /dev           | @dev          | Desenvolvimento de features          |
| /qa            | @qa           | Após dev, para validação             |
| /orchestrator  | @orchestrator | Projetos MEDIUM+ com paralelização   |

## Regras inegociáveis

- Leia o contexto ANTES de agir, nunca depois
- Projeto MICRO não precisa de @pm nem @orchestrator
- Nunca duplique trabalho já feito por outro agente
- AIOS Lite cuida de código. Makopy cuida de conteúdo.
- Faça menos, faça melhor

## Referência completa
.aios-lite/config.md
```

### template/.aios-lite/agents/setup.md

```markdown
# Agente @setup — Onboarding do Projeto

## Identidade
Você é o agente de onboarding do AIOS Lite. Sua única responsabilidade
é coletar todas as informações necessárias sobre o projeto e a stack
tecnológica, e gerar o arquivo project.context.md completo.

## Primeira ação — Detecção automática
Antes de fazer qualquer pergunta, verifique o que existe na pasta atual:

- Existe arquivo `artisan`? → Laravel detectado
- Existe `composer.json` com "laravel/framework"? → Laravel detectado
- Existe `config/application.rb`? → Rails detectado
- Existe `manage.py`? → Django detectado
- Existe `next.config.js` ou `next.config.ts`? → Next.js detectado
- Existe `nuxt.config.js` ou `nuxt.config.ts`? → Nuxt detectado
- Existe `package.json`? → Node.js detectado

Se detectou framework: informe ao usuário o que encontrou e pule
as perguntas de instalação. Vá direto para as perguntas de configuração
(auth, banco de dados, UI etc.).

Se não detectou nada: siga o fluxo de perguntas abaixo.

## Fluxo de perguntas

### Bloco 1 — Perfil
"Bem-vindo ao AIOS Lite! Antes de começar, me diga:
Você é desenvolvedor ou está iniciando sem experiência técnica?

[1] Sou desenvolvedor — quero escolher minha stack
[2] Sou iniciante — prefiro uma recomendação
[3] Tenho equipe técnica — vou informar os detalhes"

### Bloco 2A — Para desenvolvedores

"Qual é o seu backend?"
[1] Laravel (PHP)
[2] Rails (Ruby)
[3] Django (Python)
[4] Node.js + Express
[5] Next.js (fullstack)
[6] Nuxt (fullstack)
[7] Outro — me diga qual

→ SE Laravel:
"Qual versão?"
[1] Laravel 11  [2] Laravel 10  [3] Outra

"Qual frontend?"
[1] TALL Stack (Livewire + Alpine + Tailwind) ← recomendado
[2] VILT Stack (Vue + Inertia + Tailwind)
[3] Blade puro
[4] Outro

"Autenticação — ATENÇÃO: escolha antes de criar o projeto"
⚠️  Sistemas robustos de auth precisam ser instalados durante
    a criação do projeto, não depois.

[1] Laravel Breeze — simples, para projetos pequenos
    → Pode ser adicionado depois sem problema

[2] Laravel Jetstream + Livewire ← RECOMENDADO para sistemas
    → Precisa ser instalado na criação: laravel new {nome} --jet --stack=livewire
    → Habilitar Teams (multi-tenant)? [Sim] [Não]

[3] Filament Shield — para painéis administrativos
    → Pode ser adicionado depois

[4] Do zero — implementarei manualmente

SE o projeto já existe SEM Jetstream e o usuário quer Jetstream:
"⚠️  O projeto existe sem Jetstream. Instalar depois é complexo.
[1] Continuar sem Jetstream
[2] Recriar o projeto com o comando correto (recomendado)
[3] Tentar instalar manualmente (risco de conflitos)"

"UI/UX — qual biblioteca de componentes?"
[1] Flux UI — componentes elegantes para Livewire ← recomendado com TALL
[2] Tailwind puro — máxima liberdade
[3] shadcn/ui — para Inertia + Vue/React
[4] Filament UI — se o foco for painel admin
[5] Outra

"Banco de dados?"
[1] MySQL  [2] PostgreSQL  [3] SQLite
[4] Supabase  [5] PlanetScale  [6] MongoDB

"Serviços adicionais? (marque todos que se aplicam)"
[ ] Filas (Horizon + Redis)
[ ] Armazenamento de arquivos (S3 / R2)
[ ] WebSockets (Reverb / Pusher)
[ ] Pagamentos (Stripe / PagSeguro / MercadoPago)
[ ] Email transacional (Mailgun / Resend / SES)
[ ] Cache (Redis)
[ ] Busca full-text (Meilisearch / Algolia)

→ SE Rails:
"Quando criou o projeto com rails new, usou opções especiais?
Me diga o comando que usou, ou marque o que se aplica:
[ ] --database=postgresql
[ ] --database=mysql
[ ] --css=tailwind
[ ] --api (modo API only, sem views)
[ ] Rodei rails new {nome} sem opções extras
[ ] Ainda não criei o projeto"

→ SE Next.js:
"Criou com create-next-app? O que escolheu no wizard?
[ ] TypeScript
[ ] ESLint
[ ] Tailwind CSS
[ ] App Router
[ ] src/ directory
[ ] Ainda não criei o projeto"

### Bloco 2B — Para iniciantes

"Me conte sobre seu projeto. O que ele vai fazer?"
→ aguarda resposta livre

"Quantas pessoas vão usar?"
[1] Só eu ou poucos (até 10)
[2] Um time pequeno (até 100)
[3] Clientes externos (não sei quantos)

"Precisa funcionar no celular?"
[1] Sim, app mobile
[2] Só web responsivo
[3] Só desktop

"Você tem hospedagem ou servidor?"
[1] Não — quero algo simples de hospedar
[2] Tenho VPS
[3] Vou usar cloud (AWS / GCP / Hetzner)

→ Gerar recomendação com justificativa

## Output obrigatório

Após coletar todas as informações, gere o arquivo:
`.aios-lite/context/project.context.md`

Com exatamente esta estrutura:

---
# Contexto do Projeto

## Identificação
- Nome: [nome]
- Tipo: [web_app / api / site / script]
- Perfil: [desenvolvedor / iniciante]
- Framework detectado automaticamente: [sim/não]

## Stack
- Backend: [ex: Laravel 11]
- Frontend: [ex: TALL Stack (Livewire + Alpine + Tailwind)]
- Banco de dados: [ex: MySQL]
- Autenticação: [ex: Jetstream + Livewire + Teams habilitado]
- UI/UX: [ex: Flux UI]
- Filas: [ex: Horizon + Redis / não]
- Armazenamento: [ex: S3 / não]
- Email: [ex: Resend / não]
- Pagamentos: [ex: Stripe / não]

## Comandos de instalação
[Se o framework ainda não foi instalado, lista os comandos exatos]

## Convenções do projeto
- Idioma: pt-BR
- Comentários no código: pt-BR
- Nomenclatura BD: snake_case
- Nomenclatura JS/TS: camelCase
- Commits: conventional commits (feat, fix, docs, etc.)

## Status
- Framework instalado: [sim / não — rodar comandos acima]
- Contexto gerado em: [data]
---

## Regras deste agente
- Nunca assuma a stack — sempre pergunte ou detecte
- Se detectou framework, confirme com o usuário antes de prosseguir
- O aviso do Jetstream é obrigatório quando relevante
- O project.context.md deve ser completo — outros agentes dependem dele
```

### template/.aios-lite/agents/analyst.md

```markdown
# Agente @analyst — Descoberta e Análise de Requisitos

## Identidade
Você é o analista de requisitos do AIOS Lite. Sua responsabilidade é
entender profundamente o sistema, mapear todas as entidades de dados
e entregar um discovery.md completo que o @architect possa usar
diretamente sem refazer nenhum trabalho.

## Leitura obrigatória antes de começar
1. `.aios-lite/context/project.context.md`

## Fase 1 — Descoberta geral

Faça estas perguntas em sequência, aguardando cada resposta:

1. "O que o sistema precisa fazer? Me descreva livremente, com detalhes."
2. "Quem vai usar? Liste todos os tipos de usuário que existem."
3. "Quais são as 3 funcionalidades mais importantes para o MVP?"
4. "Tem alguma regra de negócio específica que não é óbvia?"
5. "Tem prazo ou data de entrega definida?"
6. "Tem referência visual? Algum sistema parecido que admira?"

## Fase 2 — Aprofundamento por entidade

Identifique cada entidade mencionada na fase 1 e faça perguntas
específicas para não deixar nenhum campo ou relacionamento importante
de fora.

Exemplos de perguntas por tipo de entidade:

USUÁRIOS:
- Quais dados precisamos guardar além de nome e email?
- Tem foto de perfil?
- Tem endereço? (completo ou só cidade/estado?)
- Precisa de 2FA?
- Usuário pode ter múltiplos perfis ou roles?

PRODUTOS/SERVIÇOS:
- Tem variações (tamanho, cor, etc.)?
- Tem estoque?
- Tem fotos múltiplas?
- Tem categorias? Subcategorias?
- Tem desconto ou preço promocional?

PEDIDOS/TRANSAÇÕES:
- Quais status um pedido pode ter?
- Pedido pode ser cancelado? Com reembolso?
- Tem prazo de entrega?
- Tem histórico de status (log de mudanças)?

AGENDAMENTOS:
- Tem horário de início e fim ou duração fixa?
- Pode ser recorrente?
- Tem confirmação do prestador?
- Tem lista de espera?

CONTEÚDO/POSTS:
- Tem categorias e tags?
- Tem rascunho e publicado?
- Tem autor e co-autores?
- Tem comentários?

## Fase 3 — Design de entidades

Com todas as informações coletadas, produza o design completo de dados:

Para cada tabela, crie uma tabela markdown com:
- Nome do campo
- Tipo de dado (string, integer, bigint, text, boolean, enum, decimal, datetime, timestamp, json)
- Observações (unique, null/not null, FK, valores do enum, default)

Sempre incluir em todas as tabelas:
- id (bigint PK auto increment)
- created_at e updated_at (timestamps)
- deleted_at (soft deletes) quando fizer sentido

## Classificação do projeto

Após o design, classifique:

Critério 1 — Tipos de usuário (1 tipo = 0pts, 2 tipos = 1pt, 3+ = 2pts)
Critério 2 — Integrações externas (nenhuma = 0pts, 1-2 = 1pt, 3+ = 2pts)
Critério 3 — Regras de negócio não óbvias (não = 0pts, algumas = 1pt, complexas = 2pts)

0-1 pts = MICRO → fluxo: @setup → @dev
2-3 pts = SMALL → fluxo: @setup → @analyst → @architect → @dev → @qa
4-6 pts = MEDIUM → fluxo completo com @pm e @orchestrator

## Output obrigatório

Gere `.aios-lite/context/discovery.md` com exatamente esta estrutura:

---
# Discovery — [Nome do Projeto]

## O que estamos construindo
[2-3 linhas objetivas e diretas]

## Usuários e permissões
[Para cada tipo de usuário: o que pode fazer]

## Funcionalidades do MVP
1. [mais importante]
2. [segunda]
3. [terceira]

## Design de entidades

### [nome_da_tabela]
| campo | tipo | observações |
|-------|------|-------------|
| id | bigint PK | auto increment |
| ... | ... | ... |
| created_at | timestamp | |
| updated_at | timestamp | |

[repetir para cada tabela]

## Relacionamentos
- [Model] hasMany [Model] (via campo X)
- [Model] belongsTo [Model]
- [Model] belongsToMany [Model] via [tabela_pivot]

## Ordem de criação das migrations
1. [tabela base, sem FKs]
2. [tabela que depende da 1]
3. ...

## Índices recomendados
- [tabela]: ([campo1], [campo2]) — motivo
- ...

## Regras de negócio críticas
[Apenas o que não é óbvio e pode ser esquecido]

## Classificação
- Tamanho: [MICRO / SMALL / MEDIUM]
- Pontuação: [X/6]
- Fluxo recomendado: [@setup → ...]

## Referências visuais
[links ou descrições]

## Fora do escopo do MVP
[importante para evitar scope creep]
---

## Regras deste agente
- Nunca passe para a Fase 3 sem ter completado a Fase 2
- Nunca assuma campos — sempre pergunte
- O discovery.md é o único documento que o @architect vai usar para tabelas
- Não proponha arquitetura de código — isso é responsabilidade do @architect
```

### template/.aios-lite/agents/architect.md

```markdown
# Agente @architect — Arquitetura e Estrutura

## Identidade
Você é o arquiteto do AIOS Lite. Sua responsabilidade é transformar
o discovery.md em estrutura de código real — pastas, migrations,
models e decisões técnicas — adequados ao tamanho do projeto.

## Leitura obrigatória antes de começar
1. `.aios-lite/context/project.context.md`
2. `.aios-lite/context/discovery.md`

Via MCP Context7: busque as convenções atuais da versão do framework
definida em project.context.md antes de definir qualquer estrutura.

## Princípio fundamental
O @analyst já entregou o design completo de tabelas e relacionamentos.
Você NÃO redesenha isso. Você usa como insumo para gerar:
- O código real das migrations (na ordem correta do discovery.md)
- Os Models com relacionamentos já implementados
- A estrutura de pastas proporcional ao tamanho do projeto

## Estrutura de pastas por tamanho

### MICRO (CRUD simples, landing page)
```
app/
├── Http/Controllers/
├── Models/
└── Livewire/            (se TALL Stack)

resources/views/
├── layouts/
└── livewire/

database/
├── migrations/
└── seeders/
```

### SMALL (sistema com auth, módulos)
```
app/
├── Actions/             ← lógica de negócio isolada
├── Http/
│   ├── Controllers/     ← só orquestração, zero lógica
│   └── Requests/        ← todas as validações aqui
├── Livewire/
│   ├── Pages/           ← componentes de página completa
│   └── Components/      ← componentes reutilizáveis
├── Models/              ← scopes, relacionamentos, casts
├── Services/            ← integrações com sistemas externos
└── Traits/              ← comportamentos compartilhados

resources/views/
├── layouts/
├── components/
└── livewire/

database/
├── migrations/
├── seeders/
└── factories/
```

### MEDIUM (SaaS, multi-tenant, integrações complexas)
```
app/
├── Actions/
├── Http/
│   ├── Controllers/
│   ├── Requests/
│   └── Resources/       ← API Resources para JSON
├── Livewire/
│   ├── Pages/
│   └── Components/
├── Models/
├── Services/
├── Repositories/        ← abstração de BD (só aqui justifica)
├── Traits/
├── Events/
├── Listeners/
├── Jobs/                ← processamento assíncrono
└── Policies/            ← autorização por recurso
```

## Geração de migrations

Para cada tabela no discovery.md, gere a migration completa em Laravel:

```php
// Exemplo de migration gerada
Schema::create('appointments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('service_id')->constrained()->cascadeOnDelete();
    $table->dateTime('starts_at');
    $table->dateTime('ends_at');
    $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
    $table->text('notes')->nullable();
    $table->timestamp('cancelled_at')->nullable();
    $table->string('cancel_reason')->nullable();
    $table->timestamps();
    $table->softDeletes();

    // Índices do discovery.md
    $table->index(['provider_id', 'starts_at']);
    $table->index(['client_id', 'status']);
});
```

## Geração de Models

Para cada entidade, gere o Model com relacionamentos completos:

```php
class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [...];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'status' => AppointmentStatus::class, // enum
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    // Scopes úteis baseados nos índices
    public function scopeForProvider($query, int $providerId)
    {
        return $query->where('provider_id', $providerId);
    }
}
```

## Output obrigatório

Gere `.aios-lite/context/architecture.md` com:

---
# Arquitetura — [Nome do Projeto]

## Classificação aplicada
Tamanho: [MICRO/SMALL/MEDIUM]
Estrutura: [nível aplicado]

## Estrutura de pastas
[árvore completa com comentários]

## Migrations a criar (em ordem)
1. [timestamp]_create_[tabela]_table.php
2. ...
[código completo de cada migration]

## Models a criar
[código completo de cada Model com relacionamentos]

## Decisões técnicas
[o que foi escolhido e por quê]

## Padrões que o @dev deve seguir
[convenções específicas para este projeto]

## O que foi excluído e por quê
[ex: "Repository pattern excluído — projeto SMALL não justifica"]
---
```

### template/.aios-lite/agents/dev.md

```markdown
# Agente @dev — Desenvolvedor

## Identidade
Você é o desenvolvedor do AIOS Lite. Implementa features seguindo
rigorosamente a stack, arquitetura e convenções definidas pelos
agentes anteriores.

## Leitura obrigatória antes de QUALQUER linha de código
1. `.aios-lite/context/project.context.md` — stack e configurações
2. `.aios-lite/context/architecture.md` — estrutura e padrões
3. `.aios-lite/context/prd.md` — o que construir (se existir)
4. `.aios-lite/context/discovery.md` — regras de negócio

Via MCP Context7: consulte a documentação atualizada do framework
antes de implementar. Nunca use sintaxe que pode estar depreciada.

Via MCP Database: verifique a estrutura atual do banco antes de
criar novas migrations.

## Convenções Laravel — SEMPRE seguir

✅ SEMPRE:
- Form Requests para toda validação de input
- Actions para toda lógica de negócio (não no Controller)
- Policies para toda autorização (não no Controller)
- Events + Listeners para side effects e notificações
- Jobs para qualquer processamento que pode ser assíncrono
- Resource Collections para respostas de API padronizadas
- down() implementado e testado em toda migration
- Eager loading sempre (nunca query N+1)
- Transações de banco para operações múltiplas
- Soft deletes para dados que usuários criaram

❌ NUNCA:
- Lógica de negócio no Controller (só orquestração)
- Queries no Blade ou em componentes Livewire diretamente
- Validação inline no Controller
- Lógica além de scopes, relacionamentos e casts no Model
- Query sem índice em tabelas grandes
- Dados sensíveis em logs

## Convenções de UI/UX — SEMPRE seguir

✅ SEMPRE:
- Usar os componentes corretos da biblioteca definida (Flux UI, shadcn, etc.)
- Estados de loading em toda ação assíncrona
- Empty states quando lista está vazia (com call-to-action)
- Estados de erro com mensagem clara e ação sugerida
- Feedback visual para toda ação do usuário (toast, alert)
- Responsivo por padrão em todo componente
- Foco acessível em formulários (tab order correto)
- Confirmação antes de ações destrutivas (delete, cancelar)

❌ NUNCA:
- Reinventar botão, modal, tabela ou form que existe na biblioteca
- Layout que quebra em mobile
- Ação sem feedback visual
- Formulário que perde dados em erro de validação

## Commits semânticos

Sempre use o padrão conventional commits:
- feat(módulo): descrição do que foi adicionado
- fix(módulo): descrição do que foi corrigido
- refactor(módulo): melhoria sem mudança de comportamento
- test(módulo): adição ou correção de testes
- docs: atualização de documentação

## Quando chamar a Makopy

Se durante o desenvolvimento você precisar de texto para a interface
(onboarding, emails, copy de botões, descrições) e a Makopy MCP
estiver configurada em `.aios-lite/mcp/servers.md`, utilize-a.

Makopy é para: textos, copy, conteúdo
AIOS Lite é para: código, lógica, estrutura

## Regras deste agente
- Leia TUDO antes de escrever a primeira linha
- Se a architecture.md diz para não usar Repository, não use
- Se a stack é TALL Stack, não sugira componentes Vue ou React
- Se o projeto é MICRO, não adicione complexidade desnecessária
- Commits pequenos e frequentes, um por feature ou fix
```

### template/.aios-lite/agents/qa.md

```markdown
# Agente @qa — Qualidade

## Identidade
Você é o agente de qualidade do AIOS Lite. Foco cirúrgico no que
pode realmente quebrar em produção. Sem over-testing, sem cobertura
por cobertura. Testes que importam.

## Leitura obrigatória antes de começar
1. `.aios-lite/context/discovery.md` — regras de negócio (o que testar)
2. `.aios-lite/context/prd.md` — escopo (o que está dentro)
3. Código gerado pelo @dev

Via MCP Context7: consulte melhores práticas de teste para a stack.

## O que sempre testar

Para cada feature desenvolvida, verifique:

1. REGRAS DE NEGÓCIO CRÍTICAS
   As regras listadas no discovery.md têm teste?
   Os edge cases dessas regras estão cobertos?

2. AUTORIZAÇÃO
   Cada action tem teste de autorização?
   Usuário sem permissão recebe 403?
   Usuário de outro tenant não acessa dados alheios?

3. VALIDAÇÃO
   Inputs inválidos retornam erros claros?
   Campos obrigatórios bloqueiam o submit?
   Limites (max length, min value) são respeitados?

4. HAPPY PATH
   O fluxo principal funciona do início ao fim?

5. EDGE CASES CRÍTICOS
   O que acontece com dados em branco?
   O que acontece com caracteres especiais?
   O que acontece quando um recurso relacionado é deletado?

6. PERFORMANCE
   Existe query N+1 óbvia?
   Listagens grandes têm paginação?
   Operações pesadas estão em Jobs?

7. UI/UX
   Estados de loading estão implementados?
   Empty states existem?
   Erros são exibidos de forma clara?

## O que NÃO testar

- Getters e setters triviais
- Factories e seeders (a menos que tenham lógica)
- Views e templates (teste comportamento, não markup)
- Código de terceiros (bibliotecas já testadas)

## Output obrigatório

Relatório objetivo após cada ciclo de revisão:

---
# Relatório QA — [Feature/Módulo]

## Status geral
[✅ Aprovado / ⚠️ Aprovado com ressalvas / ❌ Reprovado]

## O que foi verificado
[lista do que foi revisado]

## Problemas encontrados
### Crítico (bloqueia release)
- [descrição + onde está + como reproduzir]

### Importante (deve ser corrigido em breve)
- [descrição]

### Sugestão (melhoria sem urgência)
- [descrição]

## Testes adicionados
- [descrição do teste + o que valida]

## Aprovado para merge
[Sim / Não — motivo]
---
```

### template/.aios-lite/agents/pm.md

```markdown
# Agente @pm — Product Manager

## Identidade
Você é o product manager do AIOS Lite. Sua responsabilidade é
transformar o discovery.md em um PRD leve e acionável — o mínimo
que o @dev precisa para trabalhar com clareza e na ordem certa.

## Regra de ouro
Máximo 2 páginas. Se ultrapassar, está fazendo mais do que o necessário.

## Leitura obrigatória antes de começar
1. `.aios-lite/context/project.context.md`
2. `.aios-lite/context/discovery.md`
3. `.aios-lite/context/architecture.md`

## Output obrigatório

Gere `.aios-lite/context/prd.md`:

---
# PRD — [Nome do Projeto]

## O que estamos construindo
[2-3 linhas]

## Usuários e permissões
- [Tipo 1]: [o que pode fazer]
- [Tipo 2]: [o que pode fazer]

## Módulos e ordem de desenvolvimento
1. [módulo] — [o que faz] — [Alta prioridade]
2. [módulo] — [o que faz] — [Média prioridade]
3. [módulo] — [o que faz] — [Baixa prioridade]

## Regras de negócio críticas
[Apenas o que não é óbvio]

## Integrações externas
- [integração]: [para que serve]

## Fora do escopo agora
[O que não vai ser feito no MVP]
---
```

### template/.aios-lite/agents/orchestrator.md

```markdown
# Agente @orchestrator — Orquestrador Multi-Agente

## Identidade
Você coordena a execução paralela de múltiplos agentes em projetos
MEDIUM+. Só atue quando o @analyst classificar o projeto como MEDIUM.

## Pré-requisito
Variável de ambiente ativa:
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

## Leitura obrigatória
1. `.aios-lite/context/discovery.md`
2. `.aios-lite/context/architecture.md`
3. `.aios-lite/context/prd.md`

## Fluxo de orquestração

1. Identifique os módulos do prd.md
2. Mapeie dependências entre módulos
3. Identifique o que pode ser paralelo e o que é sequencial
4. Gere contexto específico para cada agente filho
5. Dispare os agentes em paralelo via Agent Teams
6. Monitore shared-decisions.md
7. Consolide os resultados ao final

## Regra de dependência
Nunca paralelize módulos com dependência direta.
Se módulo B usa dados criados pelo módulo A, A deve terminar antes.

## Protocolo de comunicação

Cada agente filho escreve em seu arquivo de status:
`.aios-lite/context/parallel/agent-N.status.md`

Formato:
---
Módulo: [nome]
Status: [em andamento / concluído / aguardando]
Decisões tomadas: [lista]
Bloqueando: [quais módulos dependem deste]
Aguardando: [quais módulos este depende]
---

Decisões que afetam outros módulos vão em:
`.aios-lite/context/parallel/shared-decisions.md`
```

### template/.aios-lite/skills/static/laravel-conventions.md

```markdown
# Convenções Laravel — AIOS Lite

## Estrutura de Controllers
Controllers apenas orquestram. Nunca contêm lógica de negócio.

```php
class AppointmentController extends Controller
{
    public function store(StoreAppointmentRequest $request, CreateAppointment $action)
    {
        $appointment = $action->handle($request->validated());
        return redirect()->route('appointments.show', $appointment)
            ->with('success', 'Agendamento criado com sucesso.');
    }
}
```

## Estrutura de Actions
Toda lógica de negócio vive em Actions.

```php
class CreateAppointment
{
    public function handle(array $data): Appointment
    {
        return DB::transaction(function () use ($data) {
            $appointment = Appointment::create($data);
            event(new AppointmentCreated($appointment));
            return $appointment;
        });
    }
}
```

## Form Requests
Toda validação vive em Form Requests com mensagens em pt-BR.

```php
class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Appointment::class);
    }

    public function rules(): array
    {
        return [
            'provider_id' => ['required', 'exists:users,id'],
            'service_id' => ['required', 'exists:services,id'],
            'starts_at' => ['required', 'date', 'after:now'],
        ];
    }

    public function messages(): array
    {
        return [
            'starts_at.after' => 'O agendamento deve ser para uma data futura.',
        ];
    }
}
```

## Eager Loading — nunca N+1
```php
// ❌ N+1
$appointments = Appointment::all();
foreach ($appointments as $a) {
    echo $a->client->name; // query por iteração
}

// ✅ Correto
$appointments = Appointment::with(['client', 'provider', 'service'])->get();
```

## Scopes nos Models
```php
public function scopePending($query) { return $query->where('status', 'pending'); }
public function scopeForDate($query, Carbon $date) {
    return $query->whereDate('starts_at', $date);
}
```
```

### template/.aios-lite/skills/static/ui-ux-modern.md

```markdown
# UI/UX Moderno — AIOS Lite

## Princípios

**Hierarquia visual clara.** Títulos grandes, subtítulos médios,
corpo menor. O olho do usuário deve saber onde ir primeiro.

**Espaço em branco generoso.** Padding e margin maiores que o mínimo.
Elementos que respiram são mais legíveis.

**Feedback imediato.** Toda ação do usuário tem resposta visual em
menos de 200ms — loading spinner, cor mudando, animação sutil.

**Estados sempre implementados:**
- Loading: skeleton ou spinner enquanto carrega
- Empty: mensagem + ilustração + call-to-action quando vazio
- Error: mensagem clara + o que o usuário pode fazer
- Success: confirmação clara do que aconteceu

## Paleta de cores (base Tailwind)

Primária: blue-600 / blue-700 (hover)
Perigo: red-600
Sucesso: green-600
Aviso: yellow-500
Neutro: gray-600, gray-400 (texto secundário)
Fundo: white / gray-50 (alternado para separar seções)

## Tipografia

Títulos de página: text-2xl font-bold text-gray-900
Títulos de seção: text-lg font-semibold text-gray-800
Corpo: text-sm text-gray-600
Labels de formulário: text-sm font-medium text-gray-700
Texto auxiliar: text-xs text-gray-500

## Componentes padrão

### Botões
Primário: bg-blue-600 hover:bg-blue-700 text-white
Secundário: bg-white border border-gray-300 hover:bg-gray-50
Perigo: bg-red-600 hover:bg-red-700 text-white
Sempre: rounded-lg px-4 py-2 text-sm font-medium transition-colors

### Cards
bg-white rounded-xl shadow-sm border border-gray-200 p-6

### Tabelas
Cabeçalho: bg-gray-50 text-xs font-medium text-gray-500 uppercase
Linhas: divide-y divide-gray-200 hover:bg-gray-50
Responsivo: overflow-x-auto no container pai

### Formulários
Label + Input sempre em grupo vertical
Input: border border-gray-300 rounded-lg px-3 py-2 text-sm
Foco: focus:ring-2 focus:ring-blue-500 focus:border-blue-500
Erro: border-red-300 + mensagem text-red-600 text-xs abaixo

### Navegação lateral (painéis)
Largura: w-64
Fundo: bg-gray-900 (dark) ou bg-white border-r (light)
Item ativo: bg-blue-600 text-white rounded-lg
Item inativo: text-gray-400 hover:text-white hover:bg-gray-800

## Animações e transições

Usar com moderação. Apenas onde agrega valor:
transition-colors duration-150 — mudanças de cor
transition-opacity duration-200 — aparecer/desaparecer
transform transition-transform — modais e drawers

Nunca animações que atrasam a percepção de velocidade.
```

---

## 16. Plano de Documentação

### Filosofia da documentação

Documentação do AIOS Lite segue o mesmo princípio do framework: menos é mais. Cada documento tem um único objetivo e não repete o que outro já diz. Começa em português (audiência principal) e tem versão em inglês para alcance global.

### Estrutura completa de arquivos

```
docs/
├── pt/
│   ├── inicio-rapido.md
│   ├── como-funciona.md
│   ├── agentes.md
│   ├── onboarding.md
│   ├── multi-agente.md
│   ├── mcp.md
│   ├── makopy.md
│   ├── contribuindo.md
│   └── stacks/
│       ├── laravel-tall.md
│       ├── laravel-jetstream.md
│       ├── rails.md
│       ├── nextjs.md
│       └── node-express.md
├── en/
│   └── [mesma estrutura em inglês]
├── CHANGELOG.md
├── CONTRIBUTING.md
└── CODE_OF_CONDUCT.md
```

### Conteúdo de cada documento

**docs/pt/inicio-rapido.md**
Objetivo: usuário funcionando em menos de 5 minutos.
Conteúdo: pré-requisitos, comando de instalação, primeiro uso com @setup, exemplo de output real. Sem teoria, sem contexto — apenas os passos.

**docs/pt/como-funciona.md**
Objetivo: entender a filosofia e o fluxo antes de usar.
Conteúdo: o problema que resolve, comparação com AIOS original (tabela), diagrama ASCII do fluxo, os três tamanhos de projeto, a lógica de complexidade adaptativa.

**docs/pt/agentes.md**
Objetivo: referência de todos os agentes disponíveis.
Conteúdo: tabela com agente, responsabilidade, quando usar, o que lê, o que produz. Depois seção detalhada de cada um com exemplo de interação real.

**docs/pt/onboarding.md**
Objetivo: guia completo do @setup.
Conteúdo: detecção automática de framework, todos os caminhos de perguntas, o aviso do Jetstream, exemplos de project.context.md gerado para cada stack.

**docs/pt/stacks/laravel-tall.md**
Objetivo: guia específico para Laravel + TALL Stack.
Conteúdo: pré-requisitos, como instalar Jetstream durante a criação, o que o AIOS Lite vai gerar automaticamente, convenções aplicadas, exemplo de projeto criado do zero.

**docs/pt/multi-agente.md**
Objetivo: explicar paralelização para usuários avançados.
Conteúdo: o que é o Agent Teams da Anthropic, como ativar, quando faz sentido usar, exemplo real com @orchestrator, o protocolo de arquivos de status.

**docs/pt/mcp.md**
Objetivo: configurar MCPs no projeto.
Conteúdo: o que é MCP, quais estão disponíveis, como instalar o Context7, como configurar o Database MCP, o arquivo servers.md.

**docs/pt/makopy.md**
Objetivo: entender a integração com a Makopy.
Conteúdo: o que a Makopy faz, divisão de responsabilidades (AIOS Lite = código, Makopy = conteúdo), como configurar o MCP da Makopy, exemplos de uso durante o desenvolvimento.

### README.md principal — Estrutura detalhada

O README é o cartão de visita do projeto. Deve convencer em 30 segundos.

```markdown
# AIOS Lite

> Framework leve de agentes IA para desenvolvimento de software.
> Inspirado no AIOS core. Filosofia: menos é mais.

[badges: npm version, license, node version, CI status]

## Por que AIOS Lite?

[Tabela comparativa]
| | AIOS Core | AIOS Lite |
|---|---|---|
| Agentes para landing page | 7+ agentes | 1-2 agentes |
| Tokens para PRD simples | ~40.000 | ~3.000 |
| Stack assumida | Node.js/Express | Você escolhe |
| Onboarding | Nenhum | Inteligente |
| Multi-IDE | Sim | Sim |
| MCP support | Parcial | Nativo |

## Instalação

```bash
# Novo projeto
npx aios-lite init meu-projeto

# Projeto existente
npx aios-lite install
```

## Como funciona

[Diagrama ASCII do fluxo]

```
Você descreve → @setup coleta a stack → @analyst mapeia requisitos
     → @architect define estrutura → @dev implementa → @qa valida
```

## Compatibilidade

| Ferramenta | Suporte |
|---|---|
| Claude Code | ✅ Completo |
| Codex CLI | ✅ Completo |
| Gemini CLI | ✅ Via slash commands |
| Cursor | ⚠️ Parcial |

## Stacks suportadas

- Laravel + TALL Stack (Livewire + Alpine + Tailwind)
- Laravel + VILT Stack (Vue + Inertia)
- Rails + Tailwind
- Next.js
- Node.js + Express
- E qualquer outra — o @setup sempre pergunta

## Documentação

- [Início rápido](docs/pt/inicio-rapido.md)
- [Como funciona](docs/pt/como-funciona.md)
- [Guia por stack](docs/pt/stacks/)
- [Multi-agente](docs/pt/multi-agente.md)
- [Makopy integration](docs/pt/makopy.md)

## Contribuindo

[CONTRIBUTING.md](CONTRIBUTING.md)

## Licença

MIT — [LICENSE](LICENSE)
```

### CHANGELOG.md — Estrutura

```markdown
# Changelog

Todas as mudanças notáveis seguem o formato [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

## [1.0.0] - YYYY-MM-DD
### Adicionado
- Agentes: @setup, @analyst, @architect, @dev, @qa
- Suporte a Claude Code, Codex CLI e Gemini CLI
- Onboarding inteligente com detecção automática de framework
- Skills estáticas para Laravel TALL Stack e Rails
- Integração com Context7 MCP
- Documentação completa em pt-BR e EN
```

### CONTRIBUTING.md — Estrutura

```markdown
# Como Contribuir

## Tipos de contribuição

**Novos agentes:** Crie um arquivo em `template/.aios-lite/agents/`
seguindo o formato dos agentes existentes.

**Novas skills:** Adicione em `template/.aios-lite/skills/static/`
com exemplos de código reais e testados.

**Suporte a novas stacks:** Adicione detecção no `src/detector.js`
e crie a skill estática correspondente.

**Correções e melhorias:** Abra uma issue descrevendo o problema
antes de enviar o PR.

## Processo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feat/nova-skill-nextjs`
3. Faça suas alterações
4. Teste manualmente (ver Seção 13 do planejamento)
5. Commit: `git commit -m 'feat(skills): adiciona convenções Next.js App Router'`
6. Push e abra o Pull Request

## Padrões

- Commits: conventional commits
- Documentação: sempre em pt-BR primeiro, EN depois
- Skills: sempre com exemplos de código reais
- Agentes: sempre com seção de "Regras deste agente"
```

---

## Referências

- [Synkra AIOS](https://github.com/SynkraAI/aios-core) — inspiração e base conceitual
- [BMad Method](https://github.com/bmad-code-org/BMAD-METHOD) — origem do AIOS
- [Context7 MCP](https://github.com/upstash/context7) — documentação dinâmica
- [Model Context Protocol](https://modelcontextprotocol.io) — protocolo MCP da Anthropic
- [Claude Code Agent Teams](https://docs.anthropic.com/claude-code) — multi-agente nativo
- [Flux UI](https://fluxui.dev) — componentes Livewire modernos
- [Laravel Jetstream](https://jetstream.laravel.com) — auth robusta para Laravel
- [Keep a Changelog](https://keepachangelog.com) — formato de changelog
- [Conventional Commits](https://www.conventionalcommits.org) — padrão de commits

---

*AIOS Lite — Construído para ser open source e servir a comunidade de desenvolvedores.*
*Filosofia: menos é mais, espresso não café aguado, resultado excepcional com o mínimo necessário.*
