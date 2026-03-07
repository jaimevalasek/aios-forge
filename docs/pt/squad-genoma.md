# Squad e Genoma

> Guia prático para usar `@squad` e `@genoma` no AIOS Lite sem confundir time operacional, skill e camada cognitiva.

---

## Visão rápida

`@squad` e `@genoma` resolvem problemas diferentes:

- `@squad` cria uma **squad modular** em `agents/{squad-slug}/`
- `@genoma` cria uma **base estruturada de conhecimento e lentes cognitivas** em `.aios-lite/genomas/{slug}.md`

Em termos simples:

- `skill` define **o que saber fazer**
- `genoma` define **como pensar**
- `@squad` organiza isso em **manifesto, executores, output, logs e media**
- o `@orquestrador` gerado para cada squad consolida o trabalho em HTML

---

## Distinção central: skill, genoma, executor e subagente

Essa separação precisa ficar estável no sistema:

- `skill` é capacidade operacional reutilizável
- `genoma` é lente cognitiva, repertório e forma de pensar
- `agente executor` é um trabalhador permanente da squad
- `subagente` é uma unidade temporária de investigação, comparação ou paralelismo
- `agents.md` é o manifesto curto da squad, não é um executor

### Skill

Use skill para descrever algo como:

- estruturar roteiro
- revisar arquitetura
- sintetizar briefing
- analisar hook
- extrair critérios de aceite

Skill responde à pergunta:

> "O que este sistema sabe fazer bem?"

### Genoma

Use genoma para descrever algo como:

- mente de estrategista editorial
- mente de copywriter de retenção
- mente de advogado cético
- mente de criador viral

Genoma responde à pergunta:

> "Com que lentes este sistema pensa, julga e escolhe?"

### Agente executor

É o papel operacional fixo do squad:

- `@roteirista-viral`
- `@copywriter-de-titulos`
- `@analista-de-retencao`
- `@orquestrador`

### Subagente

É temporário e não define a identidade principal da squad.

Use para:

- pesquisa ampla
- comparação de alternativas
- resumo de material grande
- leitura paralela

Não use subagente como substituto de:

- skill
- genoma
- executor permanente

---

## O que é um squad

Um squad é uma unidade operacional modular criada para um objetivo específico.

Ela não é só uma pasta com agentes. Uma squad bem formada tem:

- manifesto curto em `agents/{squad-slug}/agents.md`
- manifesto estruturado em `agents/{squad-slug}/squad.manifest.json`
- `design-doc` local em `agents/{squad-slug}/design-doc.md`
- `readiness` local em `agents/{squad-slug}/readiness.md`
- executores permanentes em `agents/{squad-slug}/`
- metadata em `.aios-lite/squads/{slug}.md`
- outputs em `output/{squad-slug}/`
- logs em `aios-logs/{squad-slug}/`
- mídia em `media/{squad-slug}/`

Antes de escrever essa estrutura, o `@squad` deve consolidar um mini pacote de:

- discovery do problema
- design doc do escopo atual
- leitura de prontidao

Quando esse pacote e materializado, ele passa a existir como parte da squad:

- `agents/{squad-slug}/design-doc.md`
- `agents/{squad-slug}/readiness.md`

Esse passo existe para evitar squads montadas em cima de contexto vago demais.
Na pratica, o `@squad` decide:

- se o pedido parece `modo projeto` ou `modo feature`
- quais skills e documentos realmente precisam entrar agora
- o que pode ficar fora do contexto ativo por enquanto

Exemplo:

```text
agents/youtube-creator/
  agents.md
  squad.manifest.json
  roteirista-viral.md
  estrategista-de-titulos.md
  analista-de-retencao.md
  copywriter-de-thumbnail.md
  orquestrador.md
```

Esses agentes não são os agentes oficiais da aios-lite. Eles são executores do seu projeto.

---

## O que é um genoma

Um genoma é um artefato de domínio e cognição. Ele descreve:

- `O que saber`: conceitos, tensões, heurísticas e linguagem do domínio
- `Mentes`: perspectivas cognitivas úteis para pensar naquele domínio
- `Padrões de julgamento`: o que valorizar, evitar e tensionar
- `Skills`: fragmentos curtos de capacidade reutilizável que podem nascer desse domínio

Exemplo:

```text
.aios-lite/genomas/storytelling-retencao-youtube.md
```

Esse genoma não faz trabalho sozinho. Ele não substitui o agente. Ele não substitui skill. Ele enriquece a forma como os agentes executam suas skills.

### Como pensar no genoma na prática

O jeito mais útil de entender genoma é:

- `skill` = ferramenta
- `genoma` = mente

Exemplo:

