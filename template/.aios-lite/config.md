# AIOS Lite Config

## Principios
- Menos e mais: complexidade proporcional ao problema.
- Fonte unica: regras em `.aios-lite/agents/`.
- Nao assuma stack: detectar primeiro, perguntar depois.

## Tamanhos
- MICRO: fluxo `@setup -> @dev`
- SMALL: fluxo `@setup -> @analyst -> @architect -> @dev -> @qa`
- MEDIUM: fluxo `@setup -> @analyst -> @architect -> @pm -> @orchestrator -> @dev -> @qa`

## Classificacao oficial
Pontuacao (0-6):
- Tipos de usuario: 1=0, 2=1, 3+=2
- Integracoes externas: 0=0, 1-2=1, 3+=2
- Regras nao obvias: nao=0, algumas=1, complexas=2

Faixas:
- 0-1: MICRO
- 2-3: SMALL
- 4-6: MEDIUM

## Contrato de contexto
`project.context.md` deve ter frontmatter YAML com:
- `project_name`
- `project_type`
- `profile`
- `framework`
- `framework_installed` (boolean)
- `classification`
- `aios_lite_version`
