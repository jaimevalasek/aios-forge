# Parallel Orchestration Guide

Use `parallel:init` to bootstrap the parallel context files used by `@orchestrator`.

## Command

```bash
aios-forge parallel:init [path] [--workers=2..6] [--force] [--dry-run] [--json]
```

Aliases:
- `aios-forge orchestrator:init`
- `aios-forge parallel-init`

## Behavior
- Requires parseable `.aios-forge/context/project.context.md`.
- Only allows `classification=MEDIUM` by default.
- Use `--force` to initialize for other classifications.
- Generates:
  - `.aios-forge/context/parallel/shared-decisions.md`
  - `.aios-forge/context/parallel/agent-N.status.md`

## Prerequisite checks
The command reports whether these files are present:
- `.aios-forge/context/discovery.md`
- `.aios-forge/context/architecture.md`
- `.aios-forge/context/prd.md`

Missing prerequisites are reported but do not block file generation.

## Scope assignment

```bash
aios-forge parallel:assign
aios-forge parallel:assign --source=architecture --workers=3
aios-forge parallel:assign --source=prd
aios-forge parallel:assign --dry-run
```

Aliases:
- `aios-forge orchestrator:assign`
- `aios-forge parallel-assign`

Behavior:
- Reads scope candidates from `prd`, `architecture`, or `discovery` context docs.
- Distributes scope items across lane files in round-robin mode.
- Updates `## Scope` section and `updated_at` in each lane file.
- Appends a decision-log entry to `shared-decisions.md` when present.

## Status overview

```bash
aios-forge parallel:status
aios-forge parallel:status --json
```

Aliases:
- `aios-forge orchestrator:status`
- `aios-forge parallel-status`

Behavior:
- Reads all `agent-N.status.md` lane files under `.aios-forge/context/parallel`.
- Aggregates lane status counts, scope counts, blocker counts, and deliverable progress.
- Includes shared decision log entry count from `shared-decisions.md` when present.
- Returns a structured machine-readable report with `--json`.

## Diagnose and repair

```bash
aios-forge parallel:doctor
aios-forge parallel:doctor --workers=3
aios-forge parallel:doctor --fix
aios-forge parallel:doctor --fix --dry-run
```

Aliases:
- `aios-forge orchestrator:doctor`
- `aios-forge parallel-doctor`

Notes:
- `--fix` can recreate missing `shared-decisions.md` and missing lane files.
- For non-`MEDIUM` projects, `--fix` requires `--force`.