- o agente `@roteirista-viral` pode ter a skill de `roteiro-short-form`
- o genoma `storytelling-retencao-youtube` muda como esse agente pensa:
  - que tipo de hook priorizar
  - que tensão narrativa abrir
  - que payoff prometer
  - o que evitar por soar genérico

Então, para o sistema:

- skill sem genoma pode executar
- genoma sem skill não executa
- executor com skill + genoma tende a entregar melhor

---

## Genoma não é clone literal de pessoa

Se você quiser usar uma inspiração autoral, prefira este pensamento:

- melhor: `genoma de estilo editorial`
- melhor: `genoma de raciocínio`
- melhor: `genoma de storytelling`
- evitar como regra principal: `clone da pessoa X`

O uso mais saudável é:

- "genoma de copy de retenção"
- "genoma de estratégia editorial para YouTube"
- "genoma de narrativa emocional"

Isso deixa o sistema:

- mais reutilizável
- mais consistente
- menos confuso com persona, executor e skill

---

## Relação entre squad e genoma

O modelo recomendado é:

1. criar o squad
2. criar ou importar genomas
3. aplicar genomas ao squad inteiro ou a agentes específicos
4. chamar os agentes normalmente

Depois que o genoma é aplicado, o usuário não deveria precisar repetir isso em toda sessão.
O vínculo precisa ficar salvo no metadata do squad e refletido no manifesto da squad.

Exemplo:

```text
.aios-lite/squads/youtube-creator.md
```

```md
Squad: YouTube Creator
Mode: Squad
Goal: Criar conteúdos virais com retenção forte
Agents: agents/youtube-creator/
Manifest: agents/youtube-creator/squad.manifest.json
Output: output/youtube-creator/
Logs: aios-logs/youtube-creator/
Media: media/youtube-creator/
LatestSession: output/youtube-creator/latest.html

Genomes:
- .aios-lite/genomas/storytelling-retencao-youtube.md

AgentGenomes:
- roteirista-viral: .aios-lite/genomas/redacao-emocional-youtube.md
- copywriter-thumbnail: .aios-lite/genomas/copy-ctr-youtube.md
```

---

## Estrutura modular que o `@squad` deve gerar

O contrato atual esperado de uma squad é este:

```text
agents/{squad-slug}/
  agents.md
  squad.manifest.json
  orquestrador.md
  {executor-1}.md
  {executor-2}.md

output/{squad-slug}/
aios-logs/{squad-slug}/
media/{squad-slug}/
.aios-lite/squads/{squad-slug}.md
```

### `agents.md`

É o manifesto curto da squad.

Deve explicar:

- missão
- faz
- não faz
- executores permanentes
- skills da squad
- MCPs da squad
- política de subagentes
- saídas e revisão

### `squad.manifest.json`

É a versão estruturada da mesma squad, pensada para:

- SQLite local
- dashboard
- export/import
- sync com `aioslite.com`

Ou seja:

- `agents.md` é a leitura curta para humano/LLM
- `squad.manifest.json` é o contrato para sistema

---

## Separação de responsabilidades

O fluxo recomendado agora é mais direto:

- `@squad` cria e mantém squads
- `@genoma` cria e aplica genomas

Na prática:

- `@squad` não deve abrir perguntando entre Lite e Genoma
- `@squad` entra direto nas perguntas para criação da squad
- `@genoma` é chamado separadamente quando o usuário quiser enriquecer a squad

---

## Fluxo recomendado de uso

### Cenário 1: criar um squad

Exemplo:

```text
@squad
Quero montar um squad para YouTube.

Domínio: YouTube Creator focado em vídeos longos
Objetivo: criar roteiros mais fortes e títulos com CTR alto
Output: roteiros, títulos, ideias de thumbnail
Restrições: público brasileiro, tom direto, sem clickbait vazio
Papéis: pode escolher
```

Resultado esperado:

- criação de manifesto em `agents/youtube-creator/agents.md`
- criação de manifesto JSON em `agents/youtube-creator/squad.manifest.json`
- criação de executores em `agents/youtube-creator/`
- criação de metadata em `.aios-lite/squads/youtube-creator.md`
- criação de `output/youtube-creator/`, `aios-logs/youtube-creator/` e `media/youtube-creator/`
- geração de `output/youtube-creator/latest.html`

### Cenário 2: criar um genoma depois

```text
@genoma
Quero um genoma para storytelling com retenção alta em vídeos longos do YouTube Brasil.
```

Depois:

```text
Aplicar este genoma ao squad youtube-creator.
Aplicar especialmente ao agente @roteirista-viral.
```

Resultado esperado:

- genoma salvo em `.aios-lite/genomas/...`
- vínculo salvo no metadata do squad
- manifesto da squad refletindo o vínculo
- agente `roteirista-viral.md` reescrito com `## Genomas ativos`

