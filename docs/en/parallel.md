# Parallel Orchestration Guide

Use `parallel:init` to bootstrap the parallel context files used by `@orchestrator`.

## Command

```bash
aios-lite parallel:init [path] [--workers=2..6] [--force] [--dry-run] [--json]
```

Aliases:
- `aios-lite orchestrator:init`
- `aios-lite parallel-init`

## Behavior
- Requires parseable `.aios-lite/context/project.context.md`.
- Only allows `classification=MEDIUM` by default.
- Use `--force` to initialize for other classifications.
- Generates:
  - `.aios-lite/context/parallel/shared-decisions.md`
  - `.aios-lite/context/parallel/agent-N.status.md`

## Prerequisite checks
The command reports whether these files are present:
- `.aios-lite/context/discovery.md`
- `.aios-lite/context/architecture.md`
- `.aios-lite/context/prd.md`

Missing prerequisites are reported but do not block file generation.
