# AIOS Lite

Lightweight AI agent framework for software projects.

## Install

```bash
npx aios-lite init my-project
# or
npx aios-lite install
```

## Commands
- `aios-lite init <project-name>`
- `aios-lite install [path]`
- `aios-lite update [path]`
- `aios-lite info [path]`
- `aios-lite doctor [path] [--fix] [--dry-run]`
- `aios-lite i18n:add <locale>`
- `aios-lite setup:context [path]`
- `aios-lite agents`
- `aios-lite agent:prompt <agent> [--tool=codex|claude|gemini|opencode]`
- `aios-lite context:validate [path]`
- `aios-lite locale:apply [path] [--lang=en|pt-BR]`
- `aios-lite test:smoke [workspace-path] [--lang=en|pt-BR] [--keep]`

## Agent usage helper
If your AI CLI does not show a visual agent picker, use:

```bash
aios-lite agents
aios-lite agent:prompt setup --tool=codex
aios-lite locale:apply --lang=pt-BR
aios-lite doctor --fix
aios-lite test:smoke --lang=pt-BR
```

## i18n
CLI localization is supported with:
- `--locale=<code>`
- `AIOS_LITE_LOCALE=<code>`

Default locale is `en`.

Generate a new locale scaffold:

```bash
aios-lite i18n:add fr
```

## Multi-IDE support
- Claude Code (`CLAUDE.md`)
- Codex CLI (`AGENTS.md`)
- Gemini CLI (`.gemini/GEMINI.md`)
- OpenCode (`OPENCODE.md`)

## Docs
- i18n guide: `docs/en/i18n.md`
- release guide: `docs/en/release.md`
- release flow: `docs/en/release-flow.md`
- release notes template: `docs/en/release-notes-template.md`

## License
MIT