### Cenário 3: usar o agente depois disso

```text
@roteirista-viral
Crie um roteiro para um vídeo sobre como aprender inglês sem pagar curso.
```

O agente já deve operar com os genomas vinculados, sem o usuário repetir tudo.

---

## Arquivos gerados

### Squad

```text
agents/{squad-slug}/
output/{squad-slug}/
.aios-lite/squads/{squad-slug}.md
aios-logs/{squad-slug}/
media/{squad-slug}/
```

### Genoma

```text
.aios-lite/genomas/{genoma-slug}.md
```

### Registro nos gateways

Quando o squad é criado, o comportamento esperado é registrar os agentes dinâmicos nos gateways do projeto:

- `CLAUDE.md` para uso via `/agente` no Claude Code
- `AGENTS.md` para uso via `@agente` no Codex

### Drafts, mídia e HTML final

O fluxo recomendado é:

1. cada agente especialista gera conteúdo intermediário em Markdown
2. o `@orquestrador` do squad consolida esse material
3. o `@orquestrador` publica o HTML final da sessão
4. qualquer arquivo de mídia vai para `media/{squad-slug}/`

Exemplo:

```text
output/youtube-creator/
  2026-03-06-153000-roteiro-roteirista-viral.md
  2026-03-06-153000-copy-copywriter-thumbnail.md
  2026-03-06-153000-video-ingles.html
  latest.html

media/youtube-creator/
  referencia-thumb-01.png
  frame-estudo-02.jpg
  audio-gancho-01.mp3
```

Regra prática:

- texto, markdown, html, json e logs podem ser indexados e acompanhados no runtime
- mídia deve ficar no filesystem do projeto em `media/`

---

## Regras importantes

### 1. O orquestrador responsável pelo HTML é o do squad

Não é o `@orchestrator` oficial da aios-lite.

É o `@orquestrador` gerado dentro de `agents/{squad-slug}/`.

### 2. Genoma não deve alterar agentes oficiais da aios-lite

Não aplique genomas customizados do usuário em:

```text
.aios-lite/agents/
```

Os genomas devem ser aplicados aos agentes criados em:

```text
agents/{squad-slug}/
```

### 3. O usuário pode mandar contexto grande

Tanto no `@squad` quanto no `@genoma`, o usuário pode enviar:

- textos longos
- PDFs ou arquivos
- prints
- imagens
- anotações brutas
- exemplos de referência

### 4. Um genoma pode ser do squad inteiro ou de um agente

Use no squad inteiro quando o contexto vale para todos.

Use por agente quando o contexto for específico.

### 5. HTML final não substitui o chat

O agente ainda responde na sessão.

O HTML é o entregável persistido e organizado para consulta e cópia.

### 6. Estrutura de pastas deve ser leve

Prefira:

- `agents/{squad-slug}/`
- `output/{squad-slug}/`
- `aios-logs/{squad-slug}/`
- `media/{squad-slug}/`

Evite criar subpastas demais sem necessidade.

---

## Qualidade mínima das respostas

Os agentes do squad não devem responder só com frases curtas e genéricas.

O comportamento esperado é:

- leitura do problema ou diagnóstico
- recomendação principal
- justificativa específica
- tradeoff, risco ou tensão
- próximo passo prático

Se a tarefa pedir um artefato final:

- o agente entrega primeiro o artefato
- depois explica por que aquela solução faz sentido

---

## Direção visual do HTML

O HTML final do squad deve seguir um dark theme mais confortável e premium.

Direção recomendada:

- dark sofisticado e técnico
- contraste controlado
- superfícies em camadas discretas
- bordas suaves
- no máximo 2 cores de acento

Evite:

- glow verde forte
- neon exagerado
- fundo preto puro com branco chapado
- arco-íris de bordas por card
- gradientes pesados que cansam a leitura

---

## Boas práticas

- comece criando a squad antes de enriquecer com genomas
- aplique genomas ao menor escopo possível
- use `agents.md` como mapa curto da squad
- use `squad.manifest.json` como contrato de runtime e sync
- deixe o orquestrador do squad cuidar do HTML final
- use drafts `.md` para manter rastreabilidade entre agentes e entregável final

---

## O que ainda vem pela frente

O modelo atual já suporta squads modulares, publish/import e genomas vinculados.

Os próximos blocos naturais do framework são:

- capability oficial de `Discovery / Design-Doc`
- score formal de prontidão antes de implementação
- uso mais claro de skills e arquivos sob demanda
- herança disso pelo `@squad` na criação de novas squads

Ou seja: a base de squad/genoma já existe, mas ainda vai ficar mais forte quando o fluxo completo de discovery/design estiver costurado no core.
