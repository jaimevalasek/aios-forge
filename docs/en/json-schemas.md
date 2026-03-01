# JSON Schemas

AIOS Lite exposes machine-readable JSON output on selected commands.

This folder provides formal schemas for automation:
- `docs/en/schemas/index.json`
- `docs/en/schemas/*.schema.json`

## Commands covered
- `aios-lite init <project-name> --json`
- `aios-lite install [path] --json`
- `aios-lite update [path] --json`
- `aios-lite info --json`
- `aios-lite agents [path] --json`
- `aios-lite agent:prompt <agent> [path] --json`
- `aios-lite locale:apply [path] --json`
- `aios-lite setup:context [path] --defaults --json`
- `aios-lite i18n:add <locale> --dry-run --json`
- `aios-lite doctor --json`
- `aios-lite context:validate --json`
- `aios-lite test:smoke --json`
- `aios-lite mcp:init --json`
- `aios-lite mcp:doctor --json`
- `aios-lite test:package --json`
- `aios-lite workflow:plan --json`
- `aios-lite parallel:init --json`
- `aios-lite parallel:assign --json`
- `aios-lite parallel:status --json`
- `aios-lite parallel:doctor --json`
- Generic CLI JSON errors (`unknown_command`, `command_error`)

## Compatibility policy
- Keys listed in each schema `required` array are stable for automation.
- New optional keys may be added in future releases.
- Removing or renaming required keys is a breaking change and must be called out in release notes.

## Suggested validation flow
1. Load schema from `docs/en/schemas/index.json`.
2. Validate command output against the corresponding schema.
3. Treat missing required keys as contract breakage.
4. Ignore unknown keys unless your integration explicitly disallows them.
