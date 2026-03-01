# Engineering Notes

Date: 2026-03-01

## What was added in this iteration
- `doctor --fix` added with safe remediation only:
  - restore missing managed files from template
  - synchronize active agent prompts with `conversation_language` when context is valid
- `doctor --fix --dry-run` added for non-writing preview mode.
- New `test:smoke` command:
  - `aios-lite test:smoke [workspace-path] [--lang=en|pt-BR] [--keep]`
- New automated tests:
  - doctor remediation coverage in `tests/doctor.test.js`
  - smoke command coverage in `tests/smoke.test.js`
- Development baseline bumped to `0.1.4` (package + setup defaults).

## Why this matters
- Reduces manual recovery work for common installation drift.
- Keeps remediation conservative so user business context is never auto-rewritten.
- Makes release confidence higher with a single CLI end-to-end smoke entry point.

## Known limitations
- Agent execution is still manual from the AI CLI perspective; this package does not spawn external AI sessions.
- Locale pack coverage is currently limited to `en` and `pt-BR`.
- `doctor --fix` intentionally does not rewrite `project.context.md` semantic fields.

## Next implementation targets
1. Expand locale packs beyond `en` and `pt-BR` (for example `es`, `fr`) with contribution workflow.
2. Add strict smoke assertions for backup creation on `update`.
3. Add optional machine-readable output mode (`--json`) for CI consumption.
