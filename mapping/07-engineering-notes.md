# Engineering Notes

Date: 2026-03-01

## What was added in this iteration
- Doctor now validates `project.context.md` frontmatter contract, not only file existence.
- New CLI support commands:
  - `aios-lite agents`
  - `aios-lite agent:prompt <agent>`
  - `aios-lite context:validate`
- New CLI bootstrap command:
  - `aios-lite setup:context [path]` (interactive and defaults mode)
- Localized agent prompt packs added:
  - `.aios-lite/locales/en/agents/*.md`
  - `.aios-lite/locales/pt-BR/agents/*.md`
- New locale activation command:
  - `aios-lite locale:apply [path] [--lang=en|pt-BR] [--dry-run]`
- `setup:context` now auto-applies localized agent prompts using `conversation_language`.
- Context parser and validator module created (`src/context.js`).
- Agent metadata and prompt helper module created (`src/agents.js`).
- Context writer and classification helper module created (`src/context-writer.js`).

## Why this matters
- Prevents silent misconfiguration from setup output.
- Makes Codex/Claude/Gemini/OpenCode usage more explicit, even without visual agent picker.
- Reduces onboarding confusion by giving copy-paste prompts per tool.
- Aligns full agent interaction language with user choice (`en` or `pt-BR`) across supported AI CLIs.

## Known limitations
- Agent execution is still manual from the AI CLI perspective; this package does not spawn external AI sessions.
- Locale pack coverage is currently limited to `en` and `pt-BR`.

## Next implementation targets
1. Add `doctor --fix` for selected safe auto-fixes.
2. Add `aios-lite test:smoke` command to automate local end-to-end verification.
3. Expand locale packs beyond `en` and `pt-BR` (for example `es`, `fr`) with contribution workflow.
